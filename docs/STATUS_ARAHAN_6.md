# Status ARAHAN 6

## Selesai

- Login desktop dibuat menjadi layout resmi dua area:
  - sisi branding layanan CKG
  - sisi card login existing
- Login mobile tetap sederhana: logo, nama aplikasi, deskripsi layanan, card login, footer.
- `handleLogin`, field username, field PIN, validasi, dan alur error tidak diubah.
- Loket ditambahkan status card:
  - Lokasi Aktif
  - Nomor Terakhir
  - Printer
- Status printer dibuat eksplisit: "Tersambung" atau "Cetak Browser".

## Batas Perubahan

- Tidak mengubah `handleAmbilAntrian`.
- Tidak mengubah proses Bluetooth printer.
- Tidak mengubah proses cetak browser.
- Tidak mengubah listener, query, atau payload Firestore.

## Perlu Cek Manual

- Login desktop tampil dua kolom dan tetap nyaman di layar besar.
- Login mobile tetap tidak overflow.
- Loket menampilkan lokasi aktif, nomor terakhir, dan status printer dengan jelas.
