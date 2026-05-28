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

## Verifikasi Terakhir

- `npm run build` berhasil.
- Firebase hosting memakai output `dist`.
- Branch aktif: `main`.
- Remote GitHub: `https://github.com/maroamabbarakka/ckgmalimpung.git`.
