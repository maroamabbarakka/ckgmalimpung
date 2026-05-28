# README — URUTAN EKSEKUSI SMART UI/UX CKG TERSANJUNG

## TUJUAN UTAMA
Aplikasi CKG TERSANJUNG harus mempermudah proses input yang sebelumnya manual/berulang menjadi:
- lebih cepat
- lebih aman
- lebih sedikit salah input
- lebih nyaman di HP, tablet, dan desktop
- lebih mudah dipahami operator baru

## PRINSIP UTAMA
Jangan membuat UI hanya terlihat cantik. UI harus membantu pekerjaan layanan kesehatan.

Prioritas:
1. Input cepat
2. Minim salah klik
3. Informasi penting terlihat jelas
4. Operator tidak perlu berpikir terlalu banyak
5. Tampilan profesional dan konsisten
6. Aman untuk data pasien

## URUTAN EKSEKUSI WAJIB

### Sprint UI/UX 1 — Design System
Kerjakan:
- warna
- typography
- button
- card
- form
- spacing
- status badge
- modal

Output:
- komponen reusable
- tidak ada style acak per halaman

### Sprint UI/UX 2 — Layout Shell
Kerjakan:
- app header
- sidebar/desktop navigation
- bottom navigation/mobile navigation
- page title
- breadcrumb
- safe area mobile

### Sprint UI/UX 3 — Smart Form Input
Kerjakan:
- input pasien
- autocomplete
- OCR correction
- inline validation
- keyboard-friendly input
- auto-save draft

### Sprint UI/UX 4 — Pos Workflow UX
Kerjakan:
- Pos 1–7 sebagai stepper
- status pasien aktif
- tombol utama konsisten
- validasi sebelum lanjut
- ringkasan pasien sticky

### Sprint UI/UX 5 — Dashboard & TV Display
Kerjakan:
- dashboard operator
- dashboard admin
- dashboard eksekutif
- TV display publik

### Sprint UI/UX 6 — QA Multi Device
Kerjakan:
- Android
- desktop
- tablet
- mode offline
- keyboard overlap
- modal overflow

## LARANGAN
- Jangan mengubah flow data tanpa audit.
- Jangan membuat desain berbeda-beda antar halaman.
- Jangan menambah animasi berlebihan.
- Jangan tampilkan data medis sensitif di layar publik.
- Jangan membuat dashboard ramai tapi lambat.