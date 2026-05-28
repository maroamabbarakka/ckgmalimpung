# 27 — PWA, Mobile Back Button, dan Install App

## Target
Aplikasi web terasa seperti aplikasi HP, bukan halaman web biasa.

## Masalah yang perlu diatasi
- Tombol back HP bisa keluar ke halaman kosong.
- User tidak tahu aplikasi bisa dipasang.
- Mobile header/footer belum selalu ramah sentuh.

## Back button behavior
Gunakan routing history yang jelas.

Aturan:
- dari detail pasien kembali ke list pasien;
- dari pos detail kembali ke antrean pos;
- dari dashboard jika back ditekan, tampilkan konfirmasi keluar;
- jangan arahkan ke blank page.

## Implementasi helper
File:
```txt
src/hooks/useMobileBackNavigation.js
```

Fungsi:
```js
useMobileBackNavigation({ fallbackPath, confirmExit })
```

## Install app prompt
Komponen:
```txt
src/components/pwa/InstallAppButton.jsx
src/components/pwa/InstallAppBanner.jsx
```

Behavior:
- tampil di mobile jika belum installed;
- jangan muncul terus-menerus;
- simpan dismissed timestamp;
- tampilkan panduan singkat install Chrome.

## Mobile safe area
Tambahkan class global:
```css
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Bottom action bar wajib pakai safe area.

## Acceptance criteria
- Tombol back HP tidak membawa ke halaman kosong.
- Install button muncul di browser mobile yang support.
- Bottom action tidak tertutup navigation bar HP.
- PWA tetap build dan manifest valid.
