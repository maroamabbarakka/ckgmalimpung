# 24 — Audit Logging Event Model

## Target
Setiap aksi penting tercatat untuk keamanan, tracing, dan pertanggungjawaban.

## Collection
```txt
audit_logs/{logId}
```

## Schema
```js
{
  action: 'LOGIN'|'LOGOUT'|'CREATE_PATIENT'|'UPDATE_PATIENT'|'START_POS'|'COMPLETE_POS'|'FINALIZE_VISIT'|'EXPORT_REPORT'|'PRINT_RAPOR'|'TAKEOVER_PATIENT'|'DELETE_OR_ARCHIVE',
  actorId: string,
  actorName: string,
  actorRole: string,
  targetType: 'patient'|'visit'|'staff'|'report'|'queue'|'system',
  targetId: string|null,
  patientId: string|null,
  visitId: string|null,
  before: {},
  after: {},
  metadata: {
    posId: string|null,
    device: string|null,
    userAgent: string|null,
    ipHash: string|null
  },
  createdAt
}
```

## Service
File:
```txt
src/services/auditLogService.js
```

Fungsi:
```js
logAuditEvent(event)
logPatientUpdate({actor, patientId, before, after})
logVisitStatusChange({actor, visitId, from, to})
logExport({actor, reportType, filters})
```

## Aturan penting
- Audit log tidak boleh diedit dari client.
- Jika belum ada backend, minimal create-only dari client dan rules menolak update/delete.
- Jangan simpan data medis lengkap di `before/after`; simpan field yang berubah saja.
- Untuk data sangat sensitif, simpan ringkasan perubahan.

## Event wajib fase pertama
- login berhasil/gagal;
- create pasien;
- update identitas pasien;
- mulai pos;
- selesai pos;
- finalisasi;
- export Excel/PDF;
- cetak rapor;
- takeover pasien.

## Acceptance criteria
- Minimal 9 event di atas tercatat.
- Log bisa difilter per pasien/visit/operator.
- Tidak ada fitur export tanpa audit log.
