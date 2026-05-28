# SPRINT 1 — Security, Auth, Role, dan Firestore Rules

## Tujuan
Mengurangi risiko manipulasi login, role, dan akses data pasien.

## Prinsip Wajib
Frontend bukan security layer. Role di React hanya untuk tampilan. Keamanan harus dikunci di Firebase Auth, custom claims, dan Firestore Rules.

## Langkah 1 — Inventarisasi Auth Saat Ini
Cari semua penggunaan:
```js
sessionStorage
localStorage
staff
role
isAuthenticated
pin
username
```

Buat file:
`docs/internal/AUTH_USAGE_MAP.md`

Isi:
- file,
- baris,
- fungsi,
- risiko,
- rencana pengganti.

## Langkah 2 — Buat Modul Permission Tunggal
Buat:
```txt
src/features/auth/
  authState.js
  permissions.js
  RequireRole.jsx
  sessionGuard.js
```

`permissions.js` wajib berisi matrix role:
```js
export const ROLE_PERMISSIONS = {
  admin: ['*'],
  loket: ['patient:create', 'queue:manage', 'pos1:write'],
  pos1: ['pos1:write', 'patient:read'],
  pos2: ['pos2:write', 'patient:read'],
  viewer: ['dashboard:read', 'tv:read']
}
```

Jangan gunakan role hardcoded tersebar di komponen.

## Langkah 3 — Migrasi Bertahap
Tahap aman:
1. Pertahankan login lama sementara.
2. Tambahkan wrapper permission baru.
3. Pindahkan route guard ke `RequireRole.jsx`.
4. Setelah stabil, baru ganti login ke Firebase Auth.

## Langkah 4 — Firestore Rules Draft
Buat file:
`firestore.rules.draft`

Wajib memisahkan:
- staff,
- patients,
- visits,
- queue,
- reports,
- auditLogs,
- tvDisplay.

Aturan minimal:
- pasien hanya bisa dibaca petugas aktif/role tertentu,
- auditLogs hanya create, tidak boleh update/delete dari client,
- staff tidak boleh dibaca semua user,
- export/report hanya role admin/supervisor.

## Langkah 5 — Audit Log Auth
Setiap login/logout gagal/berhasil tulis audit log:
```js
{
  action: 'AUTH_LOGIN_SUCCESS',
  userId,
  role,
  timestamp,
  userAgent,
  source: 'web'
}
```

## Checklist
- [ ] Tidak ada role hardcoded baru.
- [ ] Permission matrix dibuat.
- [ ] Route guard memakai `RequireRole`.
- [ ] Draft Firestore Rules dibuat.
- [ ] Audit log auth ditambahkan.
- [ ] Login lama belum dihapus sebelum login baru stabil.

## Acceptance Criteria
- User role loket tidak bisa membuka halaman admin lewat URL.
- User viewer tidak bisa menulis data pasien.
- Audit login muncul.
- Build sukses.
