# Door to Door Safe Patch 2026

## Status

- Branch: `safety/door-to-door-rbac-20260915`
- Baseline commit: `40dbaedc21899fd408ec8910f7e6617d2dfa9a2f`
- Local rollback tag: `safety-pre-dtd-20260915-0300`
- Scope: role `door_to_door`, provenance operator, semantik dokter pemeriksa, public queue opt-out, dan Firestore least privilege.
- Production deployment: belum dilakukan. Deployment menunggu akun pilot DTD dan window operasional yang disetujui.

## Baseline

Baseline source tersimpan di:

```text
D:\PKM_MALIMPUNG\Backups_Tersanjung\backup_20260915_025653
```

Baseline teknis:

- `npm run test:run`: 49/49 lulus.
- `npm run build`: lulus.
- `npm run lint`: dua error existing karena `XAxis` digunakan tanpa import dan tujuh warning existing. Import `XAxis` diperbaiki secara minimal; warning existing tidak diubah karena di luar scope.

## Backup Firestore

Backup read-only valid tersimpan di:

```text
D:\PKM_MALIMPUNG\Backups_Tersanjung\firestore_pre_dtd_20260914T190058Z
```

| Collection | Count |
|---|---:|
| patients | 1.329 |
| visits | 1.316 |
| users | 73 |
| staff | 57 |
| activity_logs | 9.034 |
| public_queue | 1.426 |
| schools | 15 |
| pengaturan | 1 |
| panggilan_tv | 8.318 |
| queue_counters | 30 |

Verifikasi backup:

- seluruh checksum SHA-256 cocok;
- jumlah array JSON cocok dengan manifest;
- document ID tersedia;
- Timestamp disimpan dengan `seconds`, `nanoseconds`, dan ISO string;
- rules, indexes, `.firebaserc`, `firebase.json`, serta `.env.example` ikut disalin;
- utility hanya menggunakan `getDocs`; tidak memiliki operasi tulis Firestore.

Folder parsial `firestore_pre_dtd_20260914T185820Z` bukan backup valid karena proses awal dihentikan sebelum manifest/checksum selesai. Jangan gunakan folder parsial tersebut untuk recovery.

## Perubahan Data dan Kompatibilitas

Patch tidak menjalankan migrasi, backfill, update, atau delete terhadap data produksi. Semua field baru hanya ditambahkan ketika visit Kunjungan Rumah baru dibuat:

```text
visit_source
execution_mode
created_by_uid
created_by_name
created_by_roles
petugas_kunjungan_rumah
```

Visit lama tetap dikenali sebagai Door to Door melalui `jalur_pemeriksaan == "Kunjungan Rumah"`. Collection, document ID, dan field lama tidak diubah atau dihapus.

Untuk operator non-dokter, `dokter_pemeriksa` tidak lagi otomatis diisi. Field hanya ditulis otomatis bila role user memuat `dokter`. Field `petugas_pos1` sampai `petugas_pos7` dipertahankan untuk kompatibilitas renderer lama.

## RBAC dan Firestore Rules

Role `door_to_door` hanya ditambahkan ke `MODULE_ACCESS.field`. Role tersebut tidak ditambahkan ke Loket, Pos1-Pos7, Dashboard, Admin/SIMPEG, atau akses staff umum.

Rules emulator membuktikan:

- DTD dapat membaca serta menulis field master pasien yang diperlukan flow;
- DTD dapat membuat visit DTD bila `created_by_uid` sama dengan UID login;
- DTD dapat memperbarui visit DTD tanpa mengganti creator;
- DTD tidak dapat membuat atau memperbarui visit normal;
- DTD tidak dapat menulis `users`, `staff`, konfigurasi admin, atau `public_queue`;
- admin dan dokter mempertahankan operasi existing yang diuji.

Kebijakan read global `visits` tidak diperketat dalam patch ini.

## Public Queue

`createVisitWithRef` menerima opsi backward-compatible:

```js
{ syncPublicQueue: true }
```

Nilai default tetap `true`. Hanya Kunjungan Rumah yang memanggilnya dengan `false`, karena visit tersebut langsung selesai dan tidak perlu tampil pada antrean TV.

## Hasil Pengujian

- Full lint: exit 0, dengan tujuh warning baseline yang tidak terkait patch.
- Unit test: 56/56 lulus pada 15 file.
- Firestore Rules emulator matrix: lulus.
- Restore drill backup ke Firestore Emulator terisolasi: lulus untuk 10 collection dan 21.599 dokumen. Seluruh checksum sumber, jumlah dokumen, document ID, isi data, serta rekonstruksi Timestamp/GeoPoint/Bytes/Reference diverifikasi.
- Production build: lulus.
- `git diff --check`: lulus.
- Screenshot baseline: 38 PNG pada desktop 1440x900, laptop 1366x768, mobile 390x844, dan mobile 360x800.
- Layout report baseline: 0 horizontal overflow.
- Layout report pasca-patch: 0 horizontal overflow.
- Modal SIMPEG pasca-patch direkam pada keempat viewport. Opsi Petugas Door to Door membungkus secara vertikal pada mobile, tetap dapat disentuh, dan tombol Simpan tetap terlihat.
- E2E existing: 8 lulus dan 8 gagal karena assertion teks baseline tidak cocok dengan UI aktual (`AMBIL NOMOR ANTREAN` vs `Ambil Nomor Antrean`, `Edukasi Kesehatan` vs `Edukasi:`). Halaman terkait berhasil render; kegagalan tidak berasal dari diff DTD.

Baseline modal SIMPEG pertama tidak valid sebagai bukti modal karena data staff belum selesai dimuat ketika screenshot diambil. Harness kemudian diperbaiki agar membuka modal melalui tombol Tambah Staff dan menggulir area modal. Keterbatasan baseline ini harus dipertimbangkan saat review visual manual.

## File yang Sengaja Tidak Diubah

- `src/formSchemas.json`
- seluruh `src/Pos1.jsx` sampai `src/Pos7.jsx`
- mapping dan struktur export
- struktur Rapor Digital
- global CSS dan design system
- collection atau field Firestore existing

## Deployment Bertahap

1. Review dan merge branch setelah approval.
2. Deploy rules dan hosting pada window non-puncak.
3. Buat satu akun uji dengan role hanya `door_to_door` melalui prosedur admin resmi.
4. Jalankan satu visit test yang dapat dikenali sesuai SOP.
5. Verifikasi provenance, `dokter_pemeriksa`, duplikasi, permission, Rapor, dan tidak adanya entry public queue.
6. Pilot pada satu petugas, kemudian pantau sebelum rollout tambahan.

## Rollback

Rollback source yang sudah dibagikan dilakukan dengan `git revert` dari commit paling akhir menuju paling awal. Untuk rules, deploy kembali `firestore.rules` dari folder backup valid atau dari tag baseline.

Data tidak perlu direstore untuk masalah UI, route, atau permission yang tidak mengubah data. Bila terbukti ada perubahan data yang salah, identifikasi collection dan rentang waktu terdampak menggunakan manifest, lalu restore hanya subset terdampak pada lingkungan terkontrol. Jangan melakukan full overwrite produksi tanpa bukti kerusakan luas.

## Risiko Tersisa

- Belum ada akun pilot DTD-only untuk uji end-to-end produksi.
- Test browser existing mempunyai assertion teks yang sudah tidak sesuai UI baseline.
- Restore JSON telah dijalankan ke emulator terpisah menggunakan `scripts/verifyFirestoreBackupRestore.mjs`. Utility menolak host non-localhost dan project ID selain `ckg-malimpung-restore-drill`, membersihkan emulator sebelum/sesudah pengujian, serta tidak memiliki jalur tulis ke produksi.
- Permission granular session sengaja ditunda sesuai arahan Safe Patch.
