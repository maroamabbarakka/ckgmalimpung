# Status ARAHAN 9

## Selesai / Sudah Sesuai

- `InstallAppBanner` tersedia dan dipasang di AppShell.
- `ConnectionStatus` tersedia dan dipakai melalui `SyncStatusBanner`, serta sudah tampil di Admin.
- `useIdleTimeout` tersedia dan aktif di AppShell untuk sesi non-blank layout.
- Deep link sudah aman:
  - auth loading menampilkan `LoadingState`
  - belum login diarahkan ke `/login`
  - role tidak sesuai diarahkan ke `/dashboard`
  - route tidak dikenal diarahkan ke `/dashboard`
- Firebase Hosting sudah memiliki rewrite SPA ke `/index.html`.
- Mobile safe area sudah dipakai di bottom nav, install banner, dan submit area pos.
- Login, Loket, Pos, dan beberapa aksi penting sudah memakai disabled/loading label untuk mencegah double submit.
- NIK sudah dimasking di Dashboard, Admin, Rapor, dan `PatientStickyHeader`.
- Bluetooth printer di Loket memakai pesan izin yang lebih ramah pengguna.

## Dikerjakan Pada Tahap Ini

- Menambahkan tombol `Kembali` mobile berbasis `safeBack` di AppShell.
- Menambahkan tombol `Kembali` mobile langsung di Admin Dashboard.
- Memastikan fallback role tidak berakhir pada redirect loop ke `/dashboard`.
- Mengarahkan logout Admin ke `/login` dengan `replace`.
- Menambahkan empty state antrean standar untuk Pos 2 sampai Pos 7 agar halaman pos tidak tampak kosong saat belum ada pasien.
- Menambahkan uji e2e responsif untuk viewport 320, 360, 390, 430, dan 768px.
- Menjaga AppShell tetap memakai mobile/tablet navigation sampai `lg` agar tablet kecil tidak overflow.
- Memperluas uji e2e responsif ke Pos 1, Pos 7, dan Admin Dashboard.
- Memakai viewport meta `viewport-fit=cover` dan mengizinkan zoom browser untuk aksesibilitas.
- Menambahkan konfigurasi Playwright khusus e2e agar tidak bercampur dengan test unit.
- Melakukan audit visual screenshot untuk seluruh Pos 1-7 dan tampilan klaster pada ukuran 320, 390, dan 768px.
- Merapikan header mobile dan kepadatan bottom navigation untuk layar 320px.
- Memastikan status ARAHAN_8/9 terdokumentasi sebagai checklist reliability PWA.

## Batas Perubahan

- Tidak mengubah struktur Firestore.
- Tidak mengubah query utama.
- Tidak mengubah flow antrean.
- Tidak mengubah validasi medis.
- Tidak mengubah submit handler.

## Perlu Cek Manual

- Install PWA di Android Chrome.
- iPhone Safari: pastikan instruksi manual muncul jika install prompt native tidak tersedia.
- Matikan internet: indikator offline harus muncul.
- Tunggu idle sesuai durasi: peringatan sesi harus muncul sebelum logout.
- Mobile back: halaman selain Dashboard/Beranda harus kembali bertahap atau fallback ke Dashboard.
