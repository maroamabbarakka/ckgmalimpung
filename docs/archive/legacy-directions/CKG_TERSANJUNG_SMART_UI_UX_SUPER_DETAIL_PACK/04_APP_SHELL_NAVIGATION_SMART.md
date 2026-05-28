# APP SHELL & NAVIGATION SMART

## TUJUAN
Navigasi harus membuat operator tahu:
- sedang di halaman apa
- pasien mana yang sedang diproses
- langkah berikutnya apa
- bagaimana kembali tanpa blank page

## DESKTOP LAYOUT

```txt
Sidebar kiri
Header atas
Content area
Optional right panel
```

Sidebar:
- Dashboard
- Loket
- Pos Pemeriksaan
- Rapor
- TV Display
- Laporan
- Admin

Header:
- nama halaman
- tanggal pelayanan aktif
- user aktif
- status online/offline
- logout

## MOBILE LAYOUT
Gunakan:
- top compact header
- bottom navigation untuk menu utama
- bottom action bar untuk aksi form

Mobile bottom nav maksimal 5 item:
- Dashboard
- Loket
- Antrean
- Pos
- Akun/Menu

## BACK BUTTON BEHAVIOR
Android back:
- jika modal terbuka → tutup modal
- jika form dirty → tampil konfirmasi
- jika di detail pasien → kembali ke daftar sebelumnya
- jangan menuju blank page

## ACCEPTANCE
- Reload halaman tidak blank.
- Back browser/mobile aman.
- User selalu tahu halaman aktif.