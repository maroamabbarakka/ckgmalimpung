# Backup dan Restore Plan

Project production aktif: `ckg-malimpung`

## Prinsip

- Backup dilakukan sebelum deploy production yang menyentuh rules, struktur data, migrasi, atau fitur tulis Firestore.
- Backup manual dari Admin Dashboard tetap boleh dipakai untuk arsip JSON terbatas, tetapi export Firestore CLI lebih cocok untuk rollback operasional.
- Restore data tidak boleh dilakukan spontan saat layanan berjalan tanpa catatan insiden.

## Backup Firestore CLI

Gunakan bucket backup khusus yang aksesnya hanya untuk admin teknis.

```bash
firebase firestore:export gs://YOUR_BACKUP_BUCKET/backups/ckg-malimpung/2026-05-28 --project ckg-malimpung
```

Nama bucket final wajib diganti dari `YOUR_BACKUP_BUCKET` sebelum dipakai produksi.

## Jadwal Backup

| Kapan | Jenis | Catatan |
|---|---|---|
| Sebelum deploy production | Firestore export CLI | Wajib untuk perubahan rules/data |
| Mingguan | Firestore export CLI atau backup Admin Dashboard | Pilih waktu layanan sepi |
| Sebelum migrasi data | Firestore export CLI | Simpan ID export di deploy log |

## Validasi Backup

Setelah export:

1. Pastikan command selesai tanpa error.
2. Pastikan folder tanggal muncul di bucket.
3. Catat path export di deploy log.
4. Batasi akses bucket hanya untuk admin teknis.

## Restore

Restore hanya dilakukan jika:

- data produksi rusak karena migrasi atau bug tulis;
- rollback UI saja tidak cukup;
- ada persetujuan penanggung jawab layanan.

Contoh command:

```bash
gcloud firestore import gs://YOUR_BACKUP_BUCKET/backups/ckg-malimpung/2026-05-28 --project ckg-malimpung
```

Sebelum restore:

- hentikan deploy baru;
- umumkan potensi downtime;
- catat versi aplikasi dan waktu mulai;
- simpan incident report;
- siapkan verifikasi data setelah restore.

## Rollback Hosting Cepat

Jika masalah hanya di aplikasi frontend:

1. Buka Firebase Console > Hosting > Release history.
2. Pilih version terakhir yang sehat.
3. Jalankan rollback dari console.
4. Catat version rollback di deploy log.

Alternatif dari source:

```bash
git checkout <last-good-commit>
npm install
npm run lint
npm run test:run
npm run build
npx firebase-tools deploy --only hosting --project ckg-malimpung
```

## Catatan Retensi

| Data | Retensi Minimum |
|---|---|
| Kunjungan aktif | Tahun berjalan |
| Arsip kunjungan | Sesuai kebijakan puskesmas |
| Audit log | Minimal 2 tahun atau sesuai kebijakan internal |
| Draft lokal browser | 7 sampai 30 hari |
