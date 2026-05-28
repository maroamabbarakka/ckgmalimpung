# LOKET SMART INTAKE UX

## TUJUAN
Loket adalah titik paling penting untuk mempercepat pelayanan.

## LAYOUT LOKET

Desktop:
```txt
[Search/Create Patient] [Queue Summary]
[Patient Form]         [Recent Patients]
```

Mobile:
```txt
Search
Quick actions
Patient form section by section
Bottom action bar
```

## SEARCH FIRST FLOW
Sebelum membuat pasien baru, operator harus diarahkan mencari dulu.

Urutan:
1. Cari NIK/nama/tanggal lahir.
2. Jika ditemukan → buka pasien.
3. Jika tidak ditemukan → buat pasien baru.
4. Jika mirip → tampilkan kemungkinan duplikat.

## DUPLICATE WARNING
Jika nama/tanggal lahir mirip:
- tampilkan modal "Kemungkinan pasien sudah ada"
- tampilkan 3-5 kandidat
- tombol: Gunakan Data Ini / Tetap Buat Baru

## OCR UX
OCR tidak boleh langsung mengganti data tanpa review.

Flow:
1. Upload/ambil foto KTP/KK
2. OCR membaca data
3. tampilkan hasil OCR dalam panel review
4. field confidence rendah diberi tanda
5. operator klik "Terapkan ke Form"

## QUICK ACTION
Tombol cepat:
- Cari Pasien
- Pasien Baru
- Scan KTP/KK
- Lihat Antrean

## ACCEPTANCE
- Pasien baru tidak dibuat sebelum proses pencarian.
- OCR selalu punya tahap review.
- Data duplikat diberi peringatan jelas.