# SPRINT 4 — Dashboard, Reporting, dan Decision Data

## Tujuan
Mengubah dashboard dari sekadar statistik menjadi alat keputusan operasional dan kesehatan wilayah.

## Pisahkan Dashboard
Buat:
```txt
src/features/dashboard/
  components/
  hooks/
  services/
  widgets/
```

## Widget Wajib
1. Total kunjungan hari ini.
2. Pasien menunggu per pos.
3. Rata-rata waktu layanan.
4. Pos bottleneck.
5. Jumlah hasil abnormal.
6. Distribusi usia.
7. Distribusi desa/wilayah.
8. Cakupan CKG.
9. Pasien perlu tindak lanjut.
10. Aktivitas operator.

## Data Aggregation
Jangan query ribuan pasien langsung untuk dashboard.

Buat collection agregasi:
```txt
dailyStats/{yyyy-mm-dd}
monthlyStats/{yyyy-mm}
villageStats/{villageId}
operatorStats/{yyyy-mm-dd_userId}
```

## Service
Buat:
```txt
src/features/dashboard/services/dashboardStatsService.js
```

Fungsi:
- `getTodayStats()`
- `getQueueStats()`
- `getVillageStats()`
- `getAbnormalStats()`
- `getOperatorStats()`

## Report Export
Standarkan export:
- nama file jelas,
- tanggal otomatis,
- filter tercetak di header,
- footer memuat waktu export dan operator,
- jangan export data sensitif yang tidak diminta.

## Checklist
- [ ] Dashboard dipisahkan dari file besar.
- [ ] Widget kecil dibuat reusable.
- [ ] Query dashboard tidak membaca semua pasien.
- [ ] Export punya metadata.
- [ ] Filter tanggal/wilayah tersedia.
- [ ] Loading/empty/error state tersedia.

## Acceptance Criteria
- Dashboard tetap cepat saat data besar.
- Admin bisa melihat bottleneck pos.
- Laporan export dapat dipahami tanpa membuka aplikasi.
