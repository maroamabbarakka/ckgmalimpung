# Status ARAHAN 7

## Selesai

- Menambahkan `PatientStickyHeader` sebagai komponen presentasional untuk pola Pos pemeriksaan.
- `PatientStickyHeader` menampilkan:
  - nomor antrean
  - nama pasien
  - umur/kategori
  - NIK termasking
  - status antrean
  - tombol batal yang memakai handler parent
- Pos 2 mulai memakai `PatientStickyHeader` sebagai pola aman untuk Pos 2-7.
- Pos 3 sampai Pos 7 sudah memakai `PatientStickyHeader` dengan label dan warna pos masing-masing.
- Pos 2 sampai Pos 7 memakai empty state antrean yang konsisten saat belum ada pasien di pos.
- Form input Pos 2 kategori Lansia sudah dicek memakai pasien dummy lansia laki-laki 66 tahun (`A026`).
- Layout Antropometri Dasar Pos 2 diperbaiki agar field Tinggi/Panjang, Berat Badan, Lingkar Perut, LiLA, dan Lingkar Betis tersusun satu kolom rapi di mobile.
- Renderer form lintas pos diberi aturan field responsif berbasis tipe jawaban: angka klinis pendek memakai lebar ringkas di tablet/desktop, opsi panjang mendapat ruang lebih, dan jawaban naratif tetap lebar.
- Blok input lab di Pos 4 diselaraskan dengan pola field klinis responsif agar ukuran input, unit, dan interpretasi tetap konsisten dengan form pos lain.
- Lebar field angka pendek, input lab, dan voice input disesuaikan ulang agar proporsional: tidak semua jawaban pendek full width, sementara input naratif/voice tetap mendapat ruang cukup di mobile.
- Handler panggil, simpan, batal, kembali pos sebelumnya, payload pemeriksaan, dan status antrean tidak diubah.

## Batas Perubahan

- Tidak mengubah handler panggil pasien.
- Tidak mengubah handler simpan.
- Tidak mengubah handler kembali pos sebelumnya.
- Tidak mengubah payload medis atau status antrean.
- Tidak mengubah query, listener, atau service.
- Tidak mengubah schema pertanyaan, hanya cara field ditata dan dilebarkan sesuai jenis jawabannya.

## Catatan Lanjutan

- Komponen hanya menerima `visit` dari parent, tidak mengambil data sendiri.
- Cek visual mobile tetap disarankan untuk memastikan sticky header dan sticky submit nyaman dipakai di perangkat lapangan.

## Verifikasi

```bash
npm run lint
npm run test:run
npm run build
```

Status terakhir: semua sukses, termasuk e2e responsif/login. Warning build yang tersisa hanya peringatan ukuran chunk Vite.
