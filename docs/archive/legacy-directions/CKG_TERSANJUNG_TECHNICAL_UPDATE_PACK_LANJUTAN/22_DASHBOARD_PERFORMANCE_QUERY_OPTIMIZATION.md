# 22 — Dashboard Performance dan Query Optimization

## Target
Dashboard cepat meskipun data kunjungan sudah besar.

## Masalah yang harus dihindari
- Membaca semua pasien untuk hitung statistik.
- Membaca semua visits setiap render.
- Query tanpa filter tanggal.
- Chart menghitung ulang setiap state kecil berubah.

## Prinsip dashboard
1. Dashboard harian baca data harian.
2. Dashboard bulanan baca agregat bulanan.
3. Statistik besar disimpan di `daily_stats`.
4. Tabel besar pakai pagination atau virtualized list.

## Service dashboard
Buat:
```txt
src/features/dashboard/dashboardService.js
```

Fungsi:
```js
getTodayStats(date)
subscribeQueueStats(date, callback)
getVisitsByDate(date, filters)
getRiskDistribution(startDate, endDate)
getOfficerProductivity(startDate, endDate)
```

## Daily stats schema
```js
{
  date: 'YYYY-MM-DD',
  totalRegistered: 0,
  totalFinalized: 0,
  byStatus: {},
  byVillage: {},
  byAgeCategory: {},
  riskFlags: {},
  posBottleneck: {},
  updatedAt
}
```

## Update stats
Pilihan aman:
- fase awal: update stats saat finalisasi;
- fase lanjut: Cloud Function trigger.

## UI optimization
- gunakan lazy load chart;
- gunakan memo untuk data chart;
- gunakan skeleton loading;
- gunakan filter tanggal default hari ini;
- jangan auto-load rentang 1 tahun.

## Acceptance criteria
- Dashboard buka di bawah 3 detik pada koneksi normal.
- Query dashboard tidak membaca seluruh collection visits.
- Filter tanggal tersedia.
- Jika data kosong, tampilkan empty state jelas.
