# 26 — TV Display, Queue, dan Audio Panggilan

## Target
TV display tidak hanya tampil, tetapi membantu pelayanan publik.

## Collection queue
```js
{
  visitId,
  patientId,
  queueNumber,
  patientNameMasked,
  targetPos: 'pos1'|'pos2'|'pos3'|'pos4'|'pos5'|'pos6'|'pos7',
  status: 'waiting'|'called'|'serving'|'done'|'skipped',
  calledAt,
  servedAt,
  createdAt,
  updatedAt
}
```

## Mode display
Buat route:
```txt
/tv-display
/tv-display/fullscreen
/tv-display/queue-only
/tv-display/education
```

## Layout display
Wajib ada:
- nomor antrean besar;
- pos tujuan;
- daftar panggilan terakhir;
- jam dan tanggal;
- running text edukasi kesehatan;
- status koneksi.

## Audio panggilan
Gunakan Web Speech API fase awal.

Format:
```txt
Nomor antrean A 0 1 2, silakan menuju Pos 2.
```

Jangan sebut nama lengkap pasien di TV/audio jika tidak perlu.

## Operator action
Di halaman operator:
- Panggil;
- Panggil ulang;
- Lewati;
- Sedang dilayani;
- Selesai.

## Anti spam
- tombol panggil ulang cooldown 5 detik;
- log setiap panggilan;
- jika audio gagal, tetap update visual.

## Acceptance criteria
- Display tetap terbaca dari jarak 3-5 meter.
- Nomor antrean tidak bocor data sensitif.
- Panggilan ulang bisa dilakukan.
- Mode fullscreen tidak menampilkan sidebar aplikasi.
