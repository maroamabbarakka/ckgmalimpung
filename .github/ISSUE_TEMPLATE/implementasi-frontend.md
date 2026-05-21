name: Implementasi Frontend PMB
about: Checklist guidance untuk implementasi frontend (UI/UX, form, upload, responsive)
title: Implementasi Frontend: [Judul Fitur]
labels: frontend, enhancement
assignees: ''

## Deskripsi singkat
Tuliskan deskripsi fitur yang diimplementasikan dan link ke dokumen desain/referensi.

## Checklist implementasi
- [ ] Desain UI disetujui (link ke `src/docs/UI.md` atau file desain)
- [ ] Struktur proyek (Next.js/React) siap
- [ ] Halaman/route dibuat
- [ ] Form validasi sisi-klien diterapkan
- [ ] Upload dokumen (preview + validasi tipe/ukuran) berfungsi
- [ ] Integrasi Firebase Auth untuk akses pengguna jika diperlukan
- [ ] Integrasi API/Firestore untuk menyimpan data formulir
- [ ] Responsiveness teruji pada mobile/tablet/desktop
- [ ] Error handling dan notifikasi pengguna diterapkan
- [ ] Unit/E2E tests (jika diperlukan) ditambahkan
- [ ] Dokumentasi penggunaan/komponen diperbarui (`src/docs/UI.md`)
- [ ] PR checklist: linting, format, test pass

## Data tambahan
- Estimasi waktu:
- Reviewer yang diinginkan:

## Langkah QA
1. Ikuti alur pendaftaran lengkap (registrasi → form → upload → pembayaran)
2. Uji batas file dan tipe file
3. Uji pada perangkat mobile
