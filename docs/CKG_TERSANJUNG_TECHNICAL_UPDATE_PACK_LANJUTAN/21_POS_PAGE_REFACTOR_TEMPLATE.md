# 21 — Template Refactor Halaman Pos

## Target
Semua halaman Pos punya pola yang sama agar tidak maju-mundur.

## Struktur folder per pos
```txt
src/features/pos1/
  Pos1Page.jsx
  Pos1Form.jsx
  Pos1Queue.jsx
  Pos1PatientSummary.jsx
  pos1Service.js
  pos1Validation.js
  pos1.constants.js
```

## Pola layout wajib
```txt
Header Pos
Patient Summary Card
Queue / Selected Patient
Form Sections
Sticky Bottom Action Bar
Sync Status
Validation Summary
```

## Header Pos
Wajib menampilkan:
- nama pos;
- tanggal layanan;
- nama petugas;
- status online/offline;
- jumlah antrean.

## Patient Summary Card
Wajib:
- nama pasien;
- umur;
- jenis kelamin;
- desa/dusun;
- status workflow;
- label risiko jika ada.

## Form sections
Jangan satu form panjang tanpa section.

Contoh:
```txt
1. Identitas Pemeriksaan
2. Data Klinis
3. Hasil Skrining
4. Catatan Petugas
```

## Sticky bottom action bar
Mobile dan tablet wajib punya action tetap:
- Kembali;
- Simpan Draft;
- Selesai Pos.

Desktop boleh tampil sebagai footer card.

## Service layer
Semua query/write pindah ke `pos1Service.js`.

Komponen tidak boleh langsung memanggil Firestore jika bukan simple read UI.

## Refactor bertahap
1. Buat folder baru.
2. Copy logic lama.
3. Pindahkan query ke service.
4. Pindahkan validasi ke validator.
5. Pindahkan UI card ke komponen kecil.
6. Test manual.
7. Hapus kode lama jika route sudah aman.

## Acceptance criteria
- Pos tetap berfungsi sama.
- File utama Pos tidak lebih dari 300-400 baris.
- Firestore write hanya lewat service.
- Validasi hanya lewat validator.
- Layout mobile tidak memaksa operator zoom.
