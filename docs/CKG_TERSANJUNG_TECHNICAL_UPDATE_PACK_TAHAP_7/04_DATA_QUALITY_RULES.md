# DATA QUALITY RULES

## TUJUAN
Data CKG harus bisa dipakai untuk laporan, analitik, dan pengambilan keputusan.

## VALIDASI WAJIB

### Identitas
- nama tidak boleh kosong
- tanggal lahir valid
- jenis kelamin wajib
- NIK 16 digit jika tersedia
- alamat minimal desa/kelurahan

### Kunjungan
- satu pasien tidak boleh punya CKG final dobel di tahun yang sama
- tanggal kunjungan wajib
- pos pemeriksaan wajib sesuai kategori

### Pemeriksaan
- nilai numerik harus punya range aman
- hasil lab tidak boleh string bebas jika seharusnya angka
- status normal/abnormal harus dihitung konsisten

## DATA CLEANING DASHBOARD
Buat halaman admin:
- NIK invalid
- tanggal lahir kosong
- data duplikat
- kunjungan belum final
- pemeriksaan ekstrem

## ACCEPTANCE CRITERIA
- admin bisa melihat data bermasalah
- data bermasalah bisa diperbaiki dengan audit log
- tidak ada silent correction tanpa catatan

## Status Implementasi

Status: baseline teknis berjalan.

- Evaluator kualitas data tersedia di `src/features/dataQuality/dataQualityRules.js`.
- Dashboard memakai evaluator untuk menghitung NIK bermasalah, tanggal lahir bermasalah, gender bermasalah, desa kosong, workflow kosong, final tanpa validasi dokter, dan identitas duplikat pada tahun yang sama.
- Unit test tersedia di `src/features/dataQuality/dataQualityRules.test.js`.
- Evaluator hanya menandai issue; tidak melakukan koreksi otomatis sehingga tidak ada silent correction.
