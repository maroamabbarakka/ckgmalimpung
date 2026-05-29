# FORMSCHEMAS.md

## Tujuan
Dokumen referensi seluruh schema form CKG.

### Prinsip
- Schema-driven UI
- Tidak hardcode pertanyaan di komponen
- Semua pertanyaan berasal dari formSchemas.json

## Struktur Dasar

```json
{
  "id":"question_id",
  "label":"Pertanyaan",
  "type":"text|number|select|radio|checkbox",
  "required":true
}
```

## Kategori
- Anak
- Remaja
- Dewasa
- Lansia

## Pos
- Pos1 Registrasi
- Pos2 Pemeriksaan Dasar
- Pos3 Laboratorium
- Pos4 Skrining Risiko
- Pos5 Pemeriksaan Lanjutan
- Pos6 Evaluasi
- Pos7 Tindak Lanjut

## Aturan
- ID pertanyaan tidak boleh berubah setelah produksi.
- Gunakan versioning schema.
- Semua perubahan harus backward compatible.
