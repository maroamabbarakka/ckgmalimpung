# SMART FORM INPUT SYSTEM

## TUJUAN
Mengubah proses input dari manual panjang menjadi cepat, terarah, dan minim kesalahan.

## PROGRESSIVE DISCLOSURE
Jangan tampilkan semua field sekaligus.
Tampilkan berdasarkan:
- kategori usia
- jenis kelamin
- pos aktif
- jawaban sebelumnya

## AUTO FILL
Field yang bisa otomatis jangan diminta manual:
- umur dari tanggal lahir
- kategori usia dari umur
- tanggal pelayanan dari setting hari aktif
- status pos dari kelengkapan field

## INPUT MODE TEPAT
- NIK → numeric
- tekanan darah → numeric
- berat badan → decimal
- tanggal lahir → date
- pilihan terbatas → select/radio

## INLINE VALIDATION
Jangan tunggu submit.
Validasi saat field blur atau saat nilai tidak wajar.

## FIELD GROUPING

```txt
1. Identitas Ringkas
2. Data Wajib Pos
3. Pemeriksaan Tambahan
4. Catatan Petugas
5. Ringkasan & Simpan
```

## SMART SUGGESTION
Jika umur < 5 tahun:
- tampilkan field anak
- sembunyikan field dewasa

Jika gender perempuan:
- tampilkan pertanyaan relevan perempuan
- tetap jaga privasi tampilan

Jika tekanan darah sangat tinggi:
- tampilkan warning "Periksa ulang input"
- jangan langsung menyimpulkan diagnosis

## AUTOSAVE
Implementasi:
- simpan draft setiap 10-15 detik
- simpan saat pindah section
- tampilkan status "Draft tersimpan"

Status:
- Belum tersimpan
- Menyimpan...
- Draft tersimpan
- Gagal menyimpan

## ACCEPTANCE
- Operator tidak kehilangan data saat refresh.
- Field wajib jelas.
- Error tampil dekat field.
- Tidak ada alert browser untuk validasi normal.