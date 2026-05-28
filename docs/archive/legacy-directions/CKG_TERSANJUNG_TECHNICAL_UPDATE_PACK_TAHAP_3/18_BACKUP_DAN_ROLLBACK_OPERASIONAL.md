# Backup dan Rollback Operasional

## Sebelum Update Besar
1. Export data Firestore penting.
2. Simpan versi build terakhir.
3. Catat commit hash produksi.
4. Catat Firebase Hosting release aktif.
5. Pastikan admin tahu jadwal update.

## Data Yang Wajib Dibackup
- patients
- visits
- queue
- staff
- reports
- auditLogs jika sudah ada
- dailyStats/monthlyStats jika sudah ada

## Rollback Hosting
Gunakan Firebase Hosting release history jika tersedia. Catat release ID sebelum deploy.

## Rollback Kode
```bash
git log --oneline
git revert <commit-hash>
npm run build
firebase deploy --only hosting
```

## Rollback Schema
Jangan hapus field baru langsung. Matikan pembacaan field baru dari kode terlebih dahulu, lalu biarkan data tetap ada sampai stabil.

## Kondisi Wajib Rollback
- login gagal untuk semua user,
- data pasien tidak bisa dibuka,
- save pos gagal,
- dashboard menyebabkan aplikasi blank,
- export mengandung data salah,
- aplikasi tidak bisa dibuka di mobile.
