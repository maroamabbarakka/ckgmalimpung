# 07 — Dashboard Analitik dan Decision Dashboard

## Tujuan

Dashboard tidak hanya menampilkan angka, tetapi membantu keputusan layanan kesehatan.

## Masalah Saat Ini

Dashboard cenderung operasional:
- jumlah pasien,
- antrean,
- selesai,
- export.

Target berikutnya:
- indikator risiko,
- cakupan wilayah,
- bottleneck pos,
- kualitas data,
- tren penyakit/temuan.

---

## Struktur Dashboard Baru

```txt
DashboardPage
  DashboardFilters
  KpiCards
  OperationalFlow
  RiskSummary
  VillageCoverage
  BottleneckWidget
  DataQualityWidget
  ExportPanel
  PatientTable
```

---

## Filter Wajib

Buat filter:
- Tanggal mulai.
- Tanggal akhir.
- Desa.
- Jenis kelamin.
- Kelompok umur.
- Status workflow.
- Risiko/temuan.
- Petugas.

State filter harus satu sumber:

```js
const defaultFilters = {
  startDate: today(),
  endDate: today(),
  desa: 'ALL',
  jenisKelamin: 'ALL',
  kelompokUmur: 'ALL',
  status: 'ALL',
  risk: 'ALL',
  petugas: 'ALL',
};
```

---

## KPI Cards

Minimal:
1. Total terdaftar.
2. Sedang diproses.
3. Selesai final.
4. Batal.
5. Risiko tinggi.
6. Rata-rata durasi layanan.
7. Data belum lengkap.
8. Export-ready.

---

## Dashboard Service

Buat:

```txt
src/features/dashboard/dashboardService.js
```

Fungsi:

```js
export function calculateDashboardMetrics(visits) {
  return {
    total: visits.length,
    finalized: visits.filter((v) => v.status === 'FINALIZED').length,
    inProgress: visits.filter((v) => String(v.status || '').includes('IN_PROGRESS')).length,
    cancelled: visits.filter((v) => v.status === 'CANCELLED').length,
    highRisk: visits.filter((v) => v.riskLevel === 'HIGH').length,
    incomplete: visits.filter((v) => v.dataQuality?.isComplete === false).length,
  };
}
```

---

## Bottleneck Pos

Hitung:
- jumlah pasien per status,
- lama rata-rata per pos,
- pos dengan antrean paling banyak.

```js
export function calculateBottleneck(visits) {
  const byStatus = {};

  for (const visit of visits) {
    const status = visit.status || 'UNKNOWN';
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  return byStatus;
}
```

UI:
- Tampilkan bar sederhana.
- Highlight pos terpadat.
- Beri label: "Perlu perhatian".

---

## Data Quality Widget

Cek:
- NIK kosong.
- Tanggal lahir kosong.
- Desa kosong.
- Status workflow kosong.
- Pos final tapi diagnosis kosong.
- Rapor final tapi validasi dokter kosong.

Output:
```js
{
  missingNik: 3,
  missingBirthDate: 2,
  missingVillage: 7,
  invalidWorkflow: 1,
  finalizedWithoutDoctor: 0
}
```

---

## Risk Summary

Jika data tersedia, tampilkan:
- hipertensi,
- diabetes/gula darah tinggi,
- obesitas,
- anemia,
- risiko merokok,
- risiko lansia,
- risiko ibu hamil.

Jangan buat diagnosis otomatis tanpa dasar. Gunakan label:
```txt
"indikasi risiko berdasarkan input"
```

---

## Village Coverage

Tampilkan:
- desa,
- jumlah pasien,
- selesai,
- risiko tinggi,
- data belum lengkap.

Untuk awal cukup tabel. Chart bisa menyusul.

---

## Export Panel

Export harus mengikuti filter aktif.

Tombol:
- Export Excel data final.
- Export Excel termasuk proses.
- Export PDF ringkasan.
- Export per desa.

Sebelum export tampilkan modal:
```txt
Data yang akan diekspor:
- Total sesuai filter: 124
- Final: 103
- Dalam proses: 21
- Data belum lengkap: 8
```

---

## Patient Table

Kolom:
- No.
- Tanggal.
- Nama.
- NIK tersamarkan.
- Desa.
- Umur.
- Status.
- Risiko.
- Pos terakhir.
- Aksi.

NIK ditampilkan:
```txt
7315********1234
```

Jangan tampilkan NIK penuh di dashboard umum.

---

## Performance

Jika data besar:
- Jangan render semua row.
- Tambahkan pagination.
- Default 25 row.
- Search debounce 300ms.

---

## Dashboard Mobile

Mobile:
- KPI card 2 kolom.
- Chart minimal.
- Table berubah menjadi card.
- Filter jadi drawer.

Jangan paksa grid dashboard desktop ke HP.

---

## Testing

1. Filter hari ini.
2. Cek total sesuai data.
3. Filter desa.
4. Export.
5. Pastikan export mengikuti filter.
6. Cek pasien belum final tidak masuk export final.
7. Buka mobile 390px.
8. Tidak horizontal scroll.

## Definition of Done

- Dashboard punya filter terpusat.
- KPI dihitung dari service.
- Export mengikuti filter.
- Ada data quality widget.
- Mobile dashboard ringkas.
