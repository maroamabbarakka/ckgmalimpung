# Status Technical Update Pack

Tanggal: 2026-05-27

## Ringkasan

Paket `CKG_TERSANJUNG_TECHNICAL_UPDATE_PACK` dieksekusi sebagai stabilisasi bertahap, bukan rewrite total.

## Selesai Pada Batch Ini

- Role config terpusat tersedia di `src/features/auth/roles.js`.
- Wrapper protected route tersedia di `src/features/auth/ProtectedRoute.jsx`.
- Navigation config awal tersedia di `src/app/navigation.js`.
- UI shared minimal tersedia di `src/components/ui`.
- Workflow status, guards, required fields, dan service tersedia di `src/features/workflow`.
- Tiket Loket baru mendapat `status: REGISTERED`.
- Pos 1 menulis `status: POS1_COMPLETE` saat lanjut Pos 2.
- Pos 2 menulis `status: POS2_COMPLETE` saat lanjut Pos 3.
- Pos 3 sampai Pos 6 menulis `status: POS3_COMPLETE` sampai `POS6_COMPLETE` saat lanjut pos berikutnya.
- Pos 7 menulis `status: FINALIZED` saat pemeriksaan selesai.
- Pos 1 sampai Pos 7 menulis status `*_IN_PROGRESS` saat pasien diklaim/dipanggil.
- Klaim pasien sekarang menulis lock 10 menit (`lock`, `lockedBy`, `lockedModule`) dan mencegah takeover non-admin saat lock aktif.
- Lock otomatis dibersihkan saat visit dilepas melalui `petugas_aktif: null`.
- Rapor Digital mengunci cetak/unduh resmi bila kunjungan belum final.
- Draft storage dan hook autosave tersedia.
- Pos 2 memakai autosave draft lokal dan menawarkan pemulihan draft saat pasien dibuka.
- Halaman pemulihan draft tersedia di `/recovery`.
- AppShell menampilkan banner pemulihan saat ada draft lokal di perangkat.
- `draftStorage` mendukung hapus draft by key dan listing berbasis Storage API.
- Dashboard service untuk metrics, bottleneck, filter, dan data quality tersedia beserta unit test.
- Dashboard menampilkan widget kualitas data dan bottleneck antrian berbasis data terfilter.
- OCR pipeline standar tersedia dengan normalization, confidence, dan warnings.
- Pos 1 dan Kunjungan Rumah memakai OCR pipeline standar, KK candidate picker tetap wajib pilih anggota, dan metadata OCR disimpan saat hasil dipakai.
- Review hasil OCR tersedia; hasil identitas tunggal wajib dikonfirmasi dengan tombol `Gunakan Data Ini` sebelum mengisi form.
- Kunjungan Rumah menampilkan warning duplikasi CKG saat NIK 16 digit terdeteksi.
- TV helper/component tersedia, serta TV runtime punya tombol fullscreen, status online/offline, panel edukasi, dan antrean berikutnya.
- Route `/tv` dan `/display` dibuat publik untuk kebutuhan layar ruang tunggu, serta diuji Playwright pada viewport TV/tablet.
- `.env.example` dikosongkan menjadi template aman.
- Version file tersedia dan tampil di halaman Tentang.
- Dokumen QA, deployment checklist, rollback, incident template, dan Firestore indexes tersedia.
- Runbook monitoring dan backup/restore tersedia untuk deploy production `ckg-malimpung`.
- ErrorBoundary mencatat error global tersanitasi ke audit log tanpa menyimpan data medis sensitif.
- Firebase Hosting preview channel `staging` tersedia untuk QA staging sementara.
- Laporan final paket tersedia di `docs/FINAL_TECHNICAL_UPDATE_PACK_REPORT.md`.
- Visual QA mandiri tersedia di `docs/VISUAL_QA_REPORT_2026-05-28.md`; TV display viewport 1024x768 sudah dikoreksi agar panel edukasi dan antrean tidak terpotong.
- Login memiliki rate-limit frontend transisi: jeda 2 detik setelah gagal dan cooldown 60 detik setelah 5 kali gagal.
- Role dari profil Firebase dinormalisasi menjadi lower-case agar RBAC tidak gagal karena kapital/spasi.
- Firestore Rules menambahkan guard untuk `auditLogs` dan collection publik aman `public_queue`.
- TV display publik membaca antrean dari `public_queue`, bukan langsung dari `visits`, agar data pasien tetap terlindungi oleh rules.
- Skrip `scripts/backfillPublicQueue.js` tersedia untuk mengisi `public_queue` dari data antrean lama secara dry-run/commit.
- `App.jsx` mulai memakai config navigation terpusat untuk kartu pos dan mobile nav.
- Helper Firebase `timestamp.js` dan `queryHelpers.js` tersedia untuk refactor service bertahap.
- Komponen UI shared `Modal` dan `Table` tersedia di `src/components/ui`.
- `Table` shared mendukung sticky header, empty/loading state, dan mobile card fallback.
- Komponen `MobileQueueDrawer` tersedia untuk antrean mobile pos.
- Pos 2 memakai tombol `Lihat Antrean` dan bottom sheet antrean pada mobile saat pasien aktif.

## Tetap Dijaga

- Tidak menghapus fitur lama.
- Tidak mengganti nama collection Firestore.
- `status_antrian` lama tetap dipakai agar alur produksi tidak putus.
- Workflow `status` baru ditambahkan secara kompatibel.

## Verifikasi Wajib

```bash
npm run lint
npm run test:run
npm run build
```

Status terakhir: semua sukses, 11 file test dan 37 test passed.

Tambahan QA otomatis: Playwright public TV smoke sukses pada 3 viewport (1366x768, 1920x1080, 1024x768).

Monitoring operasional: cek `docs/MONITORING_RUNBOOK.md` dan `docs/BACKUP_RESTORE_PLAN.md` sebelum deploy produksi berikutnya.

Staging terakhir: `https://ckg-malimpung--staging-avwxiwrl.web.app`, public TV smoke 3 viewport passed.

Visual QA terakhir: `/login` dan `/tv` diuji pada mobile, desktop, HD TV, Full HD TV, dan tablet landscape.

Production terbaru setelah koreksi visual: `projects/695466415592/sites/ckg-malimpung/versions/6df18d2a508eec7d`.
Staging terbaru setelah koreksi visual: `projects/695466415592/sites/ckg-malimpung/versions/4c1835eeb4c110e2`.

## Catatan Lanjutan

- Autosave draft dapat diperluas ke Pos 1 dan Pos 3-7 dengan pola Pos 2.
- Warning ukuran chunk Vite masih perlu code splitting lanjutan.
