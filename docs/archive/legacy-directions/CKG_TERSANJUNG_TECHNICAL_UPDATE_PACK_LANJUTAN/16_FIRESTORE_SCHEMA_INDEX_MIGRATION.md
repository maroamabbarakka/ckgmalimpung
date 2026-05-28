# 16 — Firestore Schema, Index, dan Migrasi Aman

## Target
Merapikan struktur data agar dashboard, pos, dan laporan tidak berat.

## Prinsip
1. Jangan rename collection langsung tanpa migrasi.
2. Jangan hapus field lama sebelum fallback selesai.
3. Tambahkan field baru dulu, lalu backfill, lalu pindahkan pembacaan.
4. Semua query dashboard harus punya index jelas.

## Collection minimum yang disarankan
```txt
staff/{staffId}
patients/{patientId}
visits/{visitId}
visit_pos_results/{visitId_posId}
queue/{queueId}
audit_logs/{logId}
daily_stats/{dateId}
exports/{exportId}
system_settings/{settingId}
```

## Field patients
```js
{
  nik: string|null,
  noKk: string|null,
  nama: string,
  tanggalLahir: string,
  jenisKelamin: 'L'|'P',
  alamat: string,
  desa: string,
  dusun: string|null,
  noHp: string|null,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  isArchived: false
}
```

## Field visits
```js
{
  patientId: string,
  visitDate: 'YYYY-MM-DD',
  visitYear: number,
  visitType: 'CKG'|'KUNJUNGAN_RUMAH'|'LAINNYA',
  ageCategory: string,
  status: 'REGISTERED'|'POS1_COMPLETE'|'POS2_COMPLETE'|'POS3_COMPLETE'|'POS4_COMPLETE'|'POS5_COMPLETE'|'POS6_COMPLETE'|'POS7_COMPLETE'|'FINALIZED'|'CANCELLED',
  activeOfficerId: string|null,
  activePos: string|null,
  completedPos: ['pos1'],
  riskFlags: [],
  summary: {},
  createdAt,
  updatedAt,
  finalizedAt: null,
  createdBy,
  updatedBy
}
```

## Field visit_pos_results
```js
{
  visitId: string,
  patientId: string,
  posId: 'pos1'|'pos2'|'pos3'|'pos4'|'pos5'|'pos6'|'pos7',
  data: {},
  validationStatus: 'draft'|'valid'|'invalid',
  validatedBy: string|null,
  savedAt,
  updatedAt,
  savedBy,
  version: number
}
```

## Index yang perlu disiapkan
Minimal:
- `visits`: `visitDate + status`
- `visits`: `patientId + visitYear`
- `visits`: `activePos + status`
- `patients`: `nik`
- `patients`: `nama`
- `patients`: `desa`
- `queue`: `visitDate + status + createdAt`
- `audit_logs`: `targetId + createdAt`
- `audit_logs`: `actorId + createdAt`

## Migrasi bertahap

### Step 1 — Tambah field tanpa mengubah UI
Tambahkan field baru ketika create/update:
- `visitDate`
- `visitYear`
- `status`
- `createdBy`
- `updatedBy`

### Step 2 — Backfill data lama
Buat script:
```txt
scripts/backfillVisits.js
```

Isi logika:
- baca semua dokumen visit lama;
- jika belum ada `visitYear`, hitung dari tanggal;
- jika belum ada `status`, mapping dari field lama;
- update batch per 400 dokumen.

### Step 3 — Pindahkan query dashboard
Dashboard tidak boleh membaca semua visit untuk statistik. Gunakan:
- query by date;
- daily_stats untuk agregat.

### Step 4 — Validasi hasil
Buat laporan:
```txt
docs/migration/firestore-migration-result.md
```

Isi:
- jumlah dokumen dibaca;
- jumlah dokumen diupdate;
- error;
- dokumen yang dilewati.

## Acceptance criteria
- Tidak ada data pasien hilang.
- Dashboard tetap menampilkan angka sama atau lebih akurat.
- Query tidak membaca seluruh database untuk statistik harian.
- Duplicate CKG per tahun dicegah dari query `patientId + visitYear`.
