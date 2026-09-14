# 10 — Prompt Master untuk Codex/Developer

Gunakan instruksi berikut sebagai master prompt ketika implementasi dimulai.

---

## MASTER INSTRUCTION

Anda mengerjakan repository `maroamabbarakka/ckgmalimpung` dalam **STABILIZATION MODE**.

Tujuan patch adalah menambahkan role `door_to_door` untuk petugas Kunjungan Rumah dan memperbaiki provenance operator tanpa merusak data, workflow, export, laporan, ataupun UI/UX existing.

### Aturan Mutlak

1. Jangan bekerja langsung pada `main`; gunakan branch khusus.
2. Sebelum perubahan apa pun, catat SHA baseline dan lakukan backup source + Firestore.
3. Jangan mengubah, rename, atau menghapus collection existing.
4. Jangan mengubah, rename, atau menghapus field existing.
5. Jangan mengubah `src/formSchemas.json`.
6. Jangan mengubah struktur export resmi.
7. Jangan mengubah struktur laporan resmi.
8. Jangan melakukan migrasi massal data lama.
9. Jangan melakukan refactor besar `KunjunganRumah.jsx` atau `AdminDashboard.jsx` dalam patch ini.
10. Jangan melakukan redesign UI.
11. Jangan mengubah alur Loket dan Pos1–Pos7 selain bila benar-benar dibutuhkan dan telah dibuktikan tidak berdampak regresi.
12. Setiap perubahan harus backward compatible.
13. Gunakan small commits; satu commit satu tujuan.
14. Jika test/build gagal, jangan deploy.

### Implementasi P0

#### A. Role
Tambahkan canonical role:

```text
door_to_door
```

Label UI:

```text
Petugas Door to Door
```

Tambahkan role hanya ke module access Kunjungan Rumah/field. Jangan beri Pos1–Pos7, admin, SIMPEG, atau settings.

#### B. SIMPEG
Tambahkan pilihan role pada UI existing tanpa mengubah layout besar. Multi-role harus tetap bekerja. Saat menambah DTD ke pegawai, role lain tidak boleh hilang.

#### C. Data Provenance
Untuk visit DTD baru, tambahkan metadata additive:

```text
visit_source = door_to_door
execution_mode = door_to_door
created_by_uid
created_by_name
created_by_roles
petugas_kunjungan_rumah
```

Jangan backfill data lama.

Legacy DTD tetap dikenali dari:

```text
jalur_pemeriksaan == "Kunjungan Rumah"
```

#### D. Dokter Pemeriksa
Jangan pernah otomatis mengisi `dokter_pemeriksa` dengan nama user non-dokter.

Jika user memiliki role dokter, boleh isi dengan nama user. Jika bukan dokter, pertahankan kosong/tidak ditulis sesuai opsi yang paling kompatibel dengan renderer existing.

Jangan hapus field petugas Pos existing.

#### E. Firestore Rules
Implementasikan least privilege.

DTD boleh membuat/mengubah data yang diperlukan untuk Kunjungan Rumah tetapi tidak boleh menulis visit non-DTD, users, staff, atau admin config.

Jangan memperketat global read `visits` dalam patch ini karena annual CKG validation dapat bergantung pada akses pencarian visit lintas jalur.

#### F. Public Queue
Jika flow DTD saat ini ikut menulis `public_queue`, lebih baik tambahkan opsi service untuk melewati sync khusus visit DTD yang langsung selesai. Jangan memberi permission public_queue tambahan kepada DTD jika tidak diperlukan.

### UI Safety
Gunakan style existing. Hindari global CSS. Pastikan desktop dan mobile tidak berubah kecuali penambahan role/menu yang diperlukan.

### Tests Wajib

- lint;
- unit test;
- build;
- RBAC route test;
- Firestore rule test;
- Kunjungan Rumah create test;
- provenance test;
- test non-dokter bukan dokter_pemeriksa;
- smoke test Pos1–Pos7;
- export/rapor smoke test;
- mobile responsive test;
- screenshot comparison before/after.

### Output Developer
Setelah implementasi, laporkan:

1. daftar file berubah;
2. alasan tiap file berubah;
3. diff summary;
4. hasil test lengkap;
5. bukti tidak ada migrasi data;
6. bukti schema/export tidak berubah;
7. screenshot UI before/after;
8. langkah deploy;
9. langkah rollback;
10. risiko tersisa.

Jika ada kebutuhan perubahan di luar scope, STOP dan buat rekomendasi patch terpisah. Jangan menyisipkan refactor tambahan.
