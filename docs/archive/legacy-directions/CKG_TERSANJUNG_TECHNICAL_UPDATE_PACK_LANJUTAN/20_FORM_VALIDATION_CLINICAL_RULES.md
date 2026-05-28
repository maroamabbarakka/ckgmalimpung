# 20 — Form Validation dan Clinical Rules

## Target
Mencegah data kosong, salah format, atau tidak masuk akal masuk ke rapor final.

## Struktur file
```txt
src/validation/
  commonValidators.js
  patientValidators.js
  pos1Validators.js
  pos2Validators.js
  pos3Validators.js
  pos4Validators.js
  pos5Validators.js
  pos6Validators.js
  pos7Validators.js
  validationMessages.js
```

## Validator umum
```js
export function required(value) {}
export function isValidNik(nik) {}
export function isValidDate(date) {}
export function isNumberInRange(value, min, max) {}
export function isPhoneNumber(value) {}
```

## Validasi pasien
Minimal:
- nama wajib;
- tanggal lahir wajib;
- jenis kelamin wajib;
- alamat/desa wajib;
- NIK wajib untuk dewasa jika tersedia;
- NIK 16 digit jika diisi;
- tanggal lahir tidak boleh masa depan.

## Validasi Pos 1
Minimal:
- kategori usia terisi;
- status kunjungan terisi;
- petugas terisi;
- hasil registrasi valid.

## Validasi vital sign
Untuk tekanan darah:
- sistolik angka;
- diastolik angka;
- sistolik > diastolik;
- range wajar: sistolik 50-250, diastolik 30-150.

Untuk tinggi/berat:
- tinggi angka;
- berat angka;
- range sesuai kategori umur;
- tampilkan warning jika ekstrem, jangan langsung tolak jika masih mungkin.

## Pesan error
Jangan gunakan pesan umum seperti:
```txt
Data tidak valid
```

Gunakan:
```txt
Tekanan darah sistolik wajib diisi.
NIK harus 16 digit angka.
Tanggal lahir tidak boleh melebihi hari ini.
```

## Error summary
Di atas form tampilkan:
```txt
Ada 4 data wajib yang belum lengkap:
1. NIK belum valid
2. Tekanan darah belum diisi
3. Status skrining belum dipilih
4. Petugas pemeriksa belum terisi
```

## Acceptance criteria
- Tombol finalisasi disabled sampai validasi terpenuhi.
- Field error muncul di dekat field terkait.
- Error summary muncul di atas form.
- Semua validator bisa dites tanpa membuka UI.
