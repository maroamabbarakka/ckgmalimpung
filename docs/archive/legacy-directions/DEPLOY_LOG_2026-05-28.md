# Deploy Log

Tanggal lokal: 2026-05-28
Project Firebase: `ckg-malimpung`
Target: `firestore:rules, hosting`
Hosting URL: `https://ckg-malimpung.web.app`

## Verifikasi Sebelum Deploy

| Command | Status |
|---|---|
| `npm run lint` | Sukses |
| `npm run test:run` | Sukses, 11 file dan 36 test passed |
| `npm run build` | Sukses |

## Hasil Deploy

- Firestore rules berhasil compile dan release ke `cloud.firestore`.
- Hosting menemukan 58 file di `dist`.
- Hosting version `projects/695466415592/sites/ckg-malimpung/versions/e0a0bb09b1723637` berhasil finalized.
- Live release berhasil.

## Redeploy Hosting

- Setelah update Dashboard Decision dan OCR Smart Intake, verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/41c3849a644906e1`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Hosting OCR Review

- Setelah penambahan review manual OCR `Gunakan Data Ini`, verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/a81e4a69bc605365`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Hosting TV Display

- Setelah update TV Display untuk panel edukasi dan antrean berikutnya, verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/7400e099b52c6d64`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Hosting QA Public TV

- Setelah QA menemukan `/tv` masih membutuhkan login, route `/tv` dan `/display` dibuat publik.
- Verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
  - `npm run preview` + `npx playwright test tests/e2e/public-tv.spec.cjs` (3 passed)
- Hosting redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/5ff437ef1ac259fd`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Hosting Monitoring Runbook

- Setelah update deployment/monitoring/backup dan audit log ErrorBoundary, verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/e2a992b21ad2414e`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Deploy Staging Preview

- Firebase Hosting preview channel `staging` dibuat sebagai staging praktis karena project staging terpisah belum tersedia.
- Channel URL: `https://ckg-malimpung--staging-avwxiwrl.web.app`.
- Expires: 2026-06-04 02:00:26 WITA.
- Hosting version staging: `projects/695466415592/sites/ckg-malimpung/versions/f6f0c5e937ace7ac`.
- QA staging sukses:
  - HTTP status root staging: 200.
  - `E2E_BASE_URL=https://ckg-malimpung--staging-avwxiwrl.web.app npx playwright test tests/e2e/public-tv.spec.cjs` (3 passed).

## Redeploy Hosting Visual QA TV

- Setelah uji visual mandiri, koreksi dilakukan pada TV display:
  - Layout 1024x768 dibuat lebih terbaca dengan panel edukasi dan antrean tersusun vertikal.
  - Video edukasi disembunyikan pada viewport di bawah `xl` agar antrean berikutnya tidak terpotong.
  - Footer `<marquee>` diganti ticker CSS.
  - Empty state pos dibuat lebih netral.
- Verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
  - `E2E_BASE_URL=http://127.0.0.1:5175 npx playwright test tests/e2e/public-tv.spec.cjs` (3 passed)
  - `E2E_BASE_URL=https://ckg-malimpung.web.app npx playwright test tests/e2e/public-tv.spec.cjs` (3 passed)
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/6df18d2a508eec7d`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Staging Preview Visual QA TV

- Staging preview disinkronkan ulang setelah koreksi visual.
- Channel URL: `https://ckg-malimpung--staging-avwxiwrl.web.app`.
- Expires: 2026-06-04 02:10:02 WITA.
- Hosting version staging: `projects/695466415592/sites/ckg-malimpung/versions/4c1835eeb4c110e2`.
- QA staging sukses:
  - HTTP status root staging: 200.
  - `E2E_BASE_URL=https://ckg-malimpung--staging-avwxiwrl.web.app npx playwright test tests/e2e/public-tv.spec.cjs` (3 passed).

## Catatan

- Warning build yang tersisa hanya ukuran chunk Vite.
- Working tree belum dibuat commit pada deploy ini.

## Deploy Rules + Hosting Hardening Route/Auth

- Eksekusi lanjutan paket Smart UI/UX dan Technical Update:
  - Route tidak dikenal kini menampilkan halaman 404, bukan redirect diam-diam ke dashboard.
  - Auth frontend membaca role dari Firebase Auth custom claims jika tersedia, dengan fallback profil `users`.
  - Firestore Rules mendukung role dari custom claims atau dokumen `users`.
  - Query/mutasi Dashboard operator dipindahkan ke service layer.
- Verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
  - `E2E_BASE_URL=http://127.0.0.1:5177 npx playwright test tests/e2e/login.spec.cjs` (3 passed)
- Firestore Rules compile dan release sukses.
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/169be1571f690016`.
- Live URL tetap `https://ckg-malimpung.web.app` dan HTTP status root `200`.

## Redeploy Hosting Admin Service Extraction

- Eksekusi lanjutan Tahap 6 patch sequence:
  - `AdminDashboard.jsx` tidak lagi mengimpor Firestore langsung.
  - Operasi subscribe, CRUD sekolah/staff, backup, cleanup duplikat, dan reset PIN dipindahkan ke `src/services/adminService.js`.
- Verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
  - `E2E_BASE_URL=http://127.0.0.1:5178 npx playwright test tests/e2e/login.spec.cjs` (3 passed)
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/11f19b2393a6ee12`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Hosting Queue Service Cleanup

- Eksekusi lanjutan refactor struktur kode:
  - `hooks/useQueue.js` memakai `subscribeQueueByStatus` dari service layer.
  - `KunjunganRumah.jsx` tidak lagi mengimpor `db` langsung untuk validasi duplikat CKG.
  - Validasi kunjungan tahun berjalan dipusatkan lewat `services/patientService.js`.
- Verifikasi ulang sukses:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/b3458e5069f89195`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Hosting Smart UI/UX Focus Pass

- Eksekusi fokus paket `CKG_TERSANJUNG_SMART_UI_UX_SUPER_DETAIL_PACK`:
  - Token dan global style Smart UI/UX ditambahkan.
  - Mobile bottom navigation dipadatkan menjadi maksimal 5 item.
  - Focus state, target sentuh 44px, dan input mobile 16px distandarkan.
  - Beranda tidak lagi menampilkan section alur pos kosong saat belum login.
  - Workflow stepper dan panel kesiapan ditambahkan pada header pasien aktif Pos.
- Verifikasi ulang:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
  - Visual Playwright mobile 390px tanpa horizontal overflow.
- Hosting production redeploy sebelumnya sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/828862832032fd7b`.
- Hosting production redeploy Sprint 4 sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/3b04f768b47ad847`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Hosting Smart Form Pos 1

- Eksekusi Sprint UI/UX 3 dari paket `CKG_TERSANJUNG_SMART_UI_UX_SUPER_DETAIL_PACK`:
  - Pos 1 memakai input mode numerik untuk NIK, HP, dan tanggal mask.
  - NIK/HP otomatis dibersihkan menjadi angka.
  - Error inline ditampilkan dekat field NIK dan tanggal lahir.
  - Checklist kesiapan tampil sebelum tombol lanjut ke Pos 2.
- Verifikasi ulang:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/d89c4fd64a4d7699`.
- Live URL tetap `https://ckg-malimpung.web.app`.

## Redeploy Hosting Smart Form Dinamis Pos 2-6

- Eksekusi lanjutan Sprint UI/UX 3 dari paket `CKG_TERSANJUNG_SMART_UI_UX_SUPER_DETAIL_PACK`:
  - `DynamicFormRenderer` memakai SmartNumberInput untuk form dinamis.
  - Input angka klinis disanitasi agar huruf/notasi tidak tersimpan.
  - Keyboard mobile dibedakan untuk angka bulat dan desimal.
  - Hint serta peringatan nilai ekstrem tampil dekat field.
- Verifikasi ulang:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/7998fd8274435863`.
- Live URL tetap `https://ckg-malimpung.web.app` dan HTTP status root `200`.

## Redeploy Hosting Pos Workflow Action Bar

- Eksekusi Sprint UI/UX 4 dari paket `CKG_TERSANJUNG_SMART_UI_UX_SUPER_DETAIL_PACK`:
  - Pos 2-7 memakai komponen `PosBottomActionBar`.
  - Sticky bottom action bar distandarkan pada mobile dan desktop.
  - Label aksi diseragamkan: `Kembali ke Pos X`, `Simpan & Lanjut Pos X`, dan `Tandai Selesai`.
- Verifikasi ulang:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/bf5bb01e9d894f31`.
- QA production setelah deploy:
  - `E2E_BASE_URL=https://ckg-malimpung.web.app npx playwright test responsive.spec.cjs public-tv.spec.cjs` (13 passed).
  - Live URL `https://ckg-malimpung.web.app` HTTP status root `200`.

## Redeploy Hosting Dashboard Smart Insight

- Eksekusi polish lanjutan Sprint UI/UX 5 dari paket `CKG_TERSANJUNG_SMART_UI_UX_SUPER_DETAIL_PACK`:
  - Dashboard operator menampilkan panel `Yang perlu diperhatikan hari ini`.
  - Insight merangkum pasien belum final, bottleneck pos, masalah data, dan risiko dominan.
  - Panel tidak menampilkan identitas atau data medis sensitif per pasien.
- Verifikasi ulang:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/b9accd7559b1fc48`.
- Live URL tetap `https://ckg-malimpung.web.app` dan HTTP status root `200`.

## Redeploy Hosting TV Display Resilience

- Eksekusi polish lanjutan Sprint UI/UX 5-6 dari paket `CKG_TERSANJUNG_SMART_UI_UX_SUPER_DETAIL_PACK`:
  - TV display publik menampilkan jumlah antrean aktif.
  - TV display publik menampilkan waktu sinkron terakhir.
  - TV display publik menampilkan fallback saat koneksi data antrean tidak stabil.
  - Fallback tidak menampilkan identitas pasien, NIK, nomor HP, alamat, atau data medis.
- Verifikasi ulang:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/30728441d242986f`.
- Live URL tetap `https://ckg-malimpung.web.app` dan HTTP status root `200`.

## Redeploy Hosting Smart UI QA Final Guard

- Eksekusi finalisasi paket `CKG_TERSANJUNG_SMART_UI_UX_SUPER_DETAIL_PACK`:
  - Guard anti submit ganda diterapkan pada Pos 1-7.
  - Guard anti submit ganda diterapkan pada Kunjungan Rumah.
  - Tombol simpan Kunjungan Rumah terkunci saat OCR masih berjalan.
  - Checklist Smart UI QA baseline production ditandai selesai.
- Verifikasi ulang:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
  - `E2E_BASE_URL=https://ckg-malimpung.web.app npx playwright test responsive.spec.cjs public-tv.spec.cjs` (13 passed)
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/25aabd41631f8098`.
- Live URL tetap `https://ckg-malimpung.web.app` dan HTTP status root `200`.

## Redeploy Hosting dan Rules TV Public Queue Projection

- Eksekusi hardening TV display publik:
  - TV display membaca antrean dari proyeksi aman `public_queue`, bukan langsung dari `visits`.
  - `public_queue` hanya berisi nomor antrean, status pos, dan timestamp.
  - `panggilan_tv` dibuka untuk read publik karena hanya berisi data panggilan antrean.
  - `pengaturan/lokasi_aktif` dibuka read publik agar layar TV bisa menampilkan lokasi tanpa login.
  - Sinkronisasi proyeksi publik dibuat non-blocking agar alur simpan `visits` tidak terganggu.
- Verifikasi ulang:
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
  - `E2E_BASE_URL=https://ckg-malimpung.web.app npx playwright test public-tv.spec.cjs` (3 passed)
  - Console smoke `/tv`: `NO_PERMISSION_ERRORS`
- Firestore Rules production released dengan ruleset `projects/ckg-malimpung/rulesets/0c946f11-b733-4a25-91ec-19f1aa096e52`.
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/02d006e280764b6c`.
- Live URL tetap `https://ckg-malimpung.web.app` dan HTTP status root `200`.

## Redeploy Hosting Public Queue Merge Guard

- Eksekusi lanjutan hardening `public_queue`:
  - Update status antrean publik tidak lagi menimpa `nomor_antrian` saat payload status dari Pos tidak membawa nomor antrean.
  - Skrip `scripts/backfillPublicQueue.js` ditambahkan untuk backfill antrean lama dari `visits` ke `public_queue`.
  - Script tersedia lewat `npm run migrate:public-queue`; default dry-run dan menulis hanya jika memakai `--commit`.
- Verifikasi ulang:
  - `node --check scripts/backfillPublicQueue.js`
  - `npm run lint`
  - `npm run test:run` (11 file dan 37 test passed)
  - `npm run build`
  - `E2E_BASE_URL=https://ckg-malimpung.web.app npx playwright test public-tv.spec.cjs` (3 passed)
  - Console smoke `/tv`: `NO_PERMISSION_ERRORS`
- Dry-run backfill belum dijalankan penuh karena kredensial admin migrasi belum tersedia di environment proses; skrip berhenti tanpa menulis data.
- Hosting production redeploy sukses dengan version `projects/695466415592/sites/ckg-malimpung/versions/94aeb3202cdd9c8c`.
- Live URL tetap `https://ckg-malimpung.web.app` dan HTTP status root `200`.
