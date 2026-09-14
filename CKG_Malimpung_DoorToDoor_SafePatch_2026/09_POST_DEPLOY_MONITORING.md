# 09 — Post-Deploy Monitoring

## Tujuan
Mendeteksi regresi yang tidak muncul pada test lokal.

## Periode Monitoring
Minimum:
- segera setelah deploy;
- setelah kunjungan DTD pertama;
- setelah beberapa user DTD aktif;
- setelah satu siklus export/rapor;
- setelah penggunaan Pos 1–7 pada hari yang sama.

## Indikator P0
Pantau:

### Authentication/RBAC
- login gagal;
- role tidak ter-refresh setelah perubahan SIMPEG;
- unauthorized user melihat menu;
- authorized DTD terkena permission denied.

### Firestore
- `permission-denied`;
- failed write;
- duplicate patient;
- duplicate visit;
- missing created_by;
- visit DTD tanpa marker yang diharapkan.

### Clinical Semantics
- `dokter_pemeriksa` berisi nama non-dokter;
- actor audit tidak sesuai user login;
- petugas Pos/laporan berubah tanpa alasan.

### UI
- modal SIMPEG overflow;
- checkbox role tidak dapat diklik;
- mobile form terpotong;
- bottom navigation overlap;
- blank screen pada route denied.

### Workflow Existing
- Loket terganggu;
- Pos 1–7 gagal update;
- TV queue tidak update;
- Rapor error;
- export berubah.

## Sampling Data Harian Awal
Ambil sampling visit DTD baru dan cek:

| Field | Expected |
|---|---|
| jalur_pemeriksaan | Kunjungan Rumah |
| visit_source | door_to_door jika diterapkan |
| created_by_uid | UID operator |
| created_by_name | nama operator |
| created_by_roles | memuat door_to_door |
| dokter_pemeriksa | hanya dokter / kosong bila non-dokter |

## Audit Log
Pastikan event DTD menyebut actor yang benar, bukan Kepala Puskesmas jika yang bekerja adalah petugas lain.

## Alert Manual
Selama pilot, petugas diminta segera melaporkan:

- tombol Simpan tidak bekerja;
- data pasien hilang setelah refresh;
- hasil input tidak muncul;
- pesan permission;
- UI berubah/terpotong;
- akun melihat menu yang tidak seharusnya.

## Exit dari Pilot
Rollout penuh baru boleh dilakukan jika:

- tidak ada incident P0;
- data provenance benar;
- output laporan normal;
- role existing normal;
- minimal beberapa transaksi DTD sukses end-to-end;
- rollback tidak diperlukan selama periode pilot yang ditentukan pengelola.
