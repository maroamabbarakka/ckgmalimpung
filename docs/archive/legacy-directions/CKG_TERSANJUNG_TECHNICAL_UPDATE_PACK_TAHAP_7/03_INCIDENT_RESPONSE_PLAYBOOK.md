# INCIDENT RESPONSE PLAYBOOK

## TUJUAN
Panduan saat aplikasi bermasalah ketika pelayanan berjalan.

## LEVEL INSIDEN

### LEVEL 1 - Ringan
Contoh:
- satu halaman error
- satu user gagal login
- export gagal

Tindakan:
- screenshot
- catat user dan waktu
- coba refresh
- laporkan ke admin teknis

### LEVEL 2 - Sedang
Contoh:
- banyak user gagal simpan
- antrean tidak update
- dashboard kosong

Tindakan:
- hentikan update data non-kritis
- gunakan mode pencatatan manual sementara
- cek Firebase status
- cek Firestore Rules terakhir

### LEVEL 3 - Kritis
Contoh:
- data pasien hilang
- data tertukar
- semua user tidak bisa login
- akses data terbuka ke role salah

Tindakan:
- nonaktifkan akses publik bila perlu
- backup kondisi saat ini
- rollback rules/frontend
- restore jika terbukti korup
- buat laporan insiden

## TEMPLATE LAPORAN INSIDEN

```md
Tanggal:
Jam:
Pelapor:
Modul:
Gejala:
User terdampak:
Data terdampak:
Tindakan sementara:
Tindakan permanen:
Status:
```