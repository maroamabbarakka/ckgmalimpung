# PATCH_002 — Schema & Data Output Audit

## Tujuan
Memastikan schema aktif, output laporan, dan alur data belum rusak sebelum perbaikan fitur/UI dilakukan.

## Status
AUDIT ONLY. Tidak boleh mengubah kode produksi.

## Dilarang
- mengubah `src/formSchemas.json`
- mengubah komponen Pos1–Pos7
- mengubah `DynamicFormRenderer`
- mengubah struktur Firestore
- mengubah export
- menjalankan script `fix_*`, `restore_*`, `update_*`, `inject_*`, atau `migrate_*`
- redesign UI

## Sumber Kebenaran
1. `src/formSchemas.json`
2. `public/Laporan_Tersanjung_Final.html`
3. `firestore.rules`
4. kode aktif di `src`
5. test aktif di `tests/e2e`

## Perintah Audit Dasar
Jalankan:

```bash
npm install
npm run lint
npm run build
npm run test:run
npm run test:e2e
