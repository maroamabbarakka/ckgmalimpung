# FIRESTORE_SCHEMA.md

## Koleksi Utama

users
staff
patients
visits
queue_counters
public_queue
activity_logs
auditLogs

## patients

```json
{
  "nik":"",
  "name":"",
  "birthDate":"",
  "phone":"",
  "gender":""
}
```

## visits

Menyimpan seluruh hasil pemeriksaan lintas pos.

## Audit

Setiap perubahan penting dicatat pada activity_logs dan auditLogs.
