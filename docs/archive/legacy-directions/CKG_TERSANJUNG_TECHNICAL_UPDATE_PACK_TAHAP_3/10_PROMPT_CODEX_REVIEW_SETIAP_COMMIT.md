# Prompt VS/Codex — Review Setiap Commit

Gunakan prompt ini setelah developer membuat perubahan.

```txt
Audit perubahan terakhir pada repo ini.

Fokus:
1. Apakah perubahan merusak alur data lama?
2. Apakah ada hardcoded role/session baru?
3. Apakah ada query Firestore yang berpotensi membaca data terlalu banyak?
4. Apakah UI mobile tetap aman pada 360px?
5. Apakah perubahan ini menambah duplikasi komponen?
6. Apakah ada risiko data pasien terhapus/tertimpa?
7. Apakah acceptance criteria issue sudah terpenuhi?

Jangan menambah fitur baru.
Berikan hasil dalam format:
- Temuan kritis
- Temuan minor
- File yang perlu diperbaiki
- Patch minimal yang disarankan
```
