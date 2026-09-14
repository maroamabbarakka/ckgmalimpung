# 08 — Deployment Bertahap dan Rollback

## Tujuan
Mengurangi blast radius. Patch tidak boleh langsung diterapkan ke seluruh petugas lapangan tanpa validasi bertahap.

## Strategi Commit
Pisahkan minimal:

1. `feat/rbac-door-to-door-role`
2. `fix/dtd-operator-provenance`
3. `fix/firestore-dtd-least-privilege`
4. `test/dtd-rbac-regression`
5. opsional: `fix/dtd-skip-public-queue`

Jangan membuat satu commit “all improvements”.

## Tahap Deploy

### Tahap A — Local/Test
- build;
- unit test;
- rules test;
- UI screenshot comparison.

### Tahap B — Controlled Account
Buat satu akun test yang memiliki hanya:

```json
["door_to_door"]
```

Lakukan satu atau beberapa visit uji yang dapat dikenali jelas sebagai data test sesuai SOP environment.

Jangan memakai akun Kepala Puskesmas untuk pengujian role baru.

### Tahap C — Pilot Operasional
Berikan role DTD pada 1 petugas yang ditunjuk.

Pantau:
- save success;
- permission denied;
- duplicate visit;
- actor audit;
- `dokter_pemeriksa`;
- UI mobile.

### Tahap D — Rollout Bertahap
Setelah pilot stabil, baru tambahkan role pada petugas lain.

Jangan mengubah seluruh user sekaligus.

## Rollback Trigger
Rollback segera jika ditemukan salah satu:

- gagal save patient/visit;
- banyak `permission-denied` setelah deploy;
- Pos 1–7 ikut terganggu;
- user existing kehilangan akses;
- visit non-DTD dapat ditulis oleh DTD;
- nama petugas salah;
- non-dokter tercatat sebagai dokter;
- export/rapor gagal;
- UI modal/admin tidak dapat digunakan;
- duplicate visit meningkat;
- data lama berubah atau hilang.

## Rollback Source
Prioritas:

```bash
git revert <commit-bermasalah>
```

Jika beberapa commit saling bergantung, revert dari commit paling akhir secara terkontrol.

Setelah revert:

```bash
npm ci
npm run test:run
npm run build
```

## Rollback Firestore Rules
Kembalikan `firestore.rules` ke file baseline yang sudah dibackup lalu deploy rules versi baseline.

Jangan mencoba “memperbaiki cepat” rules produksi tanpa kembali ke kondisi known-good jika dampaknya luas.

## Rollback Data
Tidak perlu restore database jika:
- hanya UI rusak;
- hanya route guard salah;
- rules gagal tetapi tidak ada data korup.

Restore data hanya jika ada bukti data terubah/terhapus/terduplikasi secara tidak benar.

Gunakan manifest dan timestamp backup untuk mengidentifikasi scope.

## Validasi Setelah Rollback

- [ ] login role existing normal;
- [ ] Pos1–Pos7 normal;
- [ ] Kunjungan Rumah kembali ke behavior baseline;
- [ ] jumlah document tidak berkurang;
- [ ] export/rapor normal;
- [ ] TV queue normal;
- [ ] UI kembali seperti screenshot baseline.

## Catatan Production
Jangan deploy pada jam pelayanan puncak jika dapat dihindari. Pilih window yang memungkinkan verifikasi langsung setelah deploy.
