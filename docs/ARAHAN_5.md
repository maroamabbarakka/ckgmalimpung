````md
# 59. RISIKO TERBESAR SAAT UI REFACTOR

## Risiko

Developer/Codex terlalu agresif lalu:

- mengubah nama state
- mengubah fungsi submit
- mengubah struktur payload Firestore
- menghapus listener realtime
- mengganti status antrean
- mengubah validasi pasien
- mengubah alur pos

## Pencegahan

Setiap perubahan UI wajib memakai prinsip:

```txt
Wrap, don't rewrite.
Style, don't restructure logic.
Extract presentational components only.
Do not touch data contract.
````

---

# 60. STRATEGI “WRAP, DON’T REWRITE”

Jika ada komponen lama seperti:

```jsx
<button onClick={handleSubmit}>Simpan</button>
```

Boleh diubah menjadi:

```jsx
<AppButton onClick={handleSubmit}>
  Simpan
</AppButton>
```

Tapi jangan ubah:

```jsx
handleSubmit
```

---

# 61. STRATEGI “PRESENTATIONAL EXTRACTION”

Boleh ekstrak UI:

```txt
PatientHeader.jsx
QueueCard.jsx
FormSection.jsx
```

Tapi logic tetap di parent dulu.

Contoh aman:

```jsx
<PatientHeader patient={selectedPatient} queueNumber={queueNumber} />
```

Tidak aman:

```jsx
<PatientHeader patientId={id} />
```

Karena komponen child jadi mengambil data sendiri dan bisa mengubah flow.

---

# 62. KOMPONEN AMAN UNTUK DIEKSTRAK

Prioritas aman:

```txt
AppButton
AppCard
AppBadge
AppInput
AppPageHeader
AppSection
AppStatCard
EmptyState
ErrorState
LoadingSkeleton
PatientHeader
QueueStatusBadge
```

---

# 63. KOMPONEN YANG JANGAN DULU DIPECAH

Tunda dulu komponen yang menyentuh:

```txt
Submit handler
Firestore write
Realtime listener
Transaction
OCR process
Authentication
Role guard
Queue transition
Medical validation
```

---

# 64. PRINSIP SUPER APP UNTUK CKG

Super app feel bukan berarti semua fitur ditumpuk.

Super app feel berarti:

```txt
Semua fitur terasa satu keluarga visual.
Navigasi cepat.
Aksi utama jelas.
Data penting muncul lebih dulu.
Halaman terasa ringan walau fitur banyak.
```

---

# 65. STANDARDISASI HALAMAN

Setiap halaman wajib memakai pola:

```txt
Page Header
Context Summary
Primary Action
Main Content
Secondary Content
Footer/Sticky Action
```

---

# 66. PAGE HEADER STANDARD

Format:

```txt
Judul Halaman
Deskripsi singkat
Status realtime / tanggal / role
```

Contoh:

```txt
Loket Antrean
Kelola nomor antrean dan panggilan pasien hari ini.
Online • Jumat, 22 Mei 2026
```

---

# 67. CONTEXT SUMMARY STANDARD

Setiap halaman operasional wajib punya ringkasan konteks.

Contoh Loket:

```txt
Lokasi aktif
Nomor terakhir
Printer
Antrean menunggu
```

Contoh Pos:

```txt
Pasien aktif
Nomor antrean
Usia
Status pemeriksaan
```

---

# 68. PRIMARY ACTION STANDARD

Hanya satu tombol yang paling dominan per halaman.

Contoh:

```txt
Loket: Ambil Nomor Antrean
Pos: Simpan & Lanjut
Dashboard: Export Laporan
Admin: Tambah Petugas
```

Tombol lain dibuat secondary/ghost.

---

# 69. VISUAL PRIORITY RULE

Dalam satu layar:

```txt
1 elemen sangat dominan
2-3 elemen pendukung
sisanya tenang
```

Jika semua terlihat penting, berarti UI gagal.

---

# 70. HEALTHCARE TRUST DESIGN

Aplikasi kesehatan harus memberi rasa:

```txt
tenang
aman
terpercaya
teratur
bersih
tidak gaduh
```

Hindari:

```txt
warna terlalu keras
shadow berat
font dekoratif
icon tidak konsisten
animasi ramai
```

---

# 71. STATUS BADGE STANDARD

Gunakan badge untuk status:

```txt
Menunggu
Dipanggil
Dalam Pemeriksaan
Selesai
Rujuk
Risiko Tinggi
Offline
Online
```

Style:

```txt
soft background
text gelap
border tipis
radius penuh
```

---

# 72. QUEUE STATUS COLOR

```txt
Menunggu: neutral/slate
Dipanggil: info/blue
Dalam Pemeriksaan: warning/amber
Selesai: success/green
Rujuk/Risiko: danger/red
```

---

# 73. FORM READABILITY

Form panjang wajib dibagi menjadi kartu/section.

Jangan tampilkan 30 input dalam satu blok.

Gunakan:

```txt
Section title
Short helper text
Grouped inputs
Inline validation
```

---

# 74. FORM MOBILE RULE

Pada mobile:

```txt
1 input per baris
label selalu terlihat
height minimal 48px
gap antar input minimal 12px
```

---

# 75. FORM DESKTOP RULE

Pada desktop:

```txt
2 kolom maksimal
3 kolom hanya untuk field pendek
field medis penting tetap 1 kolom
```

---

# 76. DANGER ACTION RULE

Aksi berbahaya seperti hapus/reset:

```txt
warna merah
tidak sejajar dengan tombol utama
butuh konfirmasi
teks jelas
```

Jangan pakai icon saja.

---

# 77. SUCCESS FEEDBACK

Setelah simpan:

```txt
Toast singkat
Status berubah jelas
Tombol tidak double submit
```

Contoh:

```txt
Data pemeriksaan berhasil disimpan.
```

---

# 78. DOUBLE SUBMIT PREVENTION

Semua tombol submit wajib:

```txt
disabled saat loading
ubah label menjadi "Menyimpan..."
tidak bisa diklik berulang
```

---

# 79. EMPTY STATE COPYWRITING

Gunakan bahasa manusia.

Buruk:

```txt
No data
```

Baik:

```txt
Belum ada pasien dalam antrean.
Data akan muncul otomatis setelah loket mengambil nomor antrean.
```

---

# 80. ERROR STATE COPYWRITING

Buruk:

```txt
FirebaseError permission-denied
```

Baik:

```txt
Data belum bisa dimuat.
Periksa koneksi internet atau hubungi admin.
```

Detail error teknis boleh di console, bukan untuk user umum.

---

# 81. LOADING SKELETON STANDARD

Gunakan skeleton untuk:

```txt
dashboard card
table
queue list
patient summary
chart container
```

Jangan tampilkan layar putih kosong.

---

# 82. RESPONSIVE APP SHELL

Desktop:

```txt
sidebar kiri
content center max-width
top header ringan
```

Mobile:

```txt
top bar ringkas
bottom nav
sticky action area
safe-area padding
```

---

# 83. BOTTOM NAV RULE

Mobile bottom nav maksimal 5 item:

```txt
Dashboard
Loket/Antrean
Pos
Rapor
Menu
```

Jika pos banyak, masukkan ke Menu/Pos selector, jangan semua pos dijadikan tab utama.

---

# 84. POS SELECTOR UX

Untuk Pos 1–7, gunakan:

```txt
Pos selector card/grid
role-based visibility
last active pos
```

Jangan menampilkan semua pos ke user yang tidak punya akses.

---

# 85. ROLE-BASED UI CLARITY

UI harus menyesuaikan role:

```txt
Petugas loket melihat fitur loket
Dokter melihat pemeriksaan dokter
Admin melihat control center
TV display hanya display
```

Jangan user melihat menu yang tidak bisa dipakai.

---

# 86. DESKTOP DENSITY

Desktop boleh lebih padat, tapi tetap rapi.

Gunakan:

```txt
max-width 1280/1440
card grid
table compact
sidebar
```

Jangan biarkan konten melebar penuh tanpa batas di monitor besar.

---

# 87. TABLE MOBILE TRANSFORMATION

Jika tabel punya banyak kolom, mobile harus berubah menjadi card.

Format card:

```txt
Nama / Nomor
Status badge
Data penting 2-4 baris
Aksi utama
```

---

# 88. PRINT / PDF UI

Untuk halaman rapor dan export:

```txt
screen view boleh modern
print view harus bersih
hide navigation saat print
gunakan ukuran A4 jika perlu
```

Tambahkan CSS:

```css
@media print {
  .no-print {
    display: none !important;
  }

  body {
    background: white;
  }
}
```

---

# 89. TV DISPLAY READABILITY

Untuk TV Display:

```txt
Tidak ada font kecil
Nomor antrean harus sangat besar
Kontras minimal tinggi
Jarak antar elemen besar
Animasi lambat dan halus
```

Target dibaca dari jarak 5–10 meter.

---

# 90. TV DISPLAY TYPOGRAPHY

```txt
Nomor antrean: 96px - 160px
Nama pasien: 40px - 64px
Pos tujuan: 32px - 48px
Header: 28px - 36px
Info kecil: minimal 24px
```

---

# 91. TV DISPLAY LAYOUT

```txt
60% area untuk panggilan aktif
40% area untuk daftar antrean/status pos
bottom bar untuk informasi
```

---

# 92. CHART UX

Dashboard chart harus menjawab pertanyaan, bukan sekadar dekorasi.

Setiap chart wajib punya:

```txt
judul jelas
periode
legend rapi
empty state
loading state
```

---

# 93. CHART LIMIT

Jangan tampilkan terlalu banyak chart dalam satu layar.

Maksimal:

```txt
2 chart utama
2 insight kecil
```

Detail lain masuk tab/section bawah.

---

# 94. ICON USAGE RULE

Icon hanya membantu scanning.

Jangan mengganti label dengan icon saja.

Format baik:

```txt
[Icon] Label
```

Bukan:

```txt
[Icon saja]
```

---

# 95. COPYWRITING UI

Gunakan bahasa Indonesia yang jelas.

Contoh:

```txt
Ambil Nomor Antrean
Panggil Pasien
Simpan Pemeriksaan
Lanjut ke Pos Berikutnya
Cetak Rapor
Unduh Excel
```

Hindari istilah teknis:

```txt
Submit
Fetch
Sync
Collection
Query
```

---

# 96. MICROCOPY UNTUK DATA SENSITIF

Pada data pasien:

```txt
Data pasien bersifat rahasia.
Pastikan perangkat digunakan oleh petugas berwenang.
```

Letakkan kecil di halaman admin/rapor, tidak perlu mengganggu operasional.

---

# 97. ACCESSIBILITY MINIMUM

Wajib:

```txt
contrast cukup
focus ring terlihat
button punya label
input punya label
error terhubung ke field
touch target minimal 44-48px
```

---

# 98. FINAL UI REFACTOR COMMAND UNTUK CODEX

```txt
Terapkan UI/UX refactor aman dengan prinsip:
- wrap don't rewrite
- presentational extraction only
- no data schema changes
- no business logic changes
- no Firestore query changes unless strictly visual
- no validation flow changes
- no queue flow changes

Bangun design system, AppShell, reusable UI components, responsive layout, mobile bottom nav, dashboard hierarchy, form sections, sticky patient header, floating action bar, table-to-card mobile, skeleton/empty/error states, dan TV display polish.

Setelah setiap tahap:
1. npm run build
2. cek manual halaman terkait
3. pastikan data tetap tampil
4. pastikan submit tetap berfungsi
```

---

# 99. DEFINISI SELESAI

UI/UX refactor selesai jika aplikasi:

```txt
terlihat konsisten
lebih lega
lebih mudah dipakai
lebih cepat dipahami
lebih aman secara UX
nyaman di mobile
rapi di desktop
TV display terlihat profesional
dashboard terlihat premium
tanpa merusak logic
```

```
```
