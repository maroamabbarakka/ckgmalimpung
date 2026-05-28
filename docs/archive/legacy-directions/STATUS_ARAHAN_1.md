# Status Implementasi ARAHAN_1

Dokumen ini merangkum penutupan ARAHAN_1 untuk aplikasi CKG Malimpung.

## Selesai

- Authentication memakai Firebase Auth dan profil `users/{uid}`.
- Login legacy berbasis query `staff.username + staff.pin` sudah tidak dipakai di runtime aplikasi.
- Route dilindungi `RequireAuth` dan `RequireRole` dengan loading state.
- Firestore rules tersedia di `firestore.rules`.
- Index Firestore wajib tersedia di `firestore.indexes.json`.
- Status antrean distandardisasi melalui `queueStatus.js` dan `STATUS_MAPPING`.
- Migrasi status antrean tersedia di `scripts/migrateQueueStatus.js`.
- Service layer utama tersedia:
  - `authService.js`
  - `userService.js`
  - `patientService.js`
  - `visitService.js`
  - `queueService.js`
  - `auditService.js`
  - `reportService.js`
  - `settingsService.js`
- Pos 1 sampai Pos 7 memakai `useQueue` untuk antrean realtime.
- Pos 1 sampai Pos 7 memakai service untuk klaim pasien, panggilan TV, update visit, validasi pasien, dan riwayat utama.
- Validasi pasien tanpa NIK memakai `patient_identity_key`.
- Audit trail tersedia untuk login, logout, transisi antrean, edit/delete/export penting, dan modul admin.
- PWA/offline indicator tersedia melalui `SyncStatusBanner`/`ConnectionStatus`.
- TV Display membaca lokasi aktif realtime dari `pengaturan/lokasi_aktif`.
- Rapor membaca data melalui `reportService`.
- Test wajib tersedia untuk umur, status antrean, validasi CKG, dan privacy.

## Verifikasi

Perintah yang wajib dijalankan setelah perubahan:

```bash
npm run lint
npm run test:run
npm run build
```

Status terakhir: semua sukses. Warning build yang tersisa hanya peringatan ukuran chunk Vite.

## Catatan Operasional

- Koleksi `staff` tetap dipakai untuk administrasi/migrasi pegawai.
- Akun login produksi wajib dibuat di Firebase Auth dan disinkronkan ke `users/{uid}`.
- Gunakan `npm run migrate:auth -- --admin-user=admin --admin-pin=PIN --commit` untuk migrasi staff ke Firebase Auth.
- Admin bootstrap `admin / 123456` sudah diuji login sampai Beranda, Admin Dashboard, dan Dashboard melalui `npm run test:e2e`.
