# CKG Malimpung (TERSANJUNG)

Aplikasi Layanan Cagar Kesehatan Keluarga Terpadu (CKG) untuk UPT Puskesmas Malimpung, Kabupaten Pinrang. Aplikasi ini mendigitalisasi alur skrining kesehatan masyarakat mulai dari antrean loket, pendaftaran, pemeriksaan terpadu per Pos, pelaporan wilayah, hingga pembagian Rapor Kesehatan Digital pasien.

---

## Fitur Utama

- **Pendaftaran & Alur Kerja Pos Terintegrasi**: Mengatur alur layanan dari Loket pendaftaran hingga Pos 7 (Pemberian obat dan Rapor Digital).
- **Smart Scan Dokumen (Hybrid OCR)**: Fitur pemindaian kartu identitas cerdas berbasis AI menggunakan **Gemini 2.5 Flash Vision** sebagai mesin utama dan **Tesseract.js** sebagai fallback lokal offline. Mendukung dokumen KTP, Kartu Keluarga, dan kartu BPJS/JKN dengan normalisasi wilayah canonical resmi Puskesmas Malimpung.
- **Dynamic Smart Form**: Formulir skrining adaptif berdasarkan usia, klaster kesehatan, dan riwayat klinis tanpa mengubah struktur database.
- **PWA & Offline Support**: Kemampuan sinkronisasi otomatis, penyimpanan draft lokal, dan ketahanan terhadap fluktuasi jaringan di lapangan.
- **Dashboard Analitik Wilayah**: Pemantauan real-time status demografi, deteksi dini Penyakit Tidak Menular (PTM), capaian per dusun, dan ekspor laporan terpadu.

---

## Arsitektur Teknologi

### Frontend (Klien)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS & Custom CSS (Healthcare UI Theme)
- **Klien OCR**: Tesseract.js (untuk fallback pemindaian offline di sisi browser)
- **Kompresi Gambar**: Canvas API (mengompresi foto dokumen secara cerdas sebelum dikirim)

### Backend (Server Pembantu OCR)
- **Runtime**: Node.js + Express
- **AI API**: Google Gemini SDK (`@google/genai`) dengan model `gemini-2.5-flash`
- **Tujuan**: Menjalankan ekstraksi vision secara aman tanpa mengekspos API Key Gemini ke sisi browser.

### Cloud Database & Auth
- **Layanan**: Firebase Authentication & Cloud Firestore (dengan aturan keamanan Firestore rules yang ketat).

---

## Langkah Instalasi & Pengembangan Lokal

### 1. Kebutuhan Sistem
- Node.js versi 20 atau di atasnya.
- Akun Firebase (dengan proyek aktif).
- API Key Google Gemini (untuk fitur Smart Scan online).

### 2. Kloning Repositori
```bash
git clone https://github.com/maroamabbarakka/ckgmalimpung.git
cd ckgmalimpung
```

### 3. Pasang Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variables
Buat berkas `.env` atau `.env.local` di root repositori dan masukkan konfigurasi berikut:

```env
# Konfigurasi Firebase Frontend
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Konfigurasi Backend Server (Smart Scan)
PORT=3001
GEMINI_API_KEY=your_google_gemini_api_key
```

### 5. Jalankan Aplikasi Secara Lokal
Jalankan frontend Vite (port 5173) dan backend OCR (port 3001) secara bersamaan dengan perintah berikut:

**Jalankan Backend Server:**
```bash
npm run server
```

**Jalankan Frontend (pada terminal terpisah):**
```bash
npm run dev
```

Aplikasi akan otomatis mengarahkan panggilan `/api/*` dari frontend ke backend lokal melalui konfigurasi proxy Vite.

---

## Pengujian Unit (Testing)
Aplikasi ini dilengkapi pengujian unit otomatis untuk fungsionalitas parser OCR:
```bash
npm run test
```

---

## Deployment
Untuk men-deploy frontend ke Firebase Hosting:
```bash
npm run build
firebase deploy
```

---

© 2026 Aplikasi Cek Kesehatan Gratis (CKG) Malimpung - Maroa Project.
