# Security Auth Migration Plan

Tanggal: 2026-05-27

## Role

- `admin`
- `petugas`
- `ttlm`
- `perawat`
- `perawat_bidan`
- `dokter`
- `apoteker`

## Collection Utama

- `users`: profil pengguna Firebase Auth.
- `staff`: data administrasi/migrasi pegawai.
- `patients`: identitas pasien.
- `visits`: kunjungan dan alur pos.
- `auditLogs` / `activity_logs`: audit aktivitas penting.
- `panggilan_tv`: data publik panggilan antrean.
- `queue_counters`: counter tiket.
- `pengaturan`: konfigurasi operasional.

## Aksi Per Role

- Admin: kelola user/staff, role, audit, dashboard, semua pos.
- Petugas: Loket dan Pos 1.
- TTLM: Pos 2 dan data lab terkait.
- Perawat/Perawat Bidan: pos pemeriksaan sesuai akses modul.
- Dokter: validasi klinis, Pos 3-7, dashboard.
- Apoteker: akses pos terkait edukasi/terapi sesuai kebijakan layanan.

## Rencana Migrasi Firebase Auth

1. Pastikan setiap akun aktif di `staff` memiliki username unik.
2. Jalankan migrasi dengan `npm run migrate:auth -- --admin-user=admin --admin-pin=PIN --commit`.
3. Buat akun Firebase Auth memakai email internal `username@tersanjung.local`.
4. Sinkronkan profil ke `users/{uid}`.
5. Validasi login dari aplikasi hanya memakai Firebase Auth.

## Custom Claims

Tahap produksi disarankan menyalin role aktif ke custom claims:

```js
{
  roles: ['dokter'],
  puskesmasId: 'malimpung'
}
```

Firestore Rules tetap boleh membaca `users/{uid}` selama masa transisi, tetapi custom claims menjadi target final agar validasi lebih kuat.

## Penonaktifan PIN Plaintext

1. Setelah semua akun aktif di Firebase Auth, hentikan penggunaan field `pin` di runtime.
2. Backup data staff.
3. Hapus atau hash field `pin` lama.
4. Audit login gagal/berhasil selama masa transisi.

## Skema Final User

```js
users/{uid} = {
  uid,
  username,
  nama,
  roles: ['dokter'],
  isActive: true,
  puskesmasId: 'malimpung',
  createdAt,
  updatedAt
}
```
