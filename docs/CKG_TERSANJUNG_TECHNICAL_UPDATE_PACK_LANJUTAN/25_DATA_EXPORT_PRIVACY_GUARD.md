# 25 — Data Export dan Privacy Guard

## Target
Export laporan tetap berguna tanpa membuka data pasien berlebihan.

## Masalah yang harus dicegah
- Semua role bisa export semua data.
- Export berisi NIK penuh tanpa kebutuhan.
- Export tidak tercatat.
- Filter tanggal kosong sehingga semua data keluar.

## Permission
Export hanya untuk:
- superadmin;
- admin;
- koordinator yang diberi permission khusus.

## Guard sebelum export
Wajib cek:
```js
canExportReport(user, reportType, filters)
```

## Filter wajib
Minimal export harus punya:
- tanggal mulai;
- tanggal akhir;
- jenis laporan;
- cakupan wilayah.

Jika filter kosong:
```txt
Export ditolak. Pilih rentang tanggal terlebih dahulu.
```

## Masking data
Untuk laporan umum:
- NIK tampil 4 digit akhir saja;
- nomor HP masking;
- alamat detail opsional.

Contoh:
```txt
NIK: ************1234
HP: 08******4321
```

## Export lengkap
Export lengkap hanya untuk role khusus dan wajib audit log.

## Watermark metadata
Setiap PDF/Excel tambahkan:
```txt
Diekspor oleh: Nama Petugas
Role: Admin
Tanggal export: YYYY-MM-DD HH:mm
Filter: tanggal/wilayah
```

## Acceptance criteria
- User tanpa permission tidak bisa export meski klik URL/handler.
- Semua export tercatat di audit_logs.
- Export default tidak membuka NIK penuh.
- Filter tanggal wajib.
