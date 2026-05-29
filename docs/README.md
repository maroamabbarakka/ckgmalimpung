# Aplikasi Cek Kesehatan Gratis (CKG) Malimpung

## Tentang Aplikasi

Aplikasi Cek Kesehatan Gratis (CKG) Malimpung adalah sistem informasi pelayanan kesehatan berbasis web yang dirancang untuk mendukung pelaksanaan program skrining kesehatan masyarakat secara terintegrasi, cepat, akurat, dan terdokumentasi.

Aplikasi ini mendigitalisasi seluruh alur pelayanan mulai dari pendaftaran peserta, pemeriksaan berjenjang pada setiap Pos layanan, pengelolaan antrean, hingga penyusunan rapor kesehatan digital.

Sistem dirancang untuk digunakan oleh petugas kesehatan pada kegiatan pelayanan skrining kesehatan massal maupun pelayanan kesehatan rutin di fasilitas kesehatan.

---

# Tujuan Sistem

* Mempercepat proses pelayanan kesehatan.
* Mengurangi pencatatan manual berbasis kertas.
* Meningkatkan kualitas dan konsistensi data kesehatan.
* Mendukung monitoring dan evaluasi program kesehatan.
* Menyediakan dokumentasi hasil pemeriksaan secara digital.
* Mendukung pelayanan lapangan dengan konektivitas terbatas.

---

# Fitur Utama

## Pendaftaran Peserta

* Registrasi peserta baru.
* Validasi identitas peserta.
* Pencarian peserta berdasarkan NIK.
* Manajemen data peserta.
* Distribusi peserta ke lokasi pelayanan.

## Sistem Antrean

* Nomor antrean otomatis.
* Antrean berdasarkan lokasi pelayanan.
* Monitoring progres peserta.
* Pelacakan status pelayanan.

## Pelayanan Berjenjang

### Pos 1

Pencatatan identitas dasar dan pemeriksaan awal.

### Pos 2

Pemeriksaan tanda vital dan pengukuran dasar.

### Pos 3

Pemeriksaan laboratorium sederhana dan pemeriksaan pendukung.

### Pos 4

Skrining faktor risiko kesehatan.

### Pos 5

Pemeriksaan lanjutan sesuai kelompok usia.

### Pos 6

Evaluasi dan penilaian hasil skrining.

### Pos 7

Tindak lanjut dan penyelesaian pelayanan.

## Dynamic Smart Form

* Form berbasis schema.
* Pertanyaan dinamis berdasarkan kategori usia.
* Pertanyaan berjenjang.
* Smart routing antar pertanyaan.
* Dukungan pengembangan tanpa perubahan struktur database.

## Rapor Digital

* Ringkasan hasil pemeriksaan.
* Ringkasan faktor risiko.
* Hasil skrining kesehatan.
* Dokumentasi hasil pelayanan.

## Offline Support

* Penyimpanan lokal.
* Sinkronisasi otomatis saat koneksi tersedia.
* Dukungan multi-tab browser.
* Ketahanan terhadap gangguan jaringan.

## OCR dan Digitalisasi Dokumen

* Pembacaan dokumen melalui OCR.
* Ekstraksi data dasar peserta.
* Membantu percepatan input data.

---

# Arsitektur Pelayanan

```text
LOKET PENDAFTARAN
         │
         ▼
       POS 1
         │
         ▼
       POS 2
         │
         ▼
       POS 3
         │
         ▼
       POS 4
         │
         ▼
       POS 5
         │
         ▼
       POS 6
         │
         ▼
       POS 7
         │
         ▼
   RAPOR DIGITAL
```

---

# Role Pengguna

## Admin

Mengelola seluruh sistem.

Hak akses:

* Manajemen pengguna.
* Monitoring layanan.
* Laporan.
* Audit data.
* Pengaturan sistem.

## Petugas

Melakukan pendaftaran dan operasional pelayanan.

## Perawat

Melaksanakan pemeriksaan pada Pos yang menjadi kewenangannya.

## Bidan

Melaksanakan pemeriksaan sesuai tugas pelayanan.

## TTLM

Melaksanakan pemeriksaan laboratorium.

## Dokter

Melakukan evaluasi hasil pemeriksaan dan tindak lanjut.

## Apoteker

Mendukung pelayanan farmasi dan edukasi kesehatan.

---

# Teknologi

Frontend:

* React 19
* React Router
* Tailwind CSS

Backend Services:

* Firebase Authentication
* Cloud Firestore

Visualisasi Data:

* Recharts

Dokumen:

* jsPDF
* ExcelJS

OCR:

* Tesseract.js

Testing:

* Vitest
* Playwright

Deployment:

* Firebase Hosting

---

# Struktur Data Utama

```text
users
staff
patients
visits
queue_counters
public_queue
activity_logs
auditLogs
```

---

# Persyaratan Sistem

* Node.js 20+
* npm 10+
* Firebase Project aktif
* Browser modern (Chrome, Edge, Firefox)

---

# Instalasi

Clone repository:

```bash
git clone https://github.com/maroamabbarakka/ckgmalimpung.git
```

Masuk ke folder project:

```bash
cd ckgmalimpung
```

Install dependency:

```bash
npm install
```

Jalankan mode development:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

# Konfigurasi Firebase

Buat file:

```text
.env
```

Contoh konfigurasi:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Jangan pernah menyimpan kredensial sensitif ke repository publik.

---

# Deploy

Build aplikasi:

```bash
npm run build
```

Deploy ke Firebase Hosting:

```bash
firebase deploy
```

---

# Keamanan Data

Aplikasi menerapkan:

* Firebase Authentication.
* Role Based Access Control.
* Firestore Security Rules.
* Audit Activity Logging.
* Pembatasan akses berdasarkan peran pengguna.

Data peserta hanya dapat diakses oleh pengguna yang memiliki kewenangan sesuai aturan sistem.

---

# Penggunaan Data Dummy

Untuk kebutuhan pengujian dan pelatihan, data dummy wajib diberi penanda:

```json
{
  "isDummy": true,
  "source": "training",
  "importBatch": "dummy-import"
}
```

Hal ini memudahkan proses pembersihan data sebelum operasional sebenarnya.

---

# Roadmap Pengembangan

## Tahap 1

* Stabilitas operasional.
* Penyempurnaan Dynamic Form.
* Optimalisasi antrean.

## Tahap 2

* Integrasi pelaporan.
* Dashboard analitik.
* Monitoring capaian program.

## Tahap 3

* Integrasi sistem kesehatan eksternal.
* Dukungan multi-fasilitas.
* Sinkronisasi data tingkat wilayah.

---

# Dukungan Program

Aplikasi ini dikembangkan untuk mendukung pelaksanaan Program Cek Kesehatan Gratis (CKG) dan kegiatan skrining kesehatan masyarakat.

---

# Pengembang

Maroa Project

Sistem Informasi dan Solusi Digital

---

# Lisensi

Hak cipta dilindungi sesuai ketentuan yang berlaku.

Penggunaan, modifikasi, dan distribusi aplikasi mengikuti kebijakan yang ditetapkan oleh pemilik sistem.

---

© 2026 Aplikasi Cek Kesehatan Gratis (CKG) Malimpung
