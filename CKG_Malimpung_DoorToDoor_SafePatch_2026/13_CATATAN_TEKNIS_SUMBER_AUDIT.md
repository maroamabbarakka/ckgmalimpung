# 13 — Catatan Teknis Sumber Audit

Paket arahan ini disusun dari audit struktur repository `maroamabbarakka/ckgmalimpung` dengan fokus pada:

- model role/RBAC;
- autentikasi user;
- SIMPEG/hak akses;
- route Kunjungan Rumah;
- `KunjunganRumah.jsx`;
- `patientService.js`;
- `visitService.js`;
- `publicQueueService.js`;
- audit log;
- `firestore.rules`;
- script backup existing;
- kebijakan internal `NO_DATA_BREAK_POLICY.md`;
- kebijakan `STABILIZATION_FIRST.md`;
- dokumentasi `BACKUP_RECOVERY.md`.

## Temuan yang Menjadi Dasar Arahan

1. Belum ada canonical role `door_to_door`.
2. Kunjungan Rumah saat ini bergantung pada role lain yang memiliki akses field.
3. Flow Kunjungan Rumah menyimpan visit langsung dari client ke Firestore.
4. Patient juga ditulis dari flow Kunjungan Rumah.
5. Metadata operator perlu dipisahkan dari dokter pemeriksa.
6. Public queue tidak perlu diperluas hak aksesnya ke DTD jika visit DTD langsung berstatus selesai.
7. Repo sudah mempunyai prinsip NO DATA BREAK dan STABILIZATION FIRST sehingga patch harus kecil dan kompatibel.
8. Script backup existing berfokus pada file/source, sehingga data Firestore harus memiliki backup tersendiri sebelum deploy.

## Catatan
Dokumen ini adalah **arahan implementasi**, bukan perubahan langsung terhadap source code maupun database. Tidak ada data produksi yang dimodifikasi oleh pembuatan paket dokumen ini.
