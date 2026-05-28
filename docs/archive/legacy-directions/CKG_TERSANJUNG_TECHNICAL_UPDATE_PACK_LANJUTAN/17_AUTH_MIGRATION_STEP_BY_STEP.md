# 17 — Migrasi Auth Step-by-Step Tanpa Merusak Login Lama

## Target
Mengganti pola login username/PIN client-side menjadi pola lebih aman.

## Risiko saat ini
Jika status login dan role hanya disimpan di browser storage, user teknis bisa memanipulasi UI. Untuk sistem data kesehatan, ini tidak cukup.

## Strategi aman
Gunakan migrasi bertahap:
1. pusatkan auth session;
2. pindahkan role read ke satu service;
3. tambahkan Firebase Auth/custom claims;
4. update Firestore Rules;
5. matikan login lama.

## Step 1 — Buat adapter auth
File:
```txt
src/auth/authService.js
```

Isi fungsi:
```js
export async function loginWithLegacyPin(username, pin) {}
export async function logout() {}
export async function getCurrentUserProfile() {}
export function onAuthChanged(callback) {}
```

Semua komponen wajib memakai fungsi ini. Jangan query `staff` langsung dari halaman.

## Step 2 — Buat session hook
File:
```txt
src/auth/useAuthSession.js
```

Return:
```js
{
  loading,
  user,
  staffProfile,
  role,
  permissions,
  isAuthenticated,
  logout
}
```

## Step 3 — Hilangkan pembacaan role langsung
Cari:
```bash
grep -R "sessionStorage.getItem" -n src
```

Ganti dengan:
```js
const { role, permissions } = useAuthSession();
```

## Step 4 — Permission mapping
File:
```txt
src/auth/permissions.js
```

Contoh:
```js
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'VIEW_DASHBOARD',
  MANAGE_STAFF: 'MANAGE_STAFF',
  CREATE_PATIENT: 'CREATE_PATIENT',
  UPDATE_PATIENT: 'UPDATE_PATIENT',
  OPEN_POS_1: 'OPEN_POS_1',
  OPEN_POS_2: 'OPEN_POS_2',
  FINALIZE_VISIT: 'FINALIZE_VISIT',
  EXPORT_REPORT: 'EXPORT_REPORT',
};

export const ROLE_PERMISSIONS = {
  superadmin: Object.values(PERMISSIONS),
  admin: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.EXPORT_REPORT],
  loket: [PERMISSIONS.CREATE_PATIENT, PERMISSIONS.UPDATE_PATIENT, PERMISSIONS.OPEN_POS_1],
  pos1: [PERMISSIONS.OPEN_POS_1],
  pos2: [PERMISSIONS.OPEN_POS_2],
};
```

## Step 5 — Protected component
File:
```txt
src/auth/RequirePermission.jsx
```

Behavior:
- jika loading: tampilkan skeleton;
- jika belum login: redirect login;
- jika tidak punya permission: tampilkan halaman akses ditolak;
- jangan render children sebelum lolos permission.

## Step 6 — Firebase Auth fase 2
Tambahkan akun staf ke Firebase Auth:
- email internal atau generated email;
- custom claims role;
- profile tetap di collection `staff`.

Flow:
```txt
Firebase Auth UID -> staff/{uid} -> role/permissions
```

## Step 7 — Firestore Rules
Rules minimum:
```txt
- hanya user authenticated boleh baca data sesuai role;
- hanya role tertentu boleh export;
- hanya role tertentu boleh update staff;
- audit_logs tidak boleh diedit/hapus dari client.
```

## Step 8 — Matikan login lama
Setelah semua staf bisa login baru:
- hapus input PIN lama;
- hapus query PIN dari client;
- hapus field PIN plaintext dari Firestore;
- jika perlu simpan hash, jangan diverifikasi di client.

## Acceptance criteria
- Mengubah `sessionStorage` manual tidak membuka halaman protected.
- Role salah tidak bisa membaca/menulis data di Firestore.
- Semua route utama memakai `RequirePermission`.
- Logout membersihkan state dan unsubscribe listener.
