# Dental Completeness P1 2026

## Scope

Patch P1 ini menambahkan interpretasi read-only atas pemeriksaan Gigi & Mulut yang sudah tersimpan pada visit. Patch tidak membuat collection/field baru, tidak menulis ke Firestore, tidak memigrasikan record lama, dan tidak mengubah export, Rapor Digital, Pos1-Pos7, `formSchemas.json`, atau CSS global.

Branch P1 dibuat terpisah di atas branch Door-to-Door:

```text
safety/dental-completeness-p1-20260915
```

## Source of Truth

Urutan pembacaan:

1. `pos2.skrining_gigi` untuk payload terstruktur, termasuk Kunjungan Rumah;
2. jawaban `pos3` yang dipetakan oleh `pos3_question_map` untuk workflow normal/legacy;
3. kategori pasien dan keberadaan struktur data untuk menentukan status aman bila data pemeriksaan tidak tersedia.

Status antrean `Selesai` tidak pernah digunakan sebagai bukti bahwa pemeriksaan gigi sudah lengkap.

## Empat Status Derived

- `Sudah diperiksa`: seluruh field representatif yang applicable terisi.
- `Belum diperiksa`: pemeriksaan applicable tetapi field representatif belum lengkap.
- `Tidak berlaku`: kategori Bayi.
- `Data legacy/perlu verifikasi`: kategori/struktur record lama tidak cukup untuk membuat kesimpulan klinis yang aman.

Balita menggunakan `karies`; kategori sekolah menggunakan `goyang`, `lubang`, dan `hilang`; Dewasa/Lansia menggunakan ketiganya ditambah `periodontal`. Nilai numerik `0`, boolean, `Ya`, dan `Tidak` diperlakukan sebagai jawaban valid. Nilai kosong, `-`, `Belum diperiksa`, `Tidak diperiksa`, serta `Tidak dilakukan` bukan jawaban pemeriksaan yang lengkap.

## UI

Dashboard memiliki card `Gigi & Mulut` yang menampilkan jumlah visit berstatus `Belum diperiksa` atau `Data legacy/perlu verifikasi` pada filter aktif. Klik card membuka daftar kandidat perbaikan untuk administrator dan mempertahankan pembatasan detail pasien untuk akses publik.

Perubahan grid bersifat lokal: card baru menggunakan style card klinis existing, panel unduh dipersempit dari 18 menjadi 15 kolom, dan layout mobile tetap dua kolom. Saved layout lama ditambahkan slot dental tanpa menghapus susunan kustom pengguna.

## Bukti Data Snapshot

Evaluasi agregat atas backup valid berisi 1.316 visit menghasilkan:

| Status | Jumlah |
|---|---:|
| Sudah diperiksa | 1.272 |
| Belum diperiksa | 43 |
| Tidak berlaku | 0 |
| Data legacy/perlu verifikasi | 1 |

Keempat status berjumlah tepat 1.316. Seluruh 43 record `Belum diperiksa` mempunyai pertanyaan dental pada `pos3_question_map` tetapi jawaban representatif belum lengkap. Audit agregat tidak mencetak identitas atau isi klinis pasien.

## Pengujian

- unit test mencakup DTD baru, workflow normal Pos 3, field parsial, karies bernilai nol, kategori Bayi, explicit unexamined, dan record legacy;
- browser test mencakup card, popup, serta horizontal overflow pada desktop 1440x900 dan mobile 390x844;
- tidak ada Firestore write saat helper atau Dashboard dibuka;
- lint, seluruh unit test, Firestore Rules matrix, dan production build wajib tetap lulus.

## Batasan Rollout

P1 mengikuti branch/PR berantai dan telah masuk setelah patch inti Door-to-Door melalui PR #3 pada commit `1cb9a7829f8360685c54af135664564aa9e951a9`. Hosting production berhasil dideploy pada 15 September 2026 sebagai version `f3bf41a59eda2041` setelah persetujuan eksplisit pengelola.

Smoke test produksi read-only memastikan card `Gigi & Mulut`, sumber `skrining_gigi`, role `door_to_door`, dan route Kunjungan Rumah tersedia pada bundle live. Halaman login lulus pada desktop dan mobile tanpa error JavaScript atau horizontal overflow. Verifikasi transaksi end-to-end tetap menunggu akun pilot DTD-only agar pengujian tidak memakai akun operasional atau membuat data pasien tanpa SOP.
