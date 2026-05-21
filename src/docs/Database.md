# Database — PMB Online (Firestore)

## Koleksi Utama

### `users`
Contoh dokumen:
```json
{
  "uid": "",
  "name": "",
  "email": "",
  "phone": "",
  "role": "applicant"
}
```

### `applicants`
Contoh dokumen:
```json
{
  "registrationNumber": "PMB2026001",
  "fullName": "",
  "nik": "",
  "nisn": "",
  "school": "",
  "studyProgram": "",
  "wave": "",
  "status": "submitted"
}
```

### `payments`
```json
{
  "applicantId": "",
  "amount": 250000,
  "status": "pending"
}
```

### `documents`
Penyimpanan path/URL ke Storage:
```json
{
  "kk": "storage/path/kk.pdf",
  "ijazah": "storage/path/ijazah.pdf",
  "photo": "storage/path/photo.jpg"
}
```

### `announcements`
Menandai status kelulusan/pemberitahuan per peserta.

## Indexing & Queries
- Index untuk query filter: `studyProgram`, `wave`, `status`, `payment.status`

## Status & Enum
- Form status: Draft, Submitted, Revision, Verified, Rejected
- Pembayaran: Pending, Paid, Rejected, Expired
- Kelulusan: Accepted, Reserve, Rejected

## Backup & Export
- Export berkala ke CSV/Excel via Cloud Function

## Aturan Keamanan (Catatan)
- Implementasikan Firestore Rules untuk mencegah eskalasi peran
- Validasi server-side pada fungsi penting (generate nomor, publish pengumuman)
