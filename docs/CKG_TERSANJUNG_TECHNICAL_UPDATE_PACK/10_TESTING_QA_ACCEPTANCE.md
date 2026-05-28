# 10 — Testing, QA, dan Acceptance Criteria

## Tujuan

Setiap update harus bisa diuji jelas. Jangan hanya "sudah diperbaiki" tanpa bukti.

## Command Wajib

Sebelum commit:

```bash
npm run lint
npm run build
npm run preview
```

Jika gagal:
- jangan lanjut deploy.
- catat error.
- perbaiki dulu.

---

## Smoke Test Harian

Checklist:

- [ ] Aplikasi bisa dibuka.
- [ ] Login berhasil.
- [ ] Logout berhasil.
- [ ] Loket bisa membuat antrean.
- [ ] Pos1 bisa membuka pasien.
- [ ] Pos1 bisa menyimpan data.
- [ ] Pos2 bisa melihat pasien dari Pos1.
- [ ] Pos7/rapor bisa dibuka.
- [ ] Dashboard bisa dibuka.
- [ ] TV Display bisa dibuka.
- [ ] Mobile tidak horizontal scroll.
- [ ] Build sukses.

---

## Test Role Access

Role `petugas`:
- [ ] Bisa Loket.
- [ ] Bisa Pos1.
- [ ] Tidak bisa Admin.
- [ ] Tidak bisa Pos6.

Role `ttlm`:
- [ ] Bisa Pos2.
- [ ] Tidak bisa Admin.
- [ ] Tidak bisa Pos6.

Role `dokter`:
- [ ] Bisa Pos3/4/5/6/7.
- [ ] Bisa dashboard.
- [ ] Tidak otomatis bisa SIMPEG kecuali admin.

Role `admin`:
- [ ] Bisa semua modul.
- [ ] Bisa SIMPEG.
- [ ] Bisa audit log.

---

## Test Workflow

1. Buat pasien baru.
2. Status harus `REGISTERED`.
3. Proses Pos1.
4. Status harus `POS1_COMPLETE`.
5. Pasien muncul di Pos2.
6. Pasien tidak muncul di Pos5.
7. Selesaikan semua pos.
8. Finalisasi.
9. Rapor final bisa dicetak.
10. Data masuk dashboard final.

---

## Test Duplicate NIK

- [ ] Input NIK 16 digit.
- [ ] Buat kunjungan.
- [ ] Coba input NIK sama di tahun yang sama.
- [ ] Sistem harus memberi warning.
- [ ] Tidak membuat kunjungan baru otomatis.

---

## Test Offline

1. Buka form pos.
2. Isi beberapa field.
3. Matikan internet.
4. Pastikan banner offline muncul.
5. Refresh browser.
6. Draft tetap ada.
7. Online kembali.
8. Simpan.
9. Data tersimpan.

---

## Test OCR

- [ ] KTP jelas.
- [ ] KTP buram.
- [ ] KK banyak anggota.
- [ ] BPJS/KIS/JKN.
- [ ] Dokumen tidak dikenal.
- [ ] Backend OCR mati.
- [ ] Fallback lokal berjalan.
- [ ] Confidence rendah menampilkan warning.

---

## Test Mobile

Ukuran:
- 360x740
- 390x844
- 414x896
- 768x1024

Checklist:
- [ ] Tidak horizontal scroll.
- [ ] Tombol minimal 44px.
- [ ] Bottom action bar terlihat.
- [ ] Header tidak memakan setengah layar.
- [ ] Form bisa dipakai satu tangan.
- [ ] Table berubah card/scroll aman.

---

## Test Dashboard

- [ ] Filter tanggal.
- [ ] Filter desa.
- [ ] Filter status.
- [ ] KPI berubah sesuai filter.
- [ ] Export mengikuti filter.
- [ ] Data belum final tidak masuk export final.
- [ ] NIK tidak tampil penuh.

---

## Test TV Display

- [ ] Buka fullscreen.
- [ ] Panggilan realtime.
- [ ] Tidak ada data sensitif.
- [ ] Suara panggilan tidak crash.
- [ ] Edukasi berganti otomatis.
- [ ] Offline state muncul.

---

## Regression Test

Setiap selesai update:
- [ ] Fitur lama tidak hilang.
- [ ] Nama route tidak berubah sembarangan.
- [ ] Collection Firestore tidak berubah tanpa migrasi.
- [ ] Export lama tetap bisa.
- [ ] Rapor lama tetap bisa dibuka.

---

## Format Laporan QA

Buat file setelah testing:

```txt
docs/QA_REPORT_YYYY-MM-DD.md
```

Template:

```md
# QA Report

Tanggal:
Branch:
Tester:
Build command:

## Hasil Command
- npm run lint:
- npm run build:
- npm run preview:

## Smoke Test
| Item | Status | Catatan |
|---|---|---|

## Bug Ditemukan
| Severity | Modul | Deskripsi | Cara Reproduksi | Status |
|---|---|---|---|---|

## Keputusan
- Layak deploy:
- Catatan:
```

## Definition of Done

- Ada checklist QA.
- Setiap PR besar punya QA report.
- Tidak deploy jika build gagal.

## Status Implementasi

Status: selesai teknis.

- QA report tersedia di `docs/QA_REPORT_2026-05-27.md`.
- Unit test dijalankan dengan `npm run test:run`.
- Lint dijalankan dengan `npm run lint`.
- Build produksi dijalankan dengan `npm run build`.
- Preview produksi diverifikasi dengan `npm run preview`.
- Smoke test Playwright publik `/tv` tersedia di `tests/e2e/public-tv.spec.cjs`.
- Bug QA ditemukan dan diperbaiki: route `/tv` sebelumnya masih masuk login; sekarang `/tv` dan `/display` publik sesuai kebutuhan display ruang tunggu.
