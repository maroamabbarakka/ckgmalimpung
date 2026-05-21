# DOKUMEN SPESIFIKASI SISTEM

# PMB ONLINE

## Institut Cokroaminoto Pinrang

---

# 1. LATAR BELAKANG

Institut Cokroaminoto Pinrang membutuhkan sebuah sistem Penerimaan Mahasiswa Baru (PMB) berbasis web yang modern, profesional, mudah digunakan, responsif, dan terintegrasi.

Sistem ini dirancang untuk mempermudah seluruh proses penerimaan mahasiswa baru mulai dari:

* publikasi informasi PMB
* registrasi akun peserta
* pengisian formulir pendaftaran
* upload dokumen
* pembayaran
* verifikasi admin
* pengumuman kelulusan
* registrasi ulang
* generate data mahasiswa aktif

Sistem akan menggunakan:

* Frontend publik: Blogger + Custom Domain
* Backend aplikasi: Firebase Ecosystem
* Dashboard admin berbasis web

Konsep sistem mengadopsi alur modern seperti:

* PMB Universitas Indonesia
* PMB Universitas Hasanuddin

Namun disesuaikan dengan kebutuhan dan skala Institut Cokroaminoto Pinrang.

---

# 2. TUJUAN SISTEM

## Tujuan Utama

Membangun sistem PMB digital yang:

* modern
* mudah digunakan
* mobile friendly
* realtime
* aman
* scalable
* mudah dikelola operator kampus

## Target Sistem

* Mengurangi proses manual
* Mengurangi penggunaan Google Form dan Excel manual
* Mempermudah monitoring peserta PMB
* Mempercepat proses verifikasi
* Meningkatkan citra profesional kampus
* Mempermudah proses pelaporan dan export data

---

# 3. ARSITEKTUR SISTEM

## Struktur Umum

```text
[Website Publik Blogger]
pmb.institutcokroaminoto.ac.id
        ↓
Landing Page PMB
        ↓
Klik Daftar
        ↓
[Aplikasi PMB Firebase]
daftar.institutcokroaminoto.ac.id
        ↓
Firebase Authentication
Firebase Firestore
Firebase Storage
Firebase Functions
```

---

# 4. DOMAIN DAN SUBDOMAIN

## Website Publik

```text
https://pmb.institutcokroaminoto.ac.id
```

Fungsi:

* landing page
* informasi PMB
* berita
* FAQ
* biaya kuliah
* program studi
* timeline PMB
* CTA daftar

---

## Aplikasi PMB

```text
https://daftar.institutcokroaminoto.ac.id
```

Fungsi:

* login peserta
* dashboard peserta
* formulir pendaftaran
* upload dokumen
* pembayaran
* pengumuman
* dashboard admin

---

# 5. TEKNOLOGI YANG DIGUNAKAN

## Frontend Landing Page

* Blogger
* Custom Blogger Theme
* Responsive Design
* SEO Optimized

---

## Frontend Aplikasi PMB

Disarankan:

* Next.js
* Tailwind CSS
* Firebase SDK

Alternatif:

* React JS
* Vue JS

---

## Backend

Menggunakan Firebase:

### Firebase Authentication

Untuk:

* login peserta
* reset password
* keamanan akun

### Cloud Firestore

Untuk:

* database realtime
* data peserta
* status pendaftaran
* data pembayaran
* pengumuman

### Firebase Storage

Untuk:

* upload dokumen
* foto peserta
* bukti pembayaran
* ijazah
* KK

### Firebase Functions

Untuk:

* generate nomor pendaftaran
* notifikasi otomatis
* validasi data
* export data
* trigger sistem

### Firebase Hosting

Opsional untuk aplikasi PMB.

---

# 6. FITUR WEBSITE PUBLIK (BLOGGER)

## Halaman Utama

Isi:

* hero section modern
* CTA daftar sekarang
* profil kampus
* keunggulan kampus
* program studi
* timeline PMB
* jalur pendaftaran
* testimoni
* FAQ
* kontak PMB

---

## Halaman Program Studi

Menampilkan:

* nama prodi
* akreditasi
* prospek kerja
* biaya kuliah
* fasilitas

---

## Halaman Biaya Kuliah

Menampilkan:

* biaya formulir
* biaya daftar ulang
* rincian UKT
* potongan/beasiswa

---

## Halaman Timeline PMB

Menampilkan:

* jadwal gelombang
* batas pendaftaran
* jadwal ujian
* pengumuman

---

## Halaman FAQ

Menampilkan pertanyaan umum.

---

## Halaman Kontak

Menampilkan:

* WhatsApp PMB
* email
* lokasi kampus
* Google Maps

---

# 7. FITUR APLIKASI PMB PESERTA

## 7.1 Registrasi Akun

Peserta dapat:

* membuat akun
* login
* reset password

Data registrasi:

* nama lengkap
* email
* nomor HP
* password

---

## 7.2 Dashboard Peserta

Dashboard menampilkan:

* status pendaftaran
* progress pengisian
* notifikasi
* jadwal penting
* pengumuman

Contoh progress:

```text
[✓] Biodata
[✓] Upload Dokumen
[✓] Pembayaran
[ ] Verifikasi
[ ] Pengumuman
```

---

## 7.3 Formulir Pendaftaran

### Biodata

Field:

* nama lengkap
* tempat lahir
* tanggal lahir
* jenis kelamin
* agama
* NIK
* NISN
* alamat lengkap
* nomor HP
* email

---

### Data Pendidikan

Field:

* asal sekolah
* jurusan sekolah
* tahun lulus
* nilai rata-rata

---

### Data Orang Tua

Field:

* nama ayah
* pekerjaan ayah
* nama ibu
* pekerjaan ibu
* penghasilan orang tua

---

### Pilihan Program Studi

Field:

* pilihan prodi 1
* pilihan prodi 2
* jalur masuk
* gelombang PMB

---

## 7.4 Upload Dokumen

Peserta dapat upload:

* foto formal
* KTP/Kartu Pelajar
* KK
* ijazah/surat keterangan lulus
* bukti pembayaran

Format:

* JPG
* PNG
* PDF

Batas ukuran file configurable.

---

## 7.5 Pembayaran

Status pembayaran:

* pending
* paid
* expired
* rejected

Metode pembayaran:

* transfer bank
* QRIS
* virtual account (opsional)

Peserta dapat:

* upload bukti transfer
* melihat status pembayaran

---

## 7.6 Kartu Peserta

Setelah pembayaran diverifikasi:

Peserta dapat:

* download kartu peserta
* print kartu peserta

Kartu berisi:

* foto peserta
* nomor peserta
* QR Code validasi
* pilihan prodi

---

## 7.7 Pengumuman

Peserta dapat melihat:

* lulus
* cadangan
* tidak lulus

Jika lulus:

* muncul instruksi daftar ulang

---

## 7.8 Registrasi Ulang

Peserta yang lulus dapat:

* upload berkas tambahan
* konfirmasi daftar ulang
* download surat diterima

---

# 8. FITUR DASHBOARD ADMIN

## 8.1 Login Admin

Role-based access.

---

## 8.2 Dashboard Statistik

Menampilkan:

* total pendaftar
* total per prodi
* total pembayaran
* total lulus
* grafik pendaftaran

---

## 8.3 Manajemen Peserta

Admin dapat:

* melihat peserta
* edit data
* verifikasi data
* filter peserta
* export Excel

Filter:

* prodi
* gelombang
* status pembayaran
* status verifikasi

---

## 8.4 Verifikasi Dokumen

Admin dapat:

* melihat dokumen
* menerima dokumen
* meminta revisi
* menolak dokumen

---

## 8.5 Verifikasi Pembayaran

Admin dapat:

* melihat bukti transfer
* menerima pembayaran
* menolak pembayaran

---

## 8.6 Pengaturan Gelombang PMB

Admin dapat:

* membuat gelombang
* menentukan jadwal
* menentukan biaya
* menentukan kuota

---

## 8.7 Pengumuman Kelulusan

Admin dapat:

* menentukan status peserta
* publish pengumuman

---

## 8.8 Export Data

Format:

* Excel
* CSV
* PDF (opsional)

---

## 8.9 Manajemen User Admin

Role:

* Super Admin
* Admin PMB
* Verifikator
* Keuangan
* Operator Prodi

---

# 9. ROLE DAN HAK AKSES

## Super Admin

Akses penuh seluruh sistem.

---

## Admin PMB

Akses:

* peserta
* pembayaran
* pengumuman
* laporan

---

## Verifikator

Akses:

* verifikasi dokumen
* validasi data

---

## Keuangan

Akses:

* pembayaran
* validasi transfer

---

## Peserta

Akses:

* dashboard pribadi
* formulir
* upload dokumen
* pembayaran

---

# 10. ALUR SISTEM

## Flow Peserta

```text
Landing Page
↓
Registrasi Akun
↓
Login
↓
Isi Formulir
↓
Upload Dokumen
↓
Pembayaran
↓
Verifikasi
↓
Pengumuman
↓
Registrasi Ulang
↓
Generate Data Mahasiswa
```

---

# 11. DESAIN UI/UX

## Konsep Desain

Desain harus:

* modern
* clean
* premium
* profesional
* mobile first
* responsif
* cepat diakses

---

## Warna

Menyesuaikan identitas kampus.

Dominan:

* putih
* warna utama kampus
* aksen modern

---

## Gaya Visual

Mengadopsi gaya:

* PMB universitas modern
* dashboard SaaS modern
* minimalis profesional

---

# 12. DATABASE DESIGN

## Collection: users

```json
{
  "uid": "",
  "name": "",
  "email": "",
  "phone": "",
  "role": "applicant"
}
```

---

## Collection: applicants

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

---

## Collection: payments

```json
{
  "applicantId": "",
  "amount": 250000,
  "status": "paid"
}
```

---

## Collection: documents

```json
{
  "kk": "",
  "ijazah": "",
  "photo": ""
}
```

---

## Collection: announcements

```json
{
  "applicantId": "",
  "status": "accepted"
}
```

---

# 13. STATUS SISTEM

## Status Formulir

```text
Draft
Submitted
Revision
Verified
Rejected
```

---

## Status Pembayaran

```text
Pending
Paid
Rejected
Expired
```

---

## Status Kelulusan

```text
Accepted
Reserve
Rejected
```

---

# 14. FITUR TAMBAHAN YANG DIREKOMENDASIKAN

## WhatsApp Notification

Notifikasi otomatis:

* akun dibuat
* pembayaran diterima
* revisi dokumen
* pengumuman

---

## QR Verification

QR code untuk:

* kartu peserta
* validasi peserta

---

## Audit Log

Mencatat:

* siapa mengubah data
* waktu perubahan
* aktivitas admin

---

## Dynamic Form

Admin dapat:

* menambah field tertentu
* mengubah syarat per prodi

---

# 15. NON FUNCTIONAL REQUIREMENTS

## Responsif

Sistem wajib:

* mobile friendly
* tablet friendly
* desktop friendly

---

## Keamanan

* Firebase Authentication
* Firestore Rules
* HTTPS
* Role Permission

---

## Performa

* loading cepat
* optimasi gambar
* caching

---

## Scalability

Sistem harus mudah dikembangkan.

---

# 16. ROADMAP DEVELOPMENT

## PHASE 1 — MVP

Fitur:

* landing page
* registrasi akun
* login
* formulir pendaftaran
* upload dokumen
* pembayaran manual
* dashboard admin
* pengumuman

---

## PHASE 2

Fitur:

* WhatsApp gateway
* QR peserta
* export Excel
* statistik dashboard

---

## PHASE 3

Fitur:

* CBT online
* wawancara online
* integrasi SIAKAD
* generate NIM
* sinkronisasi mahasiswa aktif

---

# 17. OUTPUT YANG DIHARAPKAN DARI DEVELOPER

Developer diharapkan menghasilkan:

* sistem PMB siap produksi
* source code lengkap
* dokumentasi sistem
* dokumentasi database
* dokumentasi deployment
* akun Firebase terstruktur
* responsive UI
* admin dashboard
* testing sistem

---

# 18. CATATAN PENTING

* Sistem PMB terpisah dari sistem akademik utama.
* Setelah mahasiswa diterima, data dapat diexport/sinkron ke SIAKAD.
* Sistem harus mudah digunakan operator non teknis.
* Prioritas utama adalah stabilitas dan kemudahan penggunaan.

---

# 19. PENUTUP

Dokumen ini menjadi acuan utama pengembangan Sistem PMB Online Institut Cokroaminoto Pinrang.

Developer diharapkan membangun sistem yang:

* profesional
* modern
* aman
* scalable
* mudah dikembangkan di masa depan
* mudah digunakan oleh peserta maupun operator kampus

---

# END OF DOCUMENT
