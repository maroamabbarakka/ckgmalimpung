# Visual QA Report

Tanggal: 2026-05-28  
Lingkup: uji mandiri visual halaman publik tanpa kredensial produksi.

## Halaman Diuji

| Halaman | Viewport | Hasil |
|---|---|---|
| `/login` | 390x844 | Rapi, tidak overflow, form terbaca |
| `/login` | 1366x768 | Rapi, panel kiri/kanan proporsional |
| `/tv` splash | 1366x768 | Rapi, tombol aktivasi jelas |
| `/tv` aktif | 1366x768 | Rapi, tidak overflow |
| `/tv` aktif | 1920x1080 | Rapi, tidak overflow |
| `/tv` aktif | 1024x768 | Setelah koreksi, edukasi dan antrean berikutnya terbaca utuh |

## Temuan

| Severity | Temuan | Koreksi |
|---|---|---|
| P1 | Pada `/tv` viewport 1024x768, panel edukasi terlalu sempit dan kartu antrean berikutnya terpotong. | Layout TV menengah diubah: video disembunyikan pada viewport di bawah `xl`, panel edukasi dan antrean disusun vertikal penuh. |
| P2 | Footer TV memakai `<marquee>` dan saat screenshot awal hanya tampak fragmen teks di sisi kanan. | Diganti ticker CSS dengan teks duplikat yang stabil. |
| P2 | Empty state pos memakai ikon dekoratif yang kurang jelas. | Diganti indikator lingkaran sederhana agar lebih netral dan konsisten. |
| P2 | Beberapa dekorasi teks TV terlalu ramai untuk display operasional. | Teks tombol aktivasi dan status menunggu dibuat lebih bersih. |

## Verifikasi Setelah Koreksi

| Command | Status |
|---|---|
| `npm run lint` | Sukses |
| `npm run test:run` | Sukses, 11 file dan 37 test passed |
| `npm run build` | Sukses |
| `E2E_BASE_URL=http://127.0.0.1:5175 npx playwright test tests/e2e/public-tv.spec.cjs` | Sukses, 3 passed |
| `E2E_BASE_URL=https://ckg-malimpung.web.app npx playwright test tests/e2e/public-tv.spec.cjs` | Sukses, 3 passed |
| `E2E_BASE_URL=https://ckg-malimpung--staging-avwxiwrl.web.app npx playwright test tests/e2e/public-tv.spec.cjs` | Sukses, 3 passed |

Catatan build: warning chunk besar Vite masih ada dan sudah dicatat sebagai risiko performa lanjutan.

## Deploy Setelah Koreksi

| Target | URL | Version |
|---|---|---|
| Production | `https://ckg-malimpung.web.app` | `projects/695466415592/sites/ckg-malimpung/versions/6df18d2a508eec7d` |
| Staging preview | `https://ckg-malimpung--staging-avwxiwrl.web.app` | `projects/695466415592/sites/ckg-malimpung/versions/4c1835eeb4c110e2` |
