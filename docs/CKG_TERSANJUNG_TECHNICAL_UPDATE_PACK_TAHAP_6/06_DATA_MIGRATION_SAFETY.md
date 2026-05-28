# DATA MIGRATION SAFETY

## SEBELUM MIGRASI

- export seluruh collection
- catat jumlah dokumen
- catat sample dokumen
- buat branch migration

## MIGRATION SCRIPT WAJIB

Harus punya:
- dry run mode
- backup output
- log sukses/gagal
- idempotent behavior

## JANGAN

- overwrite field lama tanpa backup
- delete field lama langsung
- migrasi sambil pelayanan berjalan

## SESUDAH MIGRASI

- hitung ulang dokumen
- buka sample pasien
- test dashboard
- test export