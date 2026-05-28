# Dokumen Fitur Smart Fill CKG

## Sistem TERSANJUNG UPT Puskesmas Malimpung

Dokumen ini menjelaskan fitur **Smart Fill CKG** pada aplikasi TERSANJUNG. Dokumen ini disiapkan sebagai bahan penjelasan untuk kepala puskesmas, tenaga kesehatan, petugas/operator, dan pihak lain yang ingin memahami bagaimana aplikasi membantu mempercepat pengisian data Cek Kesehatan Gratis tanpa keluar dari format formulir resmi.

---

## 1. Ringkasan

Smart Fill CKG adalah mekanisme bantuan pengisian otomatis dan tampilan pertanyaan berjenjang pada form pemeriksaan CKG.

Tujuan utamanya:

- Mempercepat kerja petugas/nakes saat mengisi form.
- Mengurangi pertanyaan yang tidak relevan.
- Mengurangi input berulang.
- Membantu interpretasi awal berdasarkan jawaban yang sudah diisi.
- Tetap memastikan output data mengikuti struktur resmi `formSchemas.json`.

Prinsip penting:

> UI boleh dibuat lebih pintar, lebih ringkas, dan lebih mudah dipahami petugas. Namun data akhir yang disimpan tetap mengikuti ID pertanyaan dan opsi jawaban resmi yang ada di `formSchemas.json`.

---

## 2. Prinsip Kepatuhan Terhadap Form Schema

Semua hasil akhir pemeriksaan tetap mengarah ke `formSchemas.json`.

Artinya:

- Setiap data yang disimpan menggunakan ID pertanyaan resmi, misalnya `BAL3_018`, `LM45_072`, `BBL_016`, dan seterusnya.
- Jawaban yang tersimpan tetap memakai nilai resmi dari opsi schema.
- Pertanyaan bantu di UI tidak ikut menjadi output laporan.
- Field virtual seperti `VIRTUAL_PUASA`, `VIRTUAL_AKTIVITAS_ANAK_STATUS`, dan `VIRTUAL_LAMA_HT` hanya digunakan untuk memandu tampilan, bukan untuk mengganti format laporan.

Sistem sudah dilengkapi penyaring data sehingga saat disimpan ke database, hanya field yang benar-benar ada di `formSchemas.json` yang masuk ke data pos pemeriksaan.

---

## 3. Cara Kerja Smart Fill

Smart Fill bekerja melalui beberapa pola:

### 3.1 Pertanyaan Berjenjang

Pertanyaan lanjutan hanya muncul jika ada pemicu.

Contoh:

- Skoring TB anak muncul jika ada kontak TB.
- Pemeriksaan lanjutan talasemia muncul jika ada faktor risiko talasemia.
- Pemeriksaan gula darah balita muncul jika ada indikasi gejala DM.
- Konfirmasi SHK/G6PD/HAK pada bayi baru lahir muncul jika hasil skrining awal positif.

### 3.2 Auto Interpretasi

Sistem membantu mengisi field interpretasi yang memang tersedia di schema.

Contoh:

- Risiko TB anak.
- Faktor risiko talasemia.
- Keluhan/gejala DM.
- Tingkat aktivitas fisik dewasa/lansia.
- Interpretasi kanker paru.
- Riwayat merokok APCS.
- Hasil Penyakit Jantung Bawaan pada BBL dari pulse oximetry.

### 3.3 Tampilan Bahasa Petugas

Beberapa pertanyaan panjang ditampilkan dengan label yang lebih ringkas di UI agar mudah dipahami petugas.

Contoh:

- Pertanyaan panjang tentang kontak TBC ditampilkan sebagai `Kontak Serumah Penderita TB?`
- Pertanyaan aktivitas fisik anak ditampilkan sebagai `Aktif 60 Menit: 7 Hari Terakhir`
- Pertanyaan frekuensi olahraga dewasa ditampilkan sebagai `Frekuensi Olahraga per Minggu`

Walaupun label UI diringkas, data tetap disimpan ke ID schema asli.

---

## 4. Fitur Per Klaster

## 4.1 Bayi Baru Lahir / BBL

Fitur smart fill:

- Hasil Pemeriksaan Penyakit Jantung Bawaan otomatis dibantu dari nilai pulse oximetry tangan kanan dan kaki.
- Jika nilai pulse oximetry normal, hasil diarahkan ke `Normal`.
- Jika nilai mengarah abnormal, hasil diarahkan ke `Abnormal`.
- Konfirmasi SHK/G6PD/HAK hanya muncul jika hasil skrining awal positif.
- Pemeriksaan ikterus dan warna tinja tetap mengikuti opsi Buku KIA/schema.

Manfaat:

- Petugas tidak perlu menilai ulang semua pertanyaan lanjutan jika hasil awal normal.
- Risiko salah mengisi konfirmasi yang tidak diperlukan berkurang.

Catatan:

- Sistem membantu interpretasi awal, tetapi keputusan klinis tetap oleh tenaga kesehatan.

---

## 4.2 Balita 1 Tahun

Fitur smart fill:

- Alur TB anak dibuat berjenjang.
- Pertanyaan skoring TB anak hanya muncul jika ada kontak TB.
- Pertumbuhan, KPSP, daya dengar, pupil putih, dan gigi tetap mengikuti schema.

Manfaat:

- Petugas tidak disuguhi field skoring TB jika tidak ada kontak TB.
- Pengisian lebih cepat untuk balita tanpa risiko TB.

---

## 4.3 Balita 2 Tahun

Fitur smart fill:

- Risiko TB anak dapat dibantu dari jawaban gejala dan kontak.
- M-CHAT hanya relevan bila ada indikasi keterlambatan bicara, gangguan komunikasi/interaksi sosial, atau perilaku berulang.
- Pemeriksaan lab seperti Hb, MCV, MCH, RBC, dan RDW tetap mengikuti field schema.

Manfaat:

- Petugas lebih mudah membedakan pertanyaan skrining awal dan pemeriksaan lanjutan.

---

## 4.4 Balita 3-6 Tahun

Fitur smart fill:

- Risiko TB anak otomatis dari gejala dan kontak.
- Faktor risiko talasemia otomatis dari riwayat keluarga/pembawa sifat.
- Keluhan dan gejala DM otomatis dari gejala lapar, haus, sering pipis, mengompol, berat badan turun drastis, dan riwayat orang tua.
- KMPE dan GPPH hanya muncul bila ada indikasi perilaku/emosi atau hiperaktivitas.
- Pemeriksaan lanjutan talasemia hanya muncul bila ada faktor risiko.
- Pemeriksaan gula darah hanya muncul bila ada indikasi DM.

Manfaat:

- Alur balita 3-6 tahun menjadi lebih singkat untuk pasien normal.
- Petugas tetap bisa mengisi lengkap saat ada indikasi.

---

## 4.5 Anak Sekolah / SD, SMP, SMA

Fitur smart fill:

- Aktivitas fisik anak tidak disamakan dengan aktivitas fisik dewasa.
- Jawaban aktivitas fisik anak memakai jumlah hari aktif minimal 60 menit:
  - `0 hari` sampai `7 hari`.
- Sistem menampilkan interpretasi bantuan:
  - Kurang aktif.
  - Cukup aktif, perlu ditingkatkan.
  - Aktif sesuai anjuran anak.
- Interpretasi ini hanya bantuan UI dan tidak mengganti field schema.

Manfaat:

- Petugas tidak perlu mengetik jawaban bebas.
- Data aktivitas fisik anak menjadi lebih seragam.

---

## 4.6 Dewasa 18-39 Tahun

Fitur smart fill:

- Aktivitas fisik dewasa dibuat lebih terstruktur:
  - rutin olahraga,
  - frekuensi olahraga per minggu,
  - durasi olahraga per sesi,
  - tingkat aktivitas fisik.
- Tingkat aktivitas fisik otomatis dihitung dari frekuensi dan durasi.
- Riwayat merokok APCS dirangkum otomatis dari jawaban merokok, lama merokok, jumlah batang, riwayat sebelumnya, dan paparan asap.

Manfaat:

- Petugas cukup mengisi data dasar, sistem membantu menyusun interpretasi yang tersedia di schema.

---

## 4.7 Dewasa 40-59 Tahun

Fitur smart fill:

- Sama seperti dewasa muda, ditambah alur risiko paru/PUMA, profil lipid, fungsi ginjal/hati, kanker tertentu, dan EKG bersyarat.
- Pemeriksaan EKG diarahkan bila ada indikasi hipertensi.
- Interpretasi kanker paru dapat dibantu dari:
  - riwayat merokok,
  - bungkus-tahun,
  - paparan asap rokok,
  - lingkungan tempat tinggal berisiko,
  - lingkungan rumah tidak sehat.

Manfaat:

- Field interpretasi tidak lagi dibiarkan kosong tanpa panduan.
- Petugas tetap dapat menyesuaikan sesuai hasil klinis.

---

## 4.8 Lansia

Fitur smart fill:

- Aktivitas fisik lansia tidak disamakan dengan dewasa umum.
- Interpretasi lansia menggunakan pilihan seperti `Aktif sesuai kemampuan`.
- LiLA lansia mengikuti schema, yaitu pertanyaan `Apakah ukuran lingkar lengan atas (LiLA) <21 cm?` dengan jawaban `Ya/Tidak`.
- Alur geriatri, kognitif, ADL, risiko jatuh, dan MNA tetap mengikuti schema.

Manfaat:

- Pengisian lansia menjadi lebih terarah meskipun jumlah pertanyaannya banyak.
- Risiko salah format jawaban LiLA berkurang.

---

## 5. Contoh Otomatisasi

### 5.1 Skoring TB Anak

Jika kontak TB dijawab `Tidak`, maka field skoring TB dengan kontak tidak ditampilkan.

Jika kontak TB dijawab `Ya`, sistem membantu mengisi ringkasan indikator ke field hasil skoring, misalnya:

`Kontak TB: Ya; indikator: batuk >2 minggu, BB turun, Mantoux: Positif >=10 mm`

Catatan:

Ini bukan kalkulator skor numerik penuh. Sistem saat ini membuat ringkasan sesuai field text yang tersedia di schema.

### 5.2 Aktivitas Fisik Anak

Pertanyaan:

- Dalam 7 hari terakhir, berapa hari anak aktif minimal 60 menit?
- Biasanya dalam satu minggu, berapa hari anak aktif minimal 60 menit?

Jawaban:

- `0 hari` sampai `7 hari`.

Sistem menampilkan interpretasi di UI, tetapi tidak menyimpan field baru.

### 5.3 Aktivitas Fisik Dewasa

Jika pasien menjawab rutin olahraga `Tidak`, sistem mengisi tingkat aktivitas fisik menjadi:

`Tidak aktif`

Jika pasien menjawab `Ya`, frekuensi dan durasi digunakan untuk mengisi:

- `Kurang aktif (<150 menit/minggu)`
- `Cukup aktif (>=150 menit/minggu)`
- `Sangat aktif (>=300 menit/minggu)`

### 5.4 Pemeriksaan BBL

Jika hasil lab SHK/G6PD/HAK negatif, pertanyaan konfirmasi tidak perlu muncul.

Jika hasil positif, pertanyaan konfirmasi muncul untuk ditindaklanjuti.

---

## 6. Batasan dan Catatan Penting

Smart Fill adalah alat bantu, bukan pengganti keputusan tenaga kesehatan.

Hal yang tetap menjadi kewenangan nakes:

- Menentukan diagnosis akhir.
- Menentukan rujukan.
- Mengoreksi hasil otomatis jika tidak sesuai kondisi klinis.
- Memastikan pemeriksaan dilakukan sesuai SOP.

Hal yang sengaja tidak dilakukan sistem:

- Menyimpan field virtual sebagai output resmi.
- Mengubah struktur laporan di luar `formSchemas.json`.
- Menambahkan pertanyaan baru tanpa dasar schema.
- Mengubah hasil klinis tanpa data pemicu.

---

## 7. Jaminan Output

Output pemeriksaan tetap mengikuti `formSchemas.json`.

Sistem menggunakan penyaring data sebelum menyimpan hasil pemeriksaan:

- Data valid: ID pertanyaan ada di schema.
- Data bantu/virtual: tidak ikut disimpan.
- Question map tetap berasal dari schema.

Dengan demikian, meskipun tampilan UI lebih sederhana dan lebih cerdas, hasil akhir tetap kompatibel dengan struktur formulir CKG yang ditetapkan.

---

## 8. Status Implementasi

Fitur yang sudah diterapkan:

- Smart routing pertanyaan per Pos.
- Smart fill TB anak.
- Smart fill DM balita.
- Smart fill talasemia balita.
- Smart fill aktivitas fisik anak, dewasa, dan lansia.
- Smart fill BBL untuk PJB dan konfirmasi SHK/G6PD/HAK.
- Smart fill riwayat merokok APCS.
- Smart fill interpretasi kanker paru.
- Filter output agar tetap sesuai `formSchemas.json`.

Status validasi teknis:

- JSON schema valid.
- Lint aplikasi lulus.
- Build produksi lulus.
- Simulasi klaster umur lulus.
- Field virtual terbukti tidak ikut masuk output.

---

## 9. Rekomendasi Lanjutan

Rekomendasi pengembangan berikutnya:

- Membuat kalkulator skor TB anak numerik penuh jika rumus dan bobot skor resmi tersedia.
- Memecah Pos 5 menjadi subalur yang lebih ringan: TB, gaya hidup, kanker, paru, kulit.
- Memperluas tombol `Isi Normal` atau `Tidak Ada Keluhan` untuk klaster lansia.
- Membuat tampilan khusus BBL agar tidak terasa seperti alur dewasa.
- Menambahkan dokumentasi visual berupa screenshot per Pos untuk pelatihan operator.

---

## 10. Penutup

Smart Fill CKG dirancang untuk membantu petugas bekerja lebih cepat dan lebih konsisten tanpa mengurangi tujuan utama pemeriksaan CKG.

Prinsip akhirnya sederhana:

> Nakes mengisi lebih mudah, sistem membantu lebih banyak, tetapi hasil akhir tetap mengikuti `formSchemas.json`.

