# Migrasi Staff ke Firebase Auth

Dokumen ini melengkapi ARAHAN_1 untuk memindahkan login dari data `staff` legacy ke Firebase Authentication.

## Prasyarat

1. Aktifkan provider Email/Password di Firebase Authentication.
2. Pastikan ada akun admin Firebase Auth dengan email:

```txt
admin@tersanjung.local
```

3. Pastikan dokumen `users/{uid-admin}` berisi minimal:

```json
{
  "username": "admin",
  "nama": "Administrator Utama",
  "roles": ["admin", "petugas"],
  "isActive": true
}
```

## Dry Run

```bash
npm run migrate:auth -- --admin-user=admin --admin-pin=123456
```

Dry-run hanya membaca `staff` dan menampilkan akun yang akan dibuat.

## Commit

```bash
npm run migrate:auth -- --admin-user=admin --admin-pin=123456 --commit
```

Skrip akan:

- Membaca koleksi `staff`.
- Membuat akun Firebase Auth dengan email `username@tersanjung.local`.
- Menggunakan `pin` staff sebagai password awal.
- Membuat atau memperbarui dokumen `users/{uid}`.

## Catatan

- Jika akun Auth sudah ada dan PIN masih cocok, skrip akan reuse akun tersebut.
- Jika akun Auth sudah ada tetapi password berbeda, baris tersebut akan gagal dan perlu reset password dari Firebase Console.
- Aplikasi sekarang hanya menerima login melalui Firebase Auth dan profil `users/{uid}`.
- Koleksi `staff` tetap dipakai untuk administrasi/migrasi pegawai, tetapi bukan sumber autentikasi login produksi.

## Status Uji Login

- Admin bootstrap `admin@tersanjung.local` sudah dibuat untuk project `ckg-malimpung`.
- Profil `users/{uid}` admin berisi `username: admin`, `roles: ["admin", "petugas"]`, dan `isActive: true`.
- Login UI diuji dengan Playwright:

```bash
npm run test:e2e -- --reporter=line
```

Kredensial default uji:

```txt
Username: admin
PIN: 123456
```

Untuk uji dengan akun lain, gunakan environment variable:

```bash
E2E_USERNAME=username E2E_PIN=pin npm run test:e2e
```
