# 28 — QA Script Manual Test Cases

## Target
Developer dan operator bisa menguji fitur utama dengan checklist yang sama.

## Test 1 — Login dan akses role
Langkah:
1. Login sebagai admin.
2. Buka dashboard.
3. Buka staff management.
4. Logout.
5. Login sebagai petugas pos.
6. Coba buka staff management via URL.

Expected:
- admin bisa buka sesuai permission;
- petugas pos ditolak;
- URL langsung tetap ditolak.

## Test 2 — Registrasi pasien baru
Langkah:
1. Buka Pos 1/loket.
2. Input pasien lengkap.
3. Simpan.
4. Cek antrean.

Expected:
- pasien masuk antrean;
- umur otomatis benar;
- status `REGISTERED` atau `POS1_COMPLETE` sesuai flow;
- audit log tercatat.

## Test 3 — Cegah CKG dobel setahun
Langkah:
1. Buat pasien dengan NIK sama.
2. Buat kunjungan CKG kedua di tahun yang sama.

Expected:
- sistem memberi warning;
- tidak membuat kunjungan dobel tanpa override admin.

## Test 4 — Workflow pos
Langkah:
1. Pilih pasien.
2. Selesaikan Pos 1.
3. Buka Pos 3 sebelum Pos 2.

Expected:
- Pos 3 terkunci jika Pos 2 wajib belum selesai.

## Test 5 — Validasi form
Langkah:
1. Kosongkan field wajib.
2. Klik selesai pos.

Expected:
- tidak bisa selesai;
- field error muncul;
- error summary muncul.

## Test 6 — Offline draft
Langkah:
1. Matikan internet.
2. Isi form pos.
3. Simpan draft.
4. Hidupkan internet.

Expected:
- status offline terlihat;
- data tidak hilang;
- status sinkron berubah saat online.

## Test 7 — Export laporan
Langkah:
1. Login sebagai petugas pos.
2. Coba export.
3. Login sebagai admin.
4. Export dengan filter tanggal.

Expected:
- petugas ditolak;
- admin bisa export;
- audit log tercatat;
- NIK masking sesuai aturan.

## Test 8 — TV Display
Langkah:
1. Buka `/tv-display/fullscreen`.
2. Dari operator, panggil nomor antrean.
3. Panggil ulang.

Expected:
- nomor tampil besar;
- audio berjalan jika browser mengizinkan;
- data sensitif tidak muncul.

## Test 9 — Mobile back button
Langkah:
1. Buka di HP Android Chrome.
2. Masuk dashboard > pasien > detail.
3. Tekan tombol back HP.

Expected:
- kembali ke list, bukan blank page.

## Test 10 — Build final
Langkah:
```bash
npm run build
```

Expected:
- build sukses;
- tidak ada error import;
- tidak ada warning kritis yang menghambat deploy.
