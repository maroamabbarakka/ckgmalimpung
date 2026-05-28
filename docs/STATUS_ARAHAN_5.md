# Status ARAHAN 5

## Selesai

- Menambahkan `QueueStatusBadge` sebagai komponen presentasional aman.
- Badge status antrean mengikuti standar warna:
  - selesai: success
  - rujuk/risiko: danger
  - pemeriksaan: warning
  - pos/dipanggil: info
  - kosong/lainnya: neutral
- Dashboard memakai `QueueStatusBadge` pada tampilan mobile card dan desktop table.
- Perubahan mengikuti prinsip "wrap, don't rewrite": tidak ada handler, query, listener, payload, status, atau validasi yang diubah.

## Batas Perubahan

- Tidak mengubah contract data antrean.
- Tidak mengubah business logic dashboard.
- Tidak mengubah filter, sort, export, atau edit data.

## Perlu Cek Manual

- Dashboard mobile: status tampil sebagai badge dan tidak memotong isi kartu.
- Dashboard desktop: kolom posisi antrean tetap rapi.
- Status "Selesai" dan status Pos 1-7 tampil dengan warna yang mudah dibaca.
