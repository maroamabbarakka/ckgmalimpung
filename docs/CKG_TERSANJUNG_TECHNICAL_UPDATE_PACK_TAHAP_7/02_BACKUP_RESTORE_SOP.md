# BACKUP & RESTORE SOP

## TUJUAN
Menjamin data pasien, kunjungan, audit log, dan staff aman sebelum update besar.

## BACKUP WAJIB SEBELUM
- deploy major update
- migrasi schema
- perubahan Firestore Rules
- refactor dashboard/export
- perubahan collection pasien/kunjungan

## DATA YANG WAJIB DIBACKUP
- patients
- visits
- staff
- auditLogs
- queue
- reports
- settings

## FORMAT BACKUP
Simpan sebagai:
```txt
backup/YYYY-MM-DD_HH-mm/
  patients.json
  visits.json
  staff.json
  auditLogs.json
  queue.json
  settings.json
  manifest.json
```

## MANIFEST
```json
{
  "backupAt": "timestamp",
  "environment": "production",
  "collections": {
    "patients": 1200,
    "visits": 2500
  },
  "createdBy": "admin uid"
}
```

## RESTORE RULE
Restore hanya boleh:
- dilakukan admin teknis
- pada jam non-pelayanan
- setelah backup kondisi terakhir
- dengan dry-run terlebih dahulu

## ACCEPTANCE CRITERIA
- jumlah dokumen sebelum/sesudah sesuai
- sample pasien bisa dibuka
- dashboard tidak error
- export tetap jalan