# 07 — Test Matrix dan Acceptance Criteria

## Aturan
Deploy ke production **DILARANG** jika test P0 gagal.

## A. Build & Static Check

```bash
npm run lint
npm run test:run
npm run build
```

Expected:
- tidak ada build error;
- tidak ada import error;
- tidak ada duplicate key baru;
- tidak ada lint error baru akibat patch.

## B. RBAC Matrix

| Skenario | Expected |
|---|---|
| Admin buka Kunjungan Rumah | PASS |
| Dokter buka Kunjungan Rumah | PASS |
| Perawat existing buka Kunjungan Rumah | PASS |
| DTD-only buka Kunjungan Rumah | PASS |
| DTD-only buka Pos1 | DENY |
| DTD-only buka Pos2 | DENY |
| DTD-only buka Pos7 | DENY |
| DTD-only buka Admin/SIMPEG | DENY |
| DTD-only buka route langsung via URL | tetap DENY jika tidak berhak |

## C. SIMPEG

- [ ] role DTD muncul.
- [ ] role DTD dapat dipilih.
- [ ] save berhasil.
- [ ] reopen modal tetap menunjukkan pilihan tersimpan.
- [ ] role existing pegawai tidak hilang saat menambah DTD.
- [ ] non-DTD staff tidak berubah.

## D. Kunjungan Rumah — Create
Gunakan akun uji DTD baru, jangan akun produksi Kepala Puskesmas.

- [ ] cari pasien existing berhasil.
- [ ] input pasien baru berhasil.
- [ ] duplicate/annual CKG validation tetap bekerja.
- [ ] seluruh step berjalan.
- [ ] submit berhasil.
- [ ] visit tercipta satu kali.
- [ ] patient tidak terduplikasi karena retry.
- [ ] activity log tercipta sesuai behavior existing.

## E. Provenance
Pada visit uji:

- [ ] `visit_source = door_to_door` jika field baru diterapkan.
- [ ] `created_by_uid` benar.
- [ ] `created_by_name` benar.
- [ ] role actor benar.
- [ ] `petugas_kunjungan_rumah` benar.
- [ ] `dokter_pemeriksa` tidak berisi nama operator non-dokter.

## F. Backward Compatibility
Ambil beberapa record lama sebelum patch:

- [ ] dapat dibuka.
- [ ] dapat ditampilkan di rapor jika sebelumnya bisa.
- [ ] export masih memuat kolom yang sama.
- [ ] dashboard tidak error saat membaca record tanpa `visit_source`.
- [ ] logic menganggap `jalur_pemeriksaan = Kunjungan Rumah` sebagai DTD legacy bila diperlukan.

## G. Pos 1–7 Regression
Minimal smoke test:

- [ ] Loket create visit.
- [ ] Pos1 read/update.
- [ ] Pos2 read/update.
- [ ] Pos3 read/update.
- [ ] Pos4 read/update.
- [ ] Pos5 read/update.
- [ ] Pos6 read/update.
- [ ] Pos7 complete.
- [ ] status queue bergerak seperti baseline.

## H. Export & Rapor

- [ ] export berhasil.
- [ ] header/kolom tidak berubah.
- [ ] jumlah record sesuai filter.
- [ ] Rapor Digital render tanpa error.
- [ ] record DTD baru tidak membuat formatter crash.

## I. Public Queue
Jika patch P1 `syncPublicQueue: false` diterapkan:

- [ ] visit DTD tidak membuat entry public queue yang tidak perlu.
- [ ] Loket/Pos normal tetap meng-update public queue.
- [ ] TV Display tetap berfungsi.

## J. Firestore Rules
Test emulator/controlled environment:

- [ ] DTD create DTD visit = ALLOW.
- [ ] DTD update DTD visit = ALLOW sesuai desain.
- [ ] DTD create non-DTD visit = DENY.
- [ ] DTD update non-DTD visit = DENY.
- [ ] DTD write users/staff = DENY.
- [ ] role existing tetap sesuai baseline.

## K. Mobile
Viewport:
- 390×844
- 360×800

- [ ] login usable.
- [ ] role UI tidak overflow.
- [ ] Kunjungan Rumah semua step usable.
- [ ] keyboard tidak menutup CTA secara permanen.
- [ ] tidak ada horizontal scroll.

## P0 Acceptance Criteria
Semua harus PASS:

1. Tidak ada data lama yang berubah otomatis.
2. Tidak ada migrasi massal.
3. Build production sukses.
4. DTD-only hanya dapat modul yang diperlukan.
5. Save DTD berhasil.
6. Non-dokter tidak tercatat sebagai dokter.
7. Pos 1–7 tidak regress.
8. Export/rapor tidak regress.
9. UI desktop/mobile tidak regress.
10. Rollback plan tersedia dan backup valid.
