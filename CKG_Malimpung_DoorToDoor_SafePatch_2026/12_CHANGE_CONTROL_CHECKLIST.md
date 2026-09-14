# 12 — Change Control Checklist

## Sebelum Coding
- [ ] branch khusus dibuat.
- [ ] SHA baseline dicatat.
- [ ] source backup dibuat.
- [ ] Firestore backup dibuat.
- [ ] manifest count dibuat.
- [ ] screenshot baseline dibuat.
- [ ] `npm run build` baseline diverifikasi.

## Saat Coding
- [ ] hanya file scope yang disentuh.
- [ ] tidak ada perubahan schema.
- [ ] tidak ada rename collection/field.
- [ ] tidak ada migrasi massal.
- [ ] role existing tidak dihapus.
- [ ] DTD hanya masuk module Kunjungan Rumah.
- [ ] provenance additive diterapkan.
- [ ] `dokter_pemeriksa` aman untuk non-dokter.
- [ ] Firestore Rules least privilege.
- [ ] UI style existing dipertahankan.

## Sebelum Merge
- [ ] review diff file per file.
- [ ] tidak ada file besar berubah akibat formatter massal.
- [ ] lint pass.
- [ ] unit test pass.
- [ ] build pass.
- [ ] RBAC tests pass.
- [ ] rules tests pass.
- [ ] Pos1–Pos7 smoke test pass.
- [ ] export pass.
- [ ] rapor pass.
- [ ] mobile pass.
- [ ] screenshot comparison pass.

## Sebelum Deploy
- [ ] backup masih dapat diakses.
- [ ] baseline rules tersedia.
- [ ] rollback commit/tag tersedia.
- [ ] akun pilot tersedia.
- [ ] window deployment disepakati.

## Setelah Deploy
- [ ] login DTD sukses.
- [ ] create visit DTD sukses.
- [ ] provenance benar.
- [ ] non-dokter bukan dokter_pemeriksa.
- [ ] tidak ada permission error abnormal.
- [ ] Pos normal tetap berjalan.
- [ ] export/rapor tetap berjalan.
- [ ] UI desktop/mobile normal.
- [ ] audit actor benar.

## Jika Gagal
- [ ] hentikan rollout.
- [ ] revert source/rules ke baseline.
- [ ] verifikasi sistem pulih.
- [ ] restore data hanya jika terbukti perlu.
- [ ] dokumentasikan incident sebelum percobaan patch ulang.
