# PRODUCTION MONITORING PLAN

## TUJUAN
Setelah aplikasi dipakai operasional, developer wajib bisa melihat:
- error yang sering muncul
- halaman paling lambat
- export yang gagal
- query Firestore bermasalah
- user yang mengalami kendala

## IMPLEMENTASI MINIMAL

### 1. Frontend Error Boundary
Buat:
- `src/components/system/ErrorBoundary.jsx`

Tugas:
- tangkap error React
- tampilkan pesan ramah
- kirim log ke `systemLogs`

### 2. System Logs Collection

Collection:
- `systemLogs`

Field:
```ts
{
  type: 'frontend_error' | 'firestore_error' | 'sync_error' | 'export_error',
  message: string,
  page: string,
  action: string,
  userId?: string,
  userRole?: string,
  createdAt: Timestamp,
  userAgent: string
}
```

### 3. Dashboard Admin
Tambahkan menu:
- Monitoring Sistem

Isi:
- error hari ini
- error 7 hari terakhir
- halaman error terbanyak
- user terdampak
- tombol tandai sudah ditangani

## ACCEPTANCE CRITERIA
- error tidak membuat layar putih total
- admin bisa melihat error terbaru
- log tidak menampilkan data medis sensitif