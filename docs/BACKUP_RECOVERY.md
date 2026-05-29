# BACKUP_RECOVERY.md

## Backup Harian

Wajib melakukan:
- Export patients
- Export visits
- Export users

## Backup Mingguan

- Snapshot penuh Firestore
- Arsip laporan

## Recovery

1. Identifikasi kerusakan.
2. Restore snapshot terakhir.
3. Verifikasi jumlah data.
4. Uji aplikasi.

## Target

RPO < 24 jam
RTO < 4 jam
