# Status ARAHAN 4

## Selesai

- Login menampilkan identitas layanan resmi: "Sistem Layanan Cek Kesehatan Gratis".
- Login tetap memakai field yang sama dan tidak mengubah logic submit.
- Input PIN Login dirapikan memakai `AppInput` agar konsisten dengan design system.
- Loket memakai CTA utama sesuai arahan: "AMBIL NOMOR ANTREAN".
- Loket menampilkan "Nomor Terakhir" setelah tiket berhasil dibuat.
- Data nomor terakhir mengambil hasil dari `createQueueTicket`, sehingga tidak mengubah struktur data atau alur antrean.

## Batas Perubahan

- Tidak mengubah struktur Firestore.
- Tidak mengubah nama field.
- Tidak mengubah business logic antrean.
- Tidak mengubah proses cetak browser maupun Bluetooth.

## Perlu Cek Manual

- Ambil nomor antrean dari Loket.
- Pastikan nomor terakhir tampil sesuai tiket yang baru dibuat.
- Pastikan cetak browser dan Bluetooth tetap berjalan sesuai perangkat yang digunakan.
