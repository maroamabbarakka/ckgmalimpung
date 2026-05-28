# Firestore Indexes

| Collection | Fields | Query Modul | Dibuat |
|---|---|---|---|
| `visits` | `status_antrian ASC`, `waktu_ambil_tiket ASC` | Antrean pos, dashboard, TV display | 2026-05-27 |
| `visits` | `patientNIK ASC`, `tanggal_kunjungan DESC` | Validasi kunjungan tahunan pasien | 2026-05-27 |

Jika Firebase menampilkan error index baru, tambahkan baris baru di dokumen ini sebelum deploy ulang.
