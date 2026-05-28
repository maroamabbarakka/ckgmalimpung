# Protokol Perubahan Schema Firestore

## Aturan
Jangan mengubah schema secara diam-diam.

Setiap perubahan schema wajib:
1. dicatat,
2. diberi migrasi,
3. punya fallback,
4. diuji dengan data lama.

## Template Catatan Schema
Buat file:
`docs/internal/SCHEMA_CHANGELOG.md`

Format:
```md
## YYYY-MM-DD — Nama Perubahan
Collection:
Field lama:
Field baru:
Alasan:
Backward compatibility:
Script migrasi:
Rollback:
```

## Protokol Migrasi
1. Tambahkan field baru tanpa menghapus field lama.
2. Update kode agar membaca field baru dan fallback ke lama.
3. Jalankan migrasi data.
4. Audit 10–20 sampel data.
5. Setelah stabil, baru rencanakan penghapusan field lama.

## Yang Tidak Boleh
- rename field langsung,
- delete collection langsung,
- mengubah tipe field tanpa migrasi,
- mengubah struktur nested object tanpa fallback.
