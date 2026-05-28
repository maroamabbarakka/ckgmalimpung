# Laporan & Dokumen Komprehensif Pengembangan Aplikasi TERSANJUNG v4.1

**Nama Sistem:** TERSANJUNG (Sistem Informasi Layanan Kesehatan Berbasis Jaringan Terpadu Puskesmas Malimpung)  
**Institusi:** UPT Puskesmas Malimpung  
**Status Sistem:** *Production-Ready* & Terkini  

---

## 1. Ringkasan Eksekutif
Aplikasi TERSANJUNG adalah sebuah sistem rekam medis dan *dashboard* pemantauan waktu nyata (*real-time*) yang didesain secara spesifik untuk memfasilitasi Cek Kesehatan Gratis (CKG) di Puskesmas Malimpung. Aplikasi ini dibangun dengan paradigma modern berbasis *Progressive Web App* (PWA) agar siap diakses melalui berbagai perangkat (Desktop, Tablet, Mobile) baik di ruang praktik puskesmas maupun saat kegiatan lapangan seperti Posyandu. 

Fokus utama dari aplikasi ini adalah otomasi diagnostik risiko penyakit, digitalisasi form manual yang panjang, serta penciptaan pelaporan klinis (Excel/PDF) yang sesuai dengan standar akreditasi Kemenkes.

---

## 2. Arsitektur & Tumpukan Teknologi (*Tech Stack*)
Sistem dibangun menggunakan ekosistem pengembangan modern yang berfokus pada kecepatan kompilasi dan stabilitas waktu nyata:
- **Frontend Framework:** React 18 dengan sistem *build* Vite untuk kompilasi ultra-cepat.
- **Database & Backend:** Firebase Firestore (NoSQL) yang memungkinkan sinkronisasi *real-time* ke semua perangkat tenaga kesehatan secara instan tanpa perlu *pull/refresh*.
- **Desain & UI/UX:** Tailwind CSS dengan implementasi responsif, desain yang "*Fat-Finger Friendly*" untuk pengguna gawai sentuh, serta `react-grid-layout` untuk *dashboard* dengan elemen geser (*drag-and-drop*).
- **Laporan & Ekspor:** `XLSX` (SheetJS) untuk pelaporan Excel dan `jsPDF` + `jspdf-autotable` untuk pembuatan dokumen PDF langsung di peramban *client* (menghemat beban server).
- **Infrastruktur Offline:** Dukungan *Progressive Web App* (PWA) lengkap dengan mode *offline* (*persistent local cache*) memanfaatkan **IndexedDB** dan *Service Worker*, yang memungkinkan aplikasi tetap bisa dibuka tanpa harus terhubung ke internet.

---

## 3. Modul & Fungsionalitas Utama
Sistem TERSANJUNG dibagi menjadi beberapa modul layanan terintegrasi untuk mendigitalkan seluruh alur pelayanan puskesmas secara terstruktur:

| Modul | Fungsi Utama |
| :--- | :--- |
| **Beranda** | Menu navigasi utama aplikasi. |
| **Login** | Autentikasi staf memakai *username* dan PIN. |
| **Loket & Registrasi** | Manajemen antrean dinamis yang merekam koordinat/wilayah pasien, sinkronisasi NIK terintegrasi untuk mencegah data ganda, dan pencetakan tiket. |
| **Pos 1** | Registrasi pasien, pencatatan identitas, dan kalkulasi usia awal. |
| **Pos 2 - 6 (Skrining)**| Otomasi form input skrining dinamis berbasis `formSchemas.json` (Master Engine V21). |
| **Pos 7** | Analisa dan Diagnosa Dokter serta area Cetak/Kirim Rapor Pasien. |
| **Kunjungan Rumah** | Alur pencatatan layanan lapangan secara *door-to-door*. |
| **Live Dashboard** | Visualisasi indikator strategis (antrian, pasien selesai, gender, usia) dan peringatan risiko tinggi seketika (*zero-click*). |
| **TV Display** | Tampilan *dashboard* pemanggilan antrean publik di ruang tunggu. |
| **Rapor Digital** | Rangkuman *print-ready* atas seluruh hasil skrining rekam medis dengan penamaan *file* PDF otomatis. |
| **Mesin Ekspor Data** | Modul pelaporan Excel/PDF kolektif & klaster spesifik siap cetak. |
| **SIMPEG Admin** | Administrasi data pegawai, manajemen *role* (RBAC), dan log aktivitas sistem. |

> **Hak Akses (RBAC)** diatur secara ketat per *role* untuk melindungi privasi data rekam medis. Peran yang tersedia meliputi: `petugas` (Pendaftaran), `ttlm` (Analis Lab), `perawat` (Asesmen Fisik), `dokter` (Diagnosis & Resep), dan `admin` (Administrator Sistem).

---

## 4. Metrik Skema Formulir Elektronik (RME)
Aplikasi ini melakukan digitalisasi ratusan variabel rekam medis. Berdasarkan struktur inti sistem, berikut adalah metrik beban form skrining:

| Indikator Skrining | Jumlah Keseluruhan |
| :--- | :--- |
| **Total Form Skrining Utama** | 18 Form |
| **Total Keseluruhan Pertanyaan** | 1.543 Pertanyaan |
| **Pertanyaan Berbasis Pilihan (Opsi)** | 917 Pertanyaan |
| **Total Seluruh Pilihan Jawaban** | 2.276 Pilihan |
| **Pilihan Jawaban Unik** | 204 Pilihan Unik |
| **Pertanyaan Teks Terbuka / Langsung** | 626 Pertanyaan |

*(Catatan: Angka 2.276 adalah total kemunculan opsi di seluruh form, mencakup opsi yang wajar berulang seperti “Ya/Tidak” atau “Normal/Abnormal” di berbagai pos pemeriksaan).*

### Distribusi Tipe Input Jawaban
Berdasarkan data JSON aktual, aplikasi ini menangani 7 format tipe masukan *input* yang dinamis:

| Tipe Input Jawaban | Jumlah Pertanyaan | Total Opsi Terkait |
| :--- | :--- | :--- |
| `text` (Teks Bebas) | 463 | 0 |
| `date` (Tanggal) | 42 | 0 |
| `number` (Angka/Numerik) | 121 | 0 |
| `select` (Pilihan Ganda) | 385 | 1.088 |
| `radio` (Pilihan Tunggal) | 75 | 150 |
| `yes_no` (Saklar Ya / Tidak) | 395 | 790 |
| `dropdown` (Menu Tarik-Turun) | 62 | 248 |

---

## 5. Segmentasi Demografi & Form Skrining
Aplikasi memuat 18 klaster formulir yang sangat spesifik dan dipecah ke dalam dua kelompok siklus hidup utama:
1. **Kesehatan Masyarakat (15 Form):** Mencakup fase BBL, Balita, Dewasa (terpisah secara gender), dan Lansia.
2. **Kesehatan Sekolah / Remaja (3 Form):** Mencakup fase pendidikan SD, SMP, SMA.

### Rincian Form dan Kerapatan Pertanyaan:

| Form Skrining / Kelompok Umur | Total Pertanyaan | Pertanyaan dgn Opsi | Total Kemunculan Opsi |
| :--- | :--- | :--- | :--- |
| **BBL** | 33 | 16 | 32 |
| **Balita 1 tahun** | 32 | 20 | 50 |
| **Balita 2 tahun** | 42 | 22 | 55 |
| **Balita 3-6 tahun** | 48 | 0 | 0 |
| **Laki-laki 18-24 tahun** | 68 | 39 | 99 |
| **Laki-laki 25-39 tahun** | 70 | 41 | 103 |
| **Laki-laki 40-44 tahun** | 95 | 50 | 121 |
| **Laki-laki 45-59 tahun** | 109 | 58 | 140 |
| **Perempuan 18-24 tahun** | 68 | 39 | 99 |
| **Perempuan 25-29 tahun** | 70 | 41 | 103 |
| **Perempuan 30-39 tahun** | 77 | 47 | 120 |
| **Perempuan 40-59 tahun** | 102 | 56 | 138 |
| **Laki-laki >=60 tahun** | 161 | 104 | 263 |
| **Perempuan 60-69 tahun** | 151 | 100 | 251 |
| **Perempuan >=70 tahun** | 147 | 96 | 244 |
| **SD** | 91 | 56 | 138 |
| **SMP** | 93 | 69 | 166 |
| **SMA** | 86 | 63 | 154 |

---

## 6. Logika Algoritma Alur Klinis (*Clinical Pathway*)

### Penentuan Kategori Usia (Hilirisasi di Pos 1)
Kalkulator di Pos 1 secara matematis menyimpulkan kategori pasien murni berdasarkan masukan tanggal lahir dengan rentang berikut:

| Kategori Satusehat | Batasan Rentang Waktu |
| :--- | :--- |
| **Bayi** | 0 - 11 bulan |
| **Balita** | 1 - 5 tahun |
| **SD** | 6 - 12 tahun |
| **SMP** | 13 - 15 tahun |
| **SMA** | 16 - 18 tahun |
| **Dewasa** | 19 - 59 tahun |
| **Lansia** | >= 60 tahun |

### *Routing Engine* Skema Dinamis (Di Pos 2 - 6)
Alih-alih menampilkan 1.543 pertanyaan, aplikasi menggunakan *Dynamic Form Renderer* untuk menyuntikkan form yang relevan. *Routing* ini dieksekusi dengan mengkombinasikan:
1. **Kategori Usia**
2. **Umur Definitif (Tahun)**
3. **Jenis Kelamin**

> **Contoh Cara Kerja Aplikasi:** Pasien pria usia 28 tahun yang mendaftar akan dikunci profilnya pada skema `"Laki-laki 25-39 tahun"`. Sebaliknya, lansia perempuan usia 65 tahun hanya akan diperlihatkan pertanyaan yang dikurasi dari skema `"Perempuan 60-69 tahun"`.

---

## 7. Pembagian Beban Kerja Klinis (Distribusi POS)
Untuk mengoptimalkan efisiensi SDM Puskesmas Malimpung, rangkaian form difilter per stasiun (POS) berdasarkan area skrining:

* **POS 2 (Pemeriksaan Dasar):** Fokus pada Antropometri, Berat badan, Tinggi badan, IMT, Tekanan darah, Suhu, Nadi, Napas, Lingkar perut, dan ukuran LILA.
* **POS 3 (Pemeriksaan Spesifik 1):** Fokus pada observasi indera (Mata, visus, telinga, pendengaran) dan THT (Gigi, mulut) serta anamnesis jantung bawaan.
* **POS 4 (Pemeriksaan Spesifik 2):** Fokus pada pengambilan sampel & analisa PTM (Gula darah, Skrining diabetes, Kolesterol, Asam urat, Hepatitis, HIV, Sifilis, dan Malaria).
* **POS 5 (Skrining Lingkungan & Risiko):** Fokus pada observasi TB, Paru, potensi Kanker, Rekam EKG, penyakit Kulit, dan kebiasaan gaya hidup (Merokok, Alkohol, Narkoba).
* **POS 6 (Skrining Kejiwaan & Geriatri):** Fokus pada pengisian kuisioner evaluasi (Mini-Cog, Depresi, SRQ, SDQ, ADL, SPPB, MNA, dimensi kognitif, dan kerentanan lansia).
* **POS 7 (Validasi & Evaluasi Medis):** Fokus pada Analisa dan Diagnosa komprehensif oleh Dokter, persetujuan rekam medis akhir, serta tahapan Cetak dan Kirim Rapor Pasien secara otomatis.

---

## 8. Fase Pengoptimalan Terkini (*Recent Milestones*)
Pengembangan dalam kurun waktu terakhir berfokus pada transisi performa dan akurasi pelaporan:

1. **Pemusnahan Template Berkas Berat:** Menghapus *template* Excel warisan yang berukuran besar (4MB) demi memangkas *bundling size* aplikasi. Formasi pelaporan saat ini murni digenerasikan (*compiled on-the-fly*) menggunakan JavaScript murni bersumber dari `formSchemas.json`.
2. **Kepatuhan Penandaan Lokasi:** Integrasi nilai "Desa/Kelurahan" dan "Dusun/Lingkungan" ke dalam data laporan Excel secara otomatis, memungkinkan petugas melakukan pelacakan wilayah terjangkit penyakit tertentu.
3. **Optimasi Proporsi PDF Horizontal:** Laporan berbasis PDF untuk klaster umur tertentu memiliki kolom yang sangat banyak. Modul pelaporan secara cerdas akan menyederhanakan teks *header* secara algoritmis dan melakukan *Horizontal Page Break*, membentangkan rekam medis lintas lembar 2-4 halaman A4 secara bersambung secara sempurna.
4. **Pembekuan Tata Letak Dashboard (*Hard-Layout Lock*):** Menganalisis dan menata ulang *widget* secara paksa dari *dashboard* awal, menyeimbangkan sisi kiri dan kanan sesuai dengan preferensi ergonomi visual petugas kesehatan (memanfaatkan *cache* lokal peramban versi terbaru).

---

## 9. Rekomendasi Jangka Panjang (Strategi *Scaling*)
Aplikasi ini kini telah mencapai titik stabil untuk dipergunakan dalam operasional sehari-hari. Beberapa langkah rekomendasi ke depannya antara lain:

- **Penguatan Role-Based Access Control (RBAC):** Merancang perlindungan di mana hanya Admin yang dapat melihat Dashboard utuh dan melakukan ekspor skala besar, sementara Nakes fokus pada entri rekam medis. Hal ini telah dikonsolidasikan dalam struktur `AdminDashboard`.
- **Penyimpanan Terdistribusi (Pagination):** Apabila volume pasien mencapai puluhan ribu, pengunduhan satu data sekaligus tanpa pembatasan akan memperberat peramban pengguna. Penerapan sinkronisasi terpotong (*chunking* dan *pagination*) mungkin perlu diperkenalkan pada pengembangan tahap lanjut.
- **Bridging SATUSEHAT Kemenkes:** Menyesuaikan model struktur JSON untuk memudahkan pemetaan (*mapping*) dengan API *Encounter* atau *Observation* di SATUSEHAT untuk rekam medis terintegrasi tingkat nasional.

---
*Laporan Disusun Oleh: Tim Pengembang Aplikasi TERSANJUNG*
