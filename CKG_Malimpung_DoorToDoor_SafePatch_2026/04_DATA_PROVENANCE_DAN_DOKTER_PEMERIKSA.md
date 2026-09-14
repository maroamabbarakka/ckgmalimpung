# 04 — Data Provenance, Identitas Operator, dan Koreksi `dokter_pemeriksa`

## Masalah yang Harus Diselesaikan
Flow Kunjungan Rumah saat ini dapat mengisi nama operator yang login ke banyak field petugas, termasuk `dokter_pemeriksa`.

Setelah role `door_to_door` diberikan kepada petugas non-dokter, perilaku ini tidak boleh dibiarkan karena dapat menghasilkan data semantik yang salah.

## Prinsip

- **Operator lapangan ≠ dokter pemeriksa**.
- Identitas pengguna yang benar harus tercatat.
- Field lama tetap dipertahankan untuk kompatibilitas.
- Penambahan field baru dilakukan additive-only.

## Field Baru untuk Data Baru
Rekomendasi:

```js
visit_source: 'door_to_door',
execution_mode: 'door_to_door',
created_by_uid: user.uid,
created_by_name: user.nama,
created_by_roles: user.roles,
petugas_kunjungan_rumah: {
  uid: user.uid,
  nama: user.nama,
  roles: user.roles
}
```

### Jangan backfill massal data lama
Data lama yang hanya memiliki:

```text
jalur_pemeriksaan = "Kunjungan Rumah"
```

tetap valid.

Gunakan compatibility logic:

```js
isDoorToDoorVisit =
  visit.visit_source === 'door_to_door' ||
  visit.jalur_pemeriksaan === 'Kunjungan Rumah'
```

## `dokter_pemeriksa`
### Aturan baru
Jika user memiliki role dokter:

```js
dokter_pemeriksa = user.nama
```

Jika user bukan dokter:

- jangan otomatis mengisinya dengan nama operator;
- biarkan kosong/null/field tidak ditulis sesuai kompatibilitas paling aman;
- jika SOP membutuhkan dokter penanggung jawab, buat mekanisme eksplisit pada patch terpisah setelah requirement klinis disepakati.

### Dilarang

```text
petugas door_to_door non-dokter
→ otomatis menjadi dokter_pemeriksa
```

## Field `petugas_pos1` sampai `petugas_pos7`
Jangan hapus atau rename karena mungkin dipakai laporan/rapor lama.

Untuk patch ini:

- pertahankan perilaku existing jika diperlukan kompatibilitas;
- tambahkan `petugas_kunjungan_rumah` sebagai provenance yang lebih akurat;
- jangan mengubah renderer laporan/export tanpa audit terpisah.

## Updated-by Metadata
P1 yang disarankan:

```js
updated_by_uid
updated_by_name
updated_at
```

Ini berguna jika visit DTD dapat diperbaiki oleh petugas lain.

## Audit Log
Pastikan audit DTD menyimpan actor sebenarnya:

- UID
- nama
- roles
- module `Kunjungan Rumah`
- visitId
- patientKey
- `visit_source` pada detail after jika memungkinkan

## Data Integrity Check
Setelah patch, lakukan query/sampling data baru dan pastikan:

- `visit_source` benar;
- `created_by_uid` cocok dengan user login;
- `created_by_name` benar;
- role `door_to_door` tercatat;
- `dokter_pemeriksa` tidak terisi nama petugas non-dokter;
- data lama tidak berubah.

## Acceptance Criteria
- [ ] tidak ada migrasi massal.
- [ ] visit lama tetap terbaca.
- [ ] visit baru DTD punya provenance.
- [ ] non-dokter tidak menjadi dokter secara otomatis.
- [ ] laporan/rapor existing masih dapat membuka visit DTD.
