# 03 — Implementasi Role Door to Door (RBAC) secara Aman

## Tujuan
Membuat role khusus untuk petugas Kunjungan Rumah tanpa memberi hak akses berlebihan dan tanpa mengubah perilaku role yang sudah ada.

## Canonical Role ID
Gunakan ID internal:

```text
door_to_door
```

Label UI:

```text
Petugas Door to Door
```

Jangan gunakan label UI sebagai value database.

## Perubahan `roles.js`
Tambahkan secara additive:

```js
DOOR_TO_DOOR: 'door_to_door'
```

Kemudian tambahkan **hanya** ke module access Kunjungan Rumah/field.

Konsep:

```js
field: [
  ROLES.ADMIN,
  ROLES.DOKTER,
  ROLES.PERAWAT,
  ROLES.PERAWAT_BIDAN,
  ROLES.DOOR_TO_DOOR
]
```

### Jangan ubah akses role existing
Role dokter/perawat/bidan/admin yang sebelumnya dapat mengakses Kunjungan Rumah harus tetap dapat mengaksesnya.

## Matrix Akses Minimum

| Fitur | door_to_door |
|---|---:|
| Login | Ya |
| Kunjungan Rumah | Ya |
| Input pasien untuk Kunjungan Rumah | Ya |
| Validasi CKG tahunan yang dibutuhkan flow | Ya |
| Pos 1–7 | Tidak |
| Loket | Tidak |
| SIMPEG Admin | Tidak |
| Manajemen User | Tidak |
| TV Queue Control | Tidak |
| Export seluruh database | Tidak |
| Pengaturan sistem | Tidak |

## SIMPEG
Tambahkan opsi role pada daftar role existing, tanpa menghapus atau mengganti role lama.

Rekomendasi grouping UI:

```text
Pelayanan Klinis
- Petugas Umum
- TTLM
- Perawat
- Bidan
- Dokter
- Apoteker

Pelayanan Lapangan
- Petugas Door to Door

Administrasi
- Administrator
```

Jika grouping membutuhkan perubahan UI besar, cukup tambahkan satu opsi role baru pada layout existing terlebih dahulu. **Stabilitas lebih penting daripada redesign.**

## Multi-role Harus Tetap Didukung
Contoh valid:

```json
{
  "roles": ["perawat", "door_to_door"]
}
```

Contoh valid:

```json
{
  "roles": ["door_to_door"]
}
```

Jangan memaksa petugas DTD menjadi dokter/perawat/admin hanya untuk mendapatkan menu.

## Canonical User Field
Pertahankan pola existing:

```json
{
  "roles": ["door_to_door"]
}
```

Jika sistem masih menyimpan alias `role`, pertahankan untuk backward compatibility; jangan hapus dalam patch ini.

## Session/Auth
Patch inti cukup memastikan role baru masuk melalui mekanisme auth existing.

Perbaikan `permissions` granular ke session adalah P1 dan harus commit terpisah karena blast radius lebih luas.

## Route Guard
`/kunjungan-rumah` harus menerima `door_to_door`.

Route Pos 1–7, admin, SIMPEG dan modul lain **harus menolak** user DTD-only.

## Redirect DTD-only
Opsional P1:
Jika user hanya memiliki role `door_to_door`, setelah login boleh diarahkan ke `/kunjungan-rumah` atau beranda sederhana.

Jangan mengubah redirect user role lain.

## Acceptance Criteria RBAC
- [ ] opsi role muncul di SIMPEG.
- [ ] role tersimpan ke profil staff/user existing tanpa menghapus role lain.
- [ ] DTD-only dapat membuka Kunjungan Rumah.
- [ ] DTD-only tidak dapat membuka Pos 1–7.
- [ ] DTD-only tidak dapat membuka admin/SIMPEG.
- [ ] dokter/perawat/admin tetap berfungsi seperti baseline.
- [ ] perubahan role tercatat pada activity log jika mekanisme existing mendukung.
