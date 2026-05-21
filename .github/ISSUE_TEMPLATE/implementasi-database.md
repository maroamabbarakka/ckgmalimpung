name: Implementasi Database / Firestore
about: Checklist untuk skema Firestore, indexing, dan rules
title: Implementasi Database: [Judul Perubahan DB]
labels: database, backend
assignees: ''

## Deskripsi singkat
Jelaskan perubahan koleksi/field/index yang diperlukan.

## Checklist implementasi
- [ ] Skema koleksi/dokumen ditulis (contoh `users`, `applicants`, `payments`)
- [ ] Field baru dan tipe data didefinisikan
- [ ] Index composite ditentukan untuk query yang diperlukan
- [ ] Firestore security rules diperbarui dan ditinjau
- [ ] Migration script (jika perlu) dibuat
- [ ] Backup data sebelum perubahan pada production
- [ ] Tes kueri pada staging
- [ ] Dokumentasi schema diperbarui (`src/docs/Database.md`)

## Migration (jika ada)
- Langkah-langkah rollback:

## Data tambahan
- Estimasi waktu:
- Reviewer yang diinginkan:
