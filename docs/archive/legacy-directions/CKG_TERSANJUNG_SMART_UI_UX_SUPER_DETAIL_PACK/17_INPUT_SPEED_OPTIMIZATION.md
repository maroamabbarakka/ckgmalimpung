# INPUT SPEED OPTIMIZATION

## TUJUAN
Mengurangi waktu input per pasien tanpa mengurangi akurasi.

## STRATEGI

### 1. Default Value
Isi otomatis:
- tanggal hari ini
- lokasi layanan default
- petugas aktif
- kategori usia setelah tanggal lahir

### 2. Smart Tab Order
Urutan tab harus mengikuti alur kerja operator.

### 3. Quick Select
Untuk pilihan umum gunakan:
- radio group
- segmented control
- chip selection

Contoh:
- jenis kelamin
- status hadir
- status normal/abnormal
- pilihan ya/tidak

### 4. Input Mask
Gunakan mask untuk:
- NIK
- nomor HP
- tanggal
- tekanan darah jika format gabungan

### 5. Recent Values
Untuk loket:
- desa terakhir dipakai
- petugas aktif
- lokasi pelayanan

### 6. Avoid Repeated Typing
Gunakan:
- autocomplete desa
- autocomplete nama dusun
- dropdown sumber data

## ACCEPTANCE
- input dasar pasien bisa selesai lebih cepat
- operator tidak mengetik field yang bisa dipilih
- tidak ada field angka yang membuka keyboard huruf di HP