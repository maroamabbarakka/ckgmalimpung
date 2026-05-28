# 08 — OCR Smart Intake Multi Dokumen

## Tujuan

OCR tidak hanya membaca gambar, tetapi membantu registrasi aman, cepat, dan tidak salah orang.

## Dokumen Yang Didukung

- KTP
- Kartu Keluarga
- BPJS/KIS/JKN
- Dokumen identitas lain

## Output Normalisasi

Semua hasil OCR harus dipetakan ke struktur:

```js
{
  documentType: 'KTP' | 'KK' | 'BPJS' | 'UNKNOWN',
  nik: '',
  noKk: '',
  nama: '',
  tanggalLahir: '',
  jenisKelamin: '',
  alamat: '',
  desa: '',
  dusun: '',
  confidence: 0,
  candidates: [],
  rawText: '',
  warnings: []
}
```

---

## OCR Pipeline

Buat file:

```txt
src/features/ocr/ocrPipeline.js
```

Tahapan:
1. Preprocess image.
2. Coba backend OCR jika aktif.
3. Jika gagal, fallback Tesseract.js.
4. Parse raw text.
5. Detect document type.
6. Extract fields.
7. Normalize fields.
8. Validate confidence.
9. Tampilkan review manual.

---

## Jangan Auto-Submit OCR

OCR hanya mengisi form sementara. Petugas wajib klik:
```txt
Gunakan Data Ini
```

Sebelum itu:
- Tampilkan hasil.
- Highlight confidence rendah.
- Tampilkan warning "Periksa ulang NIK dan nama".

---

## KK Candidate Selection

Untuk KK, jangan ambil anggota pertama otomatis.

UI:
```txt
Pilih anggota keluarga yang diperiksa
```

Tampilkan:
- nama,
- NIK,
- tanggal lahir,
- perkiraan jenis kelamin,
- confidence.

Petugas wajib memilih satu.

---

## Duplicate Check Setelah OCR

Setelah petugas memilih data OCR:
1. Jalankan cek NIK.
2. Jika pasien ada, tampilkan data existing.
3. Jika kunjungan tahun ini ada, arahkan ke kunjungan existing.
4. Jika tidak ada, lanjut registrasi baru.

---

## Confidence Rules

```js
function classifyConfidence(score) {
  if (score >= 85) return 'HIGH';
  if (score >= 65) return 'MEDIUM';
  return 'LOW';
}
```

UI:
- HIGH: hijau.
- MEDIUM: kuning.
- LOW: merah.

LOW wajib manual check.

---

## Field Warning

Tambahkan warning jika:
- NIK tidak 16 digit.
- Tanggal lahir tidak valid.
- Nama terlalu pendek.
- Jenis kelamin tidak terbaca.
- Alamat/desa tidak terbaca.
- Dokumen terdeteksi bukan KTP/KK/BPJS.

---

## Backend OCR Config

Buat config:

```js
export const OCR_CONFIG = {
  backendUrl: import.meta.env.VITE_OCR_BACKEND_URL || '',
  useBackendFirst: true,
  fallbackToTesseract: true,
  maxImageSize: 1600,
};
```

Jika backend tidak aktif:
- jangan error fatal,
- langsung fallback lokal.

---

## UI Smart Intake

Komponen:
```txt
ScanIdentityPanel
OcrResultReview
KkCandidatePicker
OcrWarnings
```

Letak:
- Pos1
- Kunjungan Rumah

---

## Data Audit OCR

Saat data OCR digunakan, simpan metadata:

```js
ocrMeta: {
  documentType,
  confidence,
  usedAt,
  usedBy,
  warnings,
  source: 'backend' | 'tesseract',
}
```

Jangan simpan raw image kecuali benar-benar diperlukan dan aman.

---

## Privacy

- Jangan upload dokumen identitas ke layanan pihak ketiga tanpa izin.
- Jika backend lokal dipakai, jelaskan endpoint lokal.
- Jangan simpan foto identitas permanen kecuali ada dasar operasional.
- Jika disimpan, batasi akses dan audit.

---

## Testing

1. Scan KTP jelas.
2. Pastikan NIK dan nama terbaca.
3. Scan KK.
4. Pastikan muncul kandidat anggota.
5. Pilih anggota.
6. Pastikan data masuk form.
7. Scan gambar buram.
8. Pastikan confidence rendah dan warning.
9. Matikan backend OCR.
10. Pastikan fallback Tesseract berjalan.
11. Cek duplicate NIK.

## Definition of Done

- OCR output distandarkan.
- KK tidak auto-pick anggota pertama.
- Ada confidence/warning.
- Ada duplicate check setelah OCR.
- OCR bisa fallback tanpa crash.

## Status Implementasi

Status: selesai teknis.

- Pipeline OCR standar tersedia di `src/features/ocr/ocrPipeline.js`.
- Review hasil OCR tersedia melalui `OcrResultReview`; hasil KTP tunggal tidak langsung dipakai sebelum petugas klik `Gunakan Data Ini`.
- Pos 1 dan Kunjungan Rumah memakai pipeline standar.
- KK tetap memakai candidate picker dan tidak memilih anggota otomatis.
- Confidence dan warnings ditampilkan saat review.
- Kunjungan Rumah memberi warning duplikasi saat NIK 16 digit terisi.
- Metadata OCR disimpan ke `ocrMeta` saat hasil OCR digunakan.
