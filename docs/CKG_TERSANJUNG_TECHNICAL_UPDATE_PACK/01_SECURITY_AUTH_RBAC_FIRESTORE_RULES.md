# 01 — Security, Auth, RBAC, dan Firestore Rules

## Masalah Yang Harus Diperbaiki

Saat ini pola login masih rawan:
- Login mengecek `username`, `pin`, dan `isActive` langsung ke collection `staff`.
- Status auth disimpan manual di `sessionStorage`.
- Role disimpan di frontend.
- Route protection hanya berbasis React.
- Jika Firestore Rules longgar, user bisa membaca/menulis data di luar haknya.

## Target Akhir

- Auth memakai Firebase Authentication atau minimal backend callable untuk verifikasi PIN.
- PIN tidak pernah dibaca langsung oleh client.
- Role utama disimpan sebagai custom claims atau divalidasi backend.
- Firestore Rules menjadi pagar keamanan utama.
- Frontend tetap punya permission check untuk UX, tetapi bukan keamanan final.
- Semua aksi penting tercatat di audit log.

---

## Tahap 1 — Buat Modul Permission Terpusat

Buat file:

```txt
src/features/auth/roles.js
```

Isi awal:

```js
export const ROLES = {
  ADMIN: 'admin',
  PETUGAS: 'petugas',
  TTLM: 'ttlm',
  PERAWAT: 'perawat',
  PERAWAT_BIDAN: 'perawat_bidan',
  DOKTER: 'dokter',
  APOTEKER: 'apoteker',
};

export const MODULE_ACCESS = {
  loket: [ROLES.ADMIN, ROLES.PETUGAS, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN, ROLES.DOKTER, ROLES.TTLM, ROLES.APOTEKER],
  pos1: [ROLES.ADMIN, ROLES.PETUGAS],
  pos2: [ROLES.ADMIN, ROLES.TTLM, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN],
  pos3: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN],
  pos4: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.APOTEKER],
  pos5: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN, ROLES.APOTEKER],
  pos6: [ROLES.ADMIN, ROLES.DOKTER],
  pos7: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN, ROLES.APOTEKER],
  dashboard: [ROLES.ADMIN, ROLES.DOKTER],
  simpeg: [ROLES.ADMIN],
  field: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN],
};

export function normalizeRoles(rawRoles) {
  if (!rawRoles) return [];
  if (Array.isArray(rawRoles)) return rawRoles.map(String).map((r) => r.trim()).filter(Boolean);
  if (typeof rawRoles === 'string') {
    try {
      const parsed = JSON.parse(rawRoles);
      return normalizeRoles(parsed);
    } catch {
      return rawRoles.split(',').map((r) => r.trim()).filter(Boolean);
    }
  }
  return [String(rawRoles).trim()].filter(Boolean);
}

export function hasAnyRole(userRoles, allowedRoles = []) {
  const roles = normalizeRoles(userRoles);
  if (roles.includes(ROLES.ADMIN)) return true;
  return allowedRoles.some((role) => roles.includes(role));
}
```

### Acceptance Criteria
- Tidak ada lagi definisi role berulang di banyak file.
- `App.jsx` mengambil role dari modul ini.
- Jika role baru ditambah, cukup update satu file.

---

## Tahap 2 — Buat Auth Service

Buat file:

```txt
src/features/auth/authService.js
```

Versi transisi sementara:

```js
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AUTH_KEYS = {
  isAuthenticated: 'isAuthenticated',
  username: 'username',
  namaPegawai: 'namaPegawai',
  rolePegawai: 'rolePegawai',
  staffId: 'staffId',
};

export function sanitizeUsername(username) {
  return String(username || '').toLowerCase().replace(/\s/g, '');
}

export function getCurrentSession() {
  return {
    isAuthenticated: sessionStorage.getItem(AUTH_KEYS.isAuthenticated) === 'true',
    username: sessionStorage.getItem(AUTH_KEYS.username),
    namaPegawai: sessionStorage.getItem(AUTH_KEYS.namaPegawai),
    rolePegawai: sessionStorage.getItem(AUTH_KEYS.rolePegawai),
    staffId: sessionStorage.getItem(AUTH_KEYS.staffId),
  };
}

export function clearSession() {
  Object.values(AUTH_KEYS).forEach((key) => sessionStorage.removeItem(key));
}

export function setSessionFromStaff(username, staffId, staffData) {
  sessionStorage.setItem(AUTH_KEYS.isAuthenticated, 'true');
  sessionStorage.setItem(AUTH_KEYS.username, sanitizeUsername(username));
  sessionStorage.setItem(AUTH_KEYS.namaPegawai, staffData.nama || '');
  sessionStorage.setItem(AUTH_KEYS.rolePegawai, JSON.stringify(staffData.role || []));
  sessionStorage.setItem(AUTH_KEYS.staffId, staffId);
}

export async function legacyPinLogin(username, pin) {
  const cleanUsername = sanitizeUsername(username);
  const q = query(
    collection(db, 'staff'),
    where('username', '==', cleanUsername),
    where('pin', '==', pin),
    where('isActive', '==', true)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc = snap.docs[0];
  return {
    staffId: doc.id,
    staff: doc.data(),
  };
}
```

### Catatan
Ini masih mode transisi, bukan final security. Tujuannya agar kode login tidak langsung berserakan.

---

## Tahap 3 — Refactor Login.jsx

Ubah `Login.jsx` agar memakai `authService`.

Checklist:
- [ ] Import `legacyPinLogin`, `setSessionFromStaff`, `sanitizeUsername`.
- [ ] Jangan query Firestore langsung di `Login.jsx`.
- [ ] Simpan `staffId` ke session.
- [ ] Log aktivitas tetap jalan.
- [ ] Error message tetap ramah.
- [ ] Loading state tetap ada.

Pseudo implementasi:

```js
const result = await legacyPinLogin(username, pin);

if (!result) {
  setError('Username atau PIN salah, atau akun tidak aktif.');
  return;
}

setSessionFromStaff(username, result.staffId, result.staff);
await logActivity('Berhasil masuk ke dalam sistem aplikasi', 'Autentikasi Sistem');
navigate('/');
```

---

## Tahap 4 — Roadmap Migrasi Auth Final

Buat file dokumen internal:

```txt
docs/SECURITY_AUTH_MIGRATION_PLAN.md
```

Isi:
1. Daftar semua role.
2. Daftar semua collection.
3. Daftar aksi per role.
4. Rencana migrasi staff ke Firebase Auth.
5. Rencana custom claims.
6. Rencana penonaktifan field `pin`.

### Skema staff final

```js
staff/{staffId} = {
  uid: 'firebase-auth-uid',
  username: 'nama.login',
  nama: 'Nama Lengkap',
  role: ['dokter'],
  isActive: true,
  puskesmasId: 'malimpung',
  createdAt,
  updatedAt
}
```

### Jangan simpan final:
```js
pin: '123456'
```

---

## Tahap 5 — Firestore Rules Draft

Buat file:

```txt
firestore.rules
```

Draft awal:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function roles() {
      return request.auth.token.roles == null ? [] : request.auth.token.roles;
    }

    function hasRole(role) {
      return signedIn() && role in roles();
    }

    function isAdmin() {
      return hasRole('admin');
    }

    function isClinicalStaff() {
      return signedIn() && (
        hasRole('dokter') ||
        hasRole('perawat') ||
        hasRole('perawat_bidan') ||
        hasRole('ttlm') ||
        hasRole('apoteker') ||
        hasRole('petugas')
      );
    }

    match /staff/{staffId} {
      allow read: if signedIn() && (isAdmin() || request.auth.uid == resource.data.uid);
      allow create, update, delete: if isAdmin();
    }

    match /patients/{patientId} {
      allow read: if isClinicalStaff();
      allow create: if isClinicalStaff();
      allow update: if isClinicalStaff();
      allow delete: if isAdmin();
    }

    match /visits/{visitId} {
      allow read: if isClinicalStaff();
      allow create: if isClinicalStaff();
      allow update: if isClinicalStaff();
      allow delete: if isAdmin();
    }

    match /auditLogs/{logId} {
      allow create: if signedIn();
      allow read: if isAdmin() || hasRole('dokter');
      allow update, delete: if false;
    }

    match /panggilan_tv/{docId} {
      allow read: if true;
      allow write: if isClinicalStaff();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Penting
Rules ini draft. Sesuaikan nama collection aktual di kode.

---

## Tahap 6 — Audit Log Wajib

Buat helper:

```txt
src/utils/auditLog.js
```

Field wajib audit:

```js
{
  action: 'VISIT_UPDATE',
  module: 'POS2',
  visitId,
  patientId,
  actor: {
    staffId,
    username,
    nama,
    roles
  },
  before: {},
  after: {},
  createdAt,
  device: {
    userAgent,
    path
  }
}
```

Aksi wajib dicatat:
- Login sukses.
- Login gagal berulang.
- Tambah pasien.
- Update data identitas.
- Update hasil pos.
- Finalisasi rapor.
- Cetak rapor.
- Export Excel/PDF.
- Hapus data.
- Ubah role pegawai.

---

## Tahap 7 — Rate Limit Login

Minimal di frontend:
- Disable tombol login 2 detik setelah gagal.
- Setelah 5 kali gagal, cooldown 60 detik.

Lebih baik di backend:
- Simpan login attempt per username/device.
- Lock sementara.

---

## Testing

Manual test:
1. Login role `petugas`.
2. Pastikan hanya Loket dan Pos1 yang bisa diakses.
3. Buka route `/admin` langsung.
4. Harus ditolak.
5. Manipulasi sessionStorage role menjadi `admin`.
6. Jika Firestore Rules sudah aktif, data admin tetap tidak bisa ditulis.
7. Login dokter.
8. Cek akses Pos6, Pos7, Dashboard.
9. Logout.
10. Refresh browser.
11. Tidak boleh tetap masuk tanpa auth valid.

## Definition of Done

- Query login tidak berserakan di component.
- Role definition satu sumber.
- Ada draft Firestore Rules.
- Ada audit log helper.
- Ada dokumen migrasi Auth.
- Build sukses.
