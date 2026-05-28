# CKG Malimpung - Riwayat Implementasi SMART UI/UX

Tanggal pembaruan: 29 Mei 2026

Dokumen ini menyimpan riwayat detail perubahan UI/UX agar pengembangan berikutnya dapat dilanjutkan tanpa kehilangan konteks. Prinsip aktif tetap mengacu pada `docs/core/SMART_UI_UX_STANDARD.md`.

## Prinsip yang Dijaga

- Tidak mengubah Firestore structure, FormSchemas, smart fill engine, workflow Pos, export system, auth flow, atau routing utama.
- Perubahan difokuskan pada UI, UX, layout, hierarchy, spacing, responsive behavior, visual consistency, dan interaction.
- Seluruh halaman diarahkan menjadi Healthcare Workflow App: cepat, ringan, jelas, mobile-first, workflow-oriented, dan tidak melelahkan.

## Dashboard / Home

- Mengubah arah visual dari admin dashboard menjadi Healthcare Workflow Hub.
- Menambahkan background soft healthcare global.
- Memperbaiki header desktop dan mobile dengan brand identity, online badge, dan pill navigation.
- Membuat hero lebih compact dengan identitas TERSANJUNG, status operasional, dan hierarchy yang lebih jelas.
- Membuat workflow Pos terasa sebagai progression, bukan menu biasa.
- Menambahkan workflow number transparan pada card Pos.
- Menstandarkan accent Pos:
  - Pos 1 blue
  - Pos 2 indigo
  - Pos 3 rose
  - Pos 4 purple
  - Pos 5 violet
  - Pos 6 cyan
  - Pos 7 green
  - Door to Door mint
- Merapikan module card agar lebih ringan daripada workflow utama.
- Mengubah bottom navigation mobile menjadi pola super app dengan Home, Loket, Antrean, Pos, dan Menu.
- Menambahkan panel Pos dan panel Menu pada bottom nav mobile.
- Pada mobile, module section di halaman utama disembunyikan karena akses modul sudah tersedia melalui bottom nav Menu. Tujuannya mengurangi panjang scroll dashboard.

## Pos 1 - Registrasi

- Mengurangi tinggi hero Pos 1.
- Membuat queue card lebih mudah discan dan tombol panggil lebih jelas.
- Mengubah active queue header menjadi soft operational banner.
- Memecah form secara visual menjadi:
  - Identitas Utama
  - Kontak & Domisili
  - Checklist sebelum lanjut
- Menstandarkan input height, border, focus ring, placeholder, label, helper, dan validation chip.
- Memperbaiki gender selector menjadi soft blue/soft rose.
- Menambahkan smart helper untuk usia otomatis.
- Mengubah checklist validasi menjadi chip system.
- Membuat action bar Pos 1 sticky dan sejajar dengan pola Pos 2-7.
- Memastikan action bar Pos 1 tidak overlap dengan bottom nav.

## Pos 2 - Antropometri, Tensi, Gula Darah

- Mengubah header Pos dari purple dominant menjadi soft healthcare blue gradient.
- Menstandarkan header mobile Pos agar hanya menampilkan informasi kerja penting:
  - nomor antrean
  - nama pasien
  - umur dan klaster
  - tombol Antri Pos X
  - tombol batal
- Menyembunyikan stepper panjang, NIK panjang, status chip banyak, dan judul panjang di mobile.
- Memecah form menjadi section card:
  - Antropometri Dasar
  - Tekanan Darah
  - Skrining Gula Darah
- Membuat measurement input dengan unit badge di dalam field.
- Memperbaiki input 2-3 digit agar tidak terpotong di mobile.
- Membuat field angka pendek memakai dua kolom di mobile.
- Mengubah IMT result card dari gelap menjadi soft result card.
- Menggunakan segmented control untuk LILA, puasa, dan boolean.
- Membuat sticky action bar mobile dengan warna primary yang sama seperti Pos 1.

## Pos 3 sampai Pos 7

- Menstandarkan `PatientStickyHeader` untuk Pos 2-7.
- Menstandarkan `PosBottomActionBar` untuk tombol kembali, simpan lanjut, kirim WA, dan selesai.
- Menambahkan reusable queue list:
  - `QueueCallList`
  - `QueuePatientCard`
  - `QueueCallButton`
- Menyamakan daftar panggilan pasien di semua Pos dengan pola Pos 1.
- Menambahkan umur dan klaster di bawah nama pasien pada kartu antrean.
- Menyamakan form section card agar mengikuti Pos 2.
- Memperbaiki question card panjang pada Pos 5 dan Pos 6 agar tidak terlalu kecil, tidak terlalu uppercase, dan lebih mudah dibaca.
- Memperbaiki unit badge laboratorium Pos 4 agar tidak tampil sebagai bar abu-abu.
- Merapikan ringkasan klinis Pos 7 agar teks panjang tidak overflow.
- Membuat action bar Pos 7 dengan tiga aksi tetap compact dan aman dari bottom nav.

## Door to Door / Kunjungan Rumah

- Menstandarkan tombol lanjut dan kembali agar sama dengan Pos.
- Mengubah header stepper dark navy/purple menjadi soft healthcare blue.
- Menstandarkan input, select, label, segmented control, dan card section mengikuti SMART UI/UX.
- Melembutkan gender selector agar tidak neon.
- Menjaga action behavior dan alur data tetap sama.

## Loket

- Mengubah Loket menjadi modern healthcare queue kiosk.
- Menggunakan dark navy background dengan floating kiosk card.
- Memperbaiki hero Loket, printer button, lokasi info, status grid, selector, CTA antrean, dan success ticket state.
- Menambahkan toast/feedback soft untuk aksi cetak.
- Menstandarkan bottom nav aktif dan spacing mobile.

## Analitik Demografi / Admin Wilayah

- Mengubah header mobile agar lebih compact.
- Menambahkan filter summary dan tombol `Ubah` di mobile.
- Filter detail mobile dibuat collapsible agar insight tidak tertutup filter panjang.
- Tombol `Reset Filter` diubah menjadi secondary action.
- Mengubah tabel capaian Dusun/Lingkungan menjadi card list di mobile.
- Desktop tetap memakai tabel untuk scanning data luas.
- Visual card demografi dan PTM diarahkan ke soft healthcare, bukan dashboard widget berat.

## Typography dan Global CSS

- Menambahkan typography lock untuk Inter dan Poppins.
- Menstandarkan heading, label, helper, input, segmented control, validation chip, queue button, dan action button.
- Menambahkan final override untuk menjaga konsistensi setelah banyak lapisan CSS lama.
- Menjaga spacing mobile agar tidak melelahkan dan tidak overlap dengan bottom nav.

## Dokumentasi dan Artefak

- `docs/core/SMART_UI_UX_STANDARD.md` menjadi standar aktif UI/UX.
- `docs/core/IMPLEMENTATION_HISTORY_SMART_UI_UX.md` menyimpan riwayat implementasi detail.
- `public/Laporan_Tersanjung_Final.html` diperbarui untuk mencerminkan status Healthcare Workflow Super App.
- Halaman `Tentang` diperbarui agar menjelaskan arah produk, modul, prinsip SMART UI/UX, dan artefak dokumentasi.

## Optimasi Share Link & SEO

- Mengoptimalkan berkas `index.html` untuk memunculkan cover/thumbnail secara otomatis saat membagikan tautan aplikasi (seperti ke WhatsApp, Telegram, Facebook, dan Twitter).
- Menambahkan parameter dimensi gambar spesifik `og:image:width` (1200) dan `og:image:height` (675) untuk resolusi gambar `puskesmas_malimpung.jpg` (1200x675 px).
- Menambahkan tag `<meta itemprop="image">` dan properti `og:site_name` untuk memperkuat kompatibilitas di platform versi lama.
- Memastikan berkas gambar statis `puskesmas_malimpung.jpg` berukuran ringan (153 KB, di bawah batas maksimal WhatsApp 300 KB) agar langsung diproses oleh crawler perpesanan.
- Menambahkan penanda namespace `prefix="og: https://ogp.me/ns#"` pada tag `<html>`.

## Pembersihan Data Pasien Dummy (TERSANJUNG 4.4.1)

- Membuat skrip pembersihan `scripts/cleanup_dummy_ckg.mjs` untuk memindai dan menghapus data dummy.
- Melakukan penghapusan secara batch sebanyak 72 dokumen (36 dokumen `patients` dan 36 dokumen `visits`) yang ditandai dengan `seed_dummy: true`, no HP seeder dummy, atau ID kunjungan dummy.
- Mempertahankan 1 dokumen kunjungan riil di Firestore.
- Memastikan aturan keamanan (`firestore.rules`) dikembalikan ke konfigurasi produksi pasca-pembersihan.

## Impor Data Dummy CKG Tersanjung & Dummy Data Manager (TERSANJUNG 4.5.0)

- Membuat skrip validasi `scripts/validateImport.js` untuk memverifikasi data sebelum impor (memastikan NIK 16 digit, format tanggal ISO, nomor HP terstandarisasi 08, gender L/P, serta mendeteksi NIK ganda).
- Membuat skrip impor `scripts/importPatients.js` untuk membaca file Excel `src/docs/CKG_Tersanjung_Import_CKGMalimpung_FormSchema.xlsx` dan mengunggah data dummy pasien (79 data) ke Cloud Firestore secara batch.
- Menyusun distribusi pos secara merata menggunakan algoritma round-robin ke 7 Pos berbeda untuk data kunjungan dummy.
- Memetakan jawaban kuesioner dari long format sheet ke pos-pos yang sesuai di visits dengan pengisian default jawaban normal/netral jika kosong guna menjaga kompatibilitas laporan dan grafik.
- Memberikan penanda metadata dummy pada seluruh data terimpor (`isDummy: true`, `importBatch: "CKG_TERSANJUNG_2026"`, dsb.) untuk keamanan pembersihan.
- Membuat komponen antarmuka admin `src/components/DummyDataManager.jsx` yang menampilkan statistik data dummy dan tombol pembersihan massal sekali klik (DELETE ALL DUMMY DATA) dengan konfirmasi keamanan teks "HAPUS".
- Mengintegrasikan menu Dummy Data Manager pada sidebar admin grup sarana di `src/AdminDashboard.jsx` dan menyusun rendering halamannya secara responsif.
- Membuat skrip CLI pembersih `scripts/deleteDummyData.js` untuk menghapus seluruh dokumen dengan tag `isDummy === true` secara aman dari command line.
- Memperbaiki sinkronisasi nomor antrean pada kartu BoxPos TV (`src/TvDisplay.jsx`) agar memprioritaskan penampilan nomor antrean yang sedang aktif dipanggil (currentCall) di posisi paling atas antrean visual pos tersebut, lengkap dengan highlight warna merah rose dan animasi pulse yang menarik perhatian.

## Verifikasi Terakhir

- `npm run build` berhasil.
- Firebase hosting memakai output `dist`.
- Branch aktif: `main`.
- Remote GitHub: `https://github.com/maroamabbarakka/ckgmalimpung.git`.
