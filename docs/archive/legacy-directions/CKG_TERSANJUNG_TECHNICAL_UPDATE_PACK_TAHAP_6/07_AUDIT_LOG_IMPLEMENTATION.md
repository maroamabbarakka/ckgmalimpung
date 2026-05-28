# AUDIT LOG IMPLEMENTATION

## COLLECTION

`auditLogs`

## FIELDS

```ts
{
  action: string,
  entityType: 'patient' | 'visit' | 'staff' | 'export' | 'auth',
  entityId: string,
  userId: string,
  userRole: string,
  before?: object,
  after?: object,
  createdAt: Timestamp,
  ipInfo?: string,
  deviceInfo?: string
}
```

## ACTION WAJIB DILOG

- login
- logout
- create patient
- update patient
- finalize pos
- print report
- export excel
- delete data
- change role

## UI

Admin harus bisa filter:
- tanggal
- user
- action
- entity