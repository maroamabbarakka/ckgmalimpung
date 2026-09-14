# 11 — DO NOT TOUCH LIST

## Tujuan
Daftar ini mencegah patch role Door to Door melebar menjadi perubahan besar yang berisiko.

## Data & Schema — Jangan Diubah

- collection name existing;
- document ID strategy existing;
- field existing;
- nesting utama patient/visit;
- `src/formSchemas.json`;
- ID pertanyaan resmi;
- type field resmi;
- conditional logic FormSchemas tanpa audit terpisah.

## Export & Report — Jangan Diubah

- nama kolom;
- urutan/grouping resmi;
- struktur sheet;
- mapping export;
- struktur Rapor Digital;
- `public/Laporan_Tersanjung_Final.html` sebagai referensi output resmi.

## Workflow — Jangan Diubah

- antrean Loket;
- transisi Pos1–Pos7;
- queue status existing;
- locking existing;
- flow selesai normal;
- mekanisme TV queue normal.

Kecuali perubahan kecil yang eksplisit dibutuhkan untuk mencegah DTD menulis public queue, dan harus default-compatible untuk flow normal.

## UI — Jangan Diubah

- design system global;
- breakpoint global;
- ukuran font global;
- sidebar global;
- bottom navigation role lain;
- layout Dashboard;
- layout Pos1–Pos7;
- global table styles;
- global modal styles.

## Refactor — Ditunda

- pecah `KunjunganRumah.jsx` besar-besaran;
- pecah `AdminDashboard.jsx` besar-besaran;
- satukan seluruh route guard;
- ubah seluruh permission model;
- migrasi role/permissions global;
- ubah seluruh auth source-of-truth.

Semua hal tersebut bisa baik secara arsitektur, tetapi **bukan bagian patch stabilisasi DTD**.

## Security Hardening Global — Ditunda
Jangan memperketat read seluruh `visits` pada patch ini tanpa desain dan test untuk validasi CKG tahunan.

Buat patch terpisah untuk:
- registry CKG tahunan;
- minimization read data kesehatan;
- permission granular session;
- custom claims strategy jika kelak diperlukan.

## Rule of Thumb
Jika perubahan tidak diperlukan secara langsung untuk:

1. menambah role DTD,
2. memberi akses Kunjungan Rumah,
3. mengamankan write DTD,
4. mencatat operator sebenarnya,
5. mencegah non-dokter menjadi dokter,
6. menjaga UI tidak rusak,

maka jangan masukkan ke patch ini.
