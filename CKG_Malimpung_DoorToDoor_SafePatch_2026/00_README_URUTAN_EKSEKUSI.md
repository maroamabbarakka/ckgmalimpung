# CKG Malimpung — Safe Patch Pack: Role Door to Door & Perbaikan Terkait

## Tujuan
Dokumen ini menjadi **arah kerja wajib** untuk menambahkan role **Petugas Door to Door** dan perbaikan terkait tanpa merusak aplikasi CKG Malimpung yang sudah berjalan.

Target utama:

1. Menambahkan role `door_to_door` secara **additive-only**.
2. Menghentikan ketergantungan petugas Door to Door pada akun Kepala Puskesmas.
3. Menjaga seluruh data lama tetap dapat dibaca, diedit, diekspor, dan ditampilkan.
4. Memastikan alur Loket, Pos 1–7, Rapor, Dashboard, Export, TV antrean, dan SIMPEG yang sudah berjalan **tidak berubah perilakunya**.
5. Memastikan UI/UX existing tidak rusak pada desktop maupun mobile.
6. Menyediakan backup dan rollback yang mudah dipanggil kembali.

## Prinsip yang Tidak Boleh Dilanggar

- **NO DATA BREAK**.
- **STABILIZATION FIRST**.
- **SMALL PATCH ONLY**.
- **1 patch = 1 tujuan utama**.
- **Backward compatible** terhadap data lama.
- **Tidak ada migrasi massal data lama** untuk pekerjaan ini.
- **Tidak ada rename collection**.
- **Tidak ada rename field existing**.
- **Tidak ada perubahan `src/formSchemas.json`**.
- **Tidak ada perubahan struktur export resmi**.
- **Tidak ada redesign total**.
- **Tidak ada refactor massal file besar** bersamaan dengan patch role Door to Door.

## Repo Target

- Repository: `maroamabbarakka/ckgmalimpung`
- Default branch: `main`
- Patch **DILARANG** dikerjakan langsung di `main`.

## Urutan Eksekusi Wajib

### Gate 0 — Freeze & Baseline
Baca:
- `01_BASELINE_FREEZE_DAN_SCOPE.md`
- `11_DO_NOT_TOUCH_LIST.md`

Hasil wajib:
- commit baseline tercatat;
- screenshot baseline UI tersedia;
- daftar koleksi dan jumlah dokumen baseline dicatat;
- build baseline lolos.

### Gate 1 — Backup
Baca:
- `02_BACKUP_DATA_SOURCE_DAN_RECOVERY.md`

Hasil wajib:
- backup source code berhasil;
- backup Firestore berhasil;
- checksum/manifest backup tersimpan;
- restore drill minimal pada salinan/lingkungan aman terverifikasi.

### Gate 2 — Tambah Role Door to Door
Baca:
- `03_ROLE_DOOR_TO_DOOR_RBAC.md`

Hasil wajib:
- role baru muncul di SIMPEG;
- user role DTD hanya memiliki akses modul Kunjungan Rumah sesuai matrix;
- role existing tidak berubah.

### Gate 3 — Data Provenance & Semantik Klinis
Baca:
- `04_DATA_PROVENANCE_DAN_DOKTER_PEMERIKSA.md`

Hasil wajib:
- operator aktual tercatat;
- petugas non-dokter tidak dicatat sebagai `dokter_pemeriksa`;
- field existing tetap kompatibel.

### Gate 4 — Firestore Rules
Baca:
- `05_FIRESTORE_RULES_LEAST_PRIVILEGE.md`

Hasil wajib:
- DTD dapat melakukan operasi yang diperlukan;
- DTD tidak dapat menulis kunjungan non-DTD;
- admin/dokter/perawat/role lain tidak kehilangan akses existing.

### Gate 5 — UI/UX Safety
Baca:
- `06_UI_UX_REGRESSION_SAFETY.md`

Hasil wajib:
- tampilan baseline tidak bergeser/rusak;
- modal SIMPEG tetap proporsional;
- mobile navigation tetap usable;
- role DTD mendapat alur yang sederhana tanpa merombak shell aplikasi.

### Gate 6 — Test & Acceptance
Baca:
- `07_TEST_MATRIX_DAN_ACCEPTANCE_CRITERIA.md`

Deploy dilarang jika ada satu saja test P0 gagal.

### Gate 7 — Deploy Bertahap
Baca:
- `08_DEPLOYMENT_BERTAHAP_DAN_ROLLBACK.md`

Gunakan akun uji DTD lebih dahulu. Jangan langsung mengganti seluruh akun operasional.

### Gate 8 — Monitoring
Baca:
- `09_POST_DEPLOY_MONITORING.md`

Pantau error permission, gagal save, duplikasi CKG, kesalahan nama petugas, UI overflow, dan perbedaan output laporan.

## Patch yang Dikerjakan Sekarang

### P0 — Wajib dalam patch inti
- role `door_to_door`;
- pilihan role di SIMPEG;
- route/module access khusus Kunjungan Rumah;
- Firestore write permission yang terbatas;
- metadata operator Door to Door;
- koreksi `dokter_pemeriksa`;
- regression tests minimum;
- backup/rollback.

### P1 — Boleh dilakukan setelah P0 stabil, sebaiknya commit terpisah
- `visit_source: 'door_to_door'` untuk data baru;
- mematikan sinkronisasi `public_queue` untuk visit DTD yang langsung selesai;
- membawa `permissions` ke session user jika dibutuhkan;
- redirect user DTD-only ke Kunjungan Rumah;
- test Firestore Rules lebih lengkap.

### P2 — DITUNDA, jangan digabung patch ini
- refactor besar `KunjunganRumah.jsx`;
- refactor besar `AdminDashboard.jsx`;
- perubahan global model RBAC;
- perubahan schema FormSchemas;
- perubahan format export;
- perubahan global read-policy `visits` tanpa desain registry CKG tahunan;
- redesign dashboard atau shell aplikasi.

## Definition of Done
Patch dianggap selesai hanya jika:

- data lama tidak berubah;
- data baru kompatibel dengan laporan lama;
- role existing menghasilkan perilaku yang sama seperti baseline;
- akun DTD dapat bekerja tanpa akun Kepala Puskesmas;
- petugas non-dokter tidak pernah otomatis tercatat sebagai dokter;
- semua test P0 lolos;
- build production lolos;
- screenshot comparison UI lolos;
- rollback dapat dilakukan dengan prosedur yang terdokumentasi.
