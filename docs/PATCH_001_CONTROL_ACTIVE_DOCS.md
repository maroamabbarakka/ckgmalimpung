# PATCH_001 — Control Active Docs

## Tujuan
Menghentikan bias dari arahan lama dan menjadikan repo aktif sebagai satu-satunya sumber kerja.

## Dilarang
- Mengubah src/formSchemas.json
- Mengubah Pos1–Pos7
- Mengubah Firestore
- Mengubah export
- Menjalankan script lama
- Redesign UI

## Tindakan
1. Jangan hapus dokumen lama.
2. Tandai semua TECHNICAL_UPDATE_PACK, ARAHAN_*, STATUS_ARAHAN_*, dan SMART_UI_UX sebagai arsip/non-aktif.
3. Buat README ringkas di docs/ yang menjelaskan:
   - dokumen lama hanya referensi historis
   - instruksi aktif hanya PATCH_001 dan dokumen stabilisasi
4. Catat struktur aktif repo:
   - src/Pos1.jsx sampai src/Pos7.jsx
   - src/DynamicFormRenderer.jsx
   - src/formSchemas.json
   - public/Laporan_Tersanjung_Final.html
   - firestore.rules
   - tests/e2e

## Output
Tidak ada perubahan fitur.
Tidak ada perubahan UI.
Tidak ada perubahan schema.
Tidak ada perubahan data.
