# SMART UI/UX PRINCIPLES

## DEFINISI SMART UI/UX
SMART UI/UX bukan sekadar tampilan modern. Untuk aplikasi CKG, SMART berarti:
- sistem membantu operator mengisi data
- sistem memberi peringatan sebelum salah
- sistem mengurangi input berulang
- sistem menyembunyikan hal yang belum perlu
- sistem menampilkan prioritas kerja berikutnya
- sistem tetap nyaman di HP kecil
- sistem tetap kuat untuk desktop admin

## ONE SCREEN, ONE JOB
Setiap layar harus punya satu tujuan utama.

Contoh:
- Loket: cari/input pasien
- Pos pemeriksaan: isi pemeriksaan pasien aktif
- Dashboard: lihat status layanan
- Rapor: review dan cetak

Hindari:
- terlalu banyak tombol sejajar
- terlalu banyak tabel dalam satu layar
- terlalu banyak warna status
- menampilkan field yang belum relevan

## PRIMARY ACTION SELALU JELAS
Di setiap halaman harus jelas tombol utama.

Contoh:
- Simpan Data
- Lanjut ke Pos Berikutnya
- Panggil Pasien
- Cetak Rapor

Aturan:
- hanya satu primary action per layar/section
- warna konsisten
- posisi konsisten
- minimal tinggi 44px di mobile
- loading state saat diproses

## INPUT MINIMAL
Jangan minta operator mengisi ulang data yang bisa dihitung/diambil otomatis.

Otomatisasi:
- umur dari tanggal lahir
- kategori usia dari umur
- gender dari input awal
- status kelengkapan pos dari field wajib
- nomor antrean dari sistem
- tanggal kunjungan dari hari aktif

## ERROR HARUS MENGAJARI
Error bukan hanya mengatakan gagal, tapi memberi solusi.

Salah:
- Error
- Failed
- Invalid input

Benar:
- NIK harus 16 digit angka.
- Tekanan darah sistolik terlalu tinggi. Periksa ulang input.
- Data belum bisa disimpan karena nama pasien masih kosong.

## MOBILE FIRST UNTUK OPERATOR
Wajib:
- form tidak terlalu lebar
- tombol mudah ditekan
- bottom action bar
- input angka membuka numeric keyboard
- modal tidak terpotong
- tidak ada horizontal scroll liar

## DESKTOP POWERFUL UNTUK ADMIN
Wajib:
- tabel jelas
- filter cepat
- export mudah
- dashboard analitik
- panel admin konsisten