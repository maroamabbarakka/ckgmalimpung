# CHANGELOG INTERNAL

## 2026-05-28 - Hardening route, auth claims, dan dashboard service

- Menambahkan halaman 404 untuk route tidak dikenal agar tidak otomatis menyamar sebagai dashboard.
- Menambahkan dukungan role dari Firebase Auth custom claims dengan fallback profil `users`.
- Memperbarui Firestore Rules agar role dapat dibaca dari custom claims atau dokumen `users`.
- Memindahkan query dan mutasi Dashboard operator ke `features/dashboard/dashboardService.js`.
- Menambahkan E2E untuk route tidak dikenal.
- Verifikasi:
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`
  - `E2E_BASE_URL=http://127.0.0.1:5177 npx playwright test tests/e2e/login.spec.cjs`

## 2026-05-28 - Admin Dashboard service extraction

- Memindahkan akses Firestore langsung dari `AdminDashboard.jsx` ke `services/adminService.js`.
- Menstandarkan operasi admin untuk subscribe visits, schools, staff, activity logs, CRUD sekolah/staff, cleanup duplikat, reset PIN, dan backup koleksi.
- Verifikasi:
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`
  - `E2E_BASE_URL=http://127.0.0.1:5178 npx playwright test tests/e2e/login.spec.cjs`

## 2026-05-28 - Queue dan kunjungan service cleanup

- Memindahkan query antrean dari `hooks/useQueue.js` ke `services/queueService.js`.
- Menghapus import Firebase langsung dari `KunjunganRumah.jsx` untuk validasi duplikat CKG tahun berjalan.
- Menyatukan validasi kunjungan CKG lewat `findCurrentYearCkgVisit` di `services/patientService.js`.
- Verifikasi:
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`

## 2026-05-28 - Smart UI/UX pack focus pass

- Menambahkan `src/styles/tokens.css` dan `src/styles/globals.css` sesuai token Smart UI/UX.
- Menambahkan focus state global, target sentuh minimal 44px, input mobile 16px, dan reduced motion guard.
- Memadatkan mobile bottom navigation menjadi maksimal 5 item: Home, Loket, Antrean, Pos, Menu.
- Menambahkan active-state grup Pos untuk semua route `/pos*` dan fallback ke Pos pertama yang bisa diakses user.
- Merapikan Beranda agar section alur pos tidak tampil kosong saat user belum login.
- Menambahkan workflow stepper Loket-Pos-Rapor dan panel kesiapan pada header pasien aktif Pos.
- Menampilkan lock owner/petugas aktif pada header pasien jika tersedia.
- Memperkuat smart form Pos 1 dengan input mode numerik, sanitasi angka NIK/HP, error inline, dan checklist kesiapan sebelum lanjut.
- Memperkuat form dinamis Pos 2-6 dengan SmartNumberInput, sanitasi angka/desimal, keyboard mobile yang sesuai, dan peringatan nilai ekstrem dekat field.
- Menstandarkan sticky bottom action bar Pos 2-7 lewat komponen `PosBottomActionBar`.
- Menyeragamkan label aksi Pos menjadi `Kembali ke Pos X`, `Simpan & Lanjut Pos X`, dan `Tandai Selesai`.
- Memperbarui responsive E2E agar validasi Pos tidak rapuh terhadap kapitalisasi label.
- Menambahkan panel `Yang perlu diperhatikan hari ini` pada Dashboard operator untuk prioritas belum final, bottleneck, masalah data, dan risiko dominan.
- Menambahkan status operasional TV publik: jumlah antrean aktif, waktu sinkron terakhir, dan fallback koneksi data tanpa menampilkan data sensitif.
- Menambahkan guard anti submit ganda di Pos 1-7 dan Kunjungan Rumah; tombol simpan Kunjungan Rumah terkunci saat OCR masih berjalan.
- Mengalihkan sumber antrean TV publik dari `visits` ke proyeksi aman `public_queue`; `panggilan_tv` hanya dibuka untuk data panggilan publik tanpa identitas pasien.
- Menambahkan skrip `migrate:public-queue` untuk backfill proyeksi antrean publik dan mencegah update status menimpa nomor antrean publik.
- Verifikasi:
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`
  - Visual Playwright mobile 390px tanpa horizontal overflow
  - `E2E_BASE_URL=https://ckg-malimpung.web.app npx playwright test responsive.spec.cjs public-tv.spec.cjs` (13 passed)
