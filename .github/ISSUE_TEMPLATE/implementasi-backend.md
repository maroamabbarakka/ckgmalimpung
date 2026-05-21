name: Implementasi Backend PMB
about: Checklist guidance untuk implementasi backend (Firebase functions, security, flows)
title: Implementasi Backend: [Judul Fitur]
labels: backend, enhancement
assignees: ''

## Deskripsi singkat
Tuliskan ringkasan fungsi backend yang akan dibuat atau diubah.

## Checklist implementasi
- [ ] Spesifikasi API / function ditulis
- [ ] Periksa dependensi (Firebase SDK, libs)
- [ ] Implementasi Cloud Function (generate nomor, webhook, export, dsb.)
- [ ] Validasi input server-side ditambahkan
- [ ] Firestore rules diupdate jika perlu
- [ ] Storage rules untuk file diupdate jika perlu
- [ ] Logging dan error handling terpasang
- [ ] Tes fungsi lokal (emulator) dan integrasi dengan emulator Firestore/Storage
- [ ] CI: build & lint pipeline
- [ ] Dokumentasi API / runbook diperbarui

## Deployment
- [ ] Deploy ke environment staging (Firebase project staging)
- [ ] Smoke test fungsi setelah deploy
- [ ] Schedule job jika diperlukan

## Data tambahan
- Estimasi waktu:
- Reviewer yang diinginkan:
