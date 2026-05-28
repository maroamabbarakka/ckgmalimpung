# Prompt VS/Codex — Perbaikan UI Mobile Halaman Pos

Gunakan untuk Pos1–Pos7.

```txt
Rapikan UI mobile untuk halaman:
[ISI_NAMA_FILE_POS]

Target:
- nyaman di layar 360px,
- tombol aksi utama selalu mudah dijangkau,
- form tidak terlalu padat,
- status pasien terlihat jelas,
- jangan ubah logika save/load data,
- jangan ubah field Firestore.

Implementasi:
1. Gunakan PageHeader.
2. Gunakan SectionCard.
3. Gunakan StatusBadge.
4. Gunakan BottomActionBar.
5. Pastikan input minimal tinggi 44px.
6. Pastikan tombol minimal tinggi 44px.
7. Hindari tabel lebar di mobile; ubah menjadi card/list.

Acceptance criteria:
- tidak perlu zoom di HP,
- tombol simpan terlihat,
- pasien aktif jelas,
- build sukses.
```
