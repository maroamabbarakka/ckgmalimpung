# SMART UI QA CHECKLIST

Status audit: baseline production sudah diverifikasi pada 2026-05-28.

## CEK GLOBAL
- [x] semua halaman punya judul jelas
- [x] tombol utama terlihat
- [x] loading state ada
- [x] empty state ada
- [x] error state ada
- [x] offline state ada
- [x] mobile tidak horizontal scroll

## CEK FORM
- [x] semua input punya label
- [x] field wajib diberi tanda
- [x] validasi inline
- [x] numeric keyboard untuk angka
- [x] autosave/draft status terlihat
- [x] submit tidak bisa dobel

## CEK POS
- [x] patient summary terlihat
- [x] stepper terlihat
- [x] field belum lengkap jelas
- [x] tombol lanjut konsisten
- [x] pasien terkunci jika sedang diedit

## CEK DASHBOARD
- [x] ringkasan utama terlihat
- [x] insight masalah tampil
- [x] filter mudah dipakai
- [x] chart tidak berat di mobile

## CEK TV DISPLAY
- [x] font terbaca jauh
- [x] fullscreen aman
- [x] tidak ada data sensitif
- [x] koneksi putus tidak blank

## CEK ACCESSIBILITY
- [x] kontras cukup
- [x] tombol minimal 44px mobile
- [x] modal bisa ditutup
- [x] focus state terlihat

## CATATAN VERIFIKASI
- Guard anti submit ganda diterapkan di Pos 1-7 dan Kunjungan Rumah.
- Kunjungan Rumah tidak bisa disimpan saat OCR masih berjalan.
- Playwright responsive dan TV display sudah lulus pada viewport mobile, tablet, dan TV.
