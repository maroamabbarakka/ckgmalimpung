# 14 — Gigi & Mulut dan Status Kelengkapan Pemeriksaan: Safe Patch Terpisah

## Status
Patch ini adalah **P1 terpisah** dan tidak boleh digabung ke commit inti RBAC Door to Door apabila patch inti belum stabil.

## Tujuan
Menampilkan indikator/card **Gigi & Mulut** serta membedakan status workflow dengan status kelengkapan pemeriksaan tanpa mengubah schema klinis existing.

## Prinsip Utama

- Jangan membuat collection baru hanya untuk card Gigi & Mulut.
- Jangan menulis ulang data klinis lama.
- Jangan menambahkan helper UI ke Firestore.
- Jangan mengubah `formSchemas.json`.
- Jangan mengubah output export resmi.
- Jangan menganggap `status_antrian = Selesai` berarti semua pemeriksaan klinis lengkap.

## Source of Truth
Gunakan data existing yang sudah tersimpan pada struktur visit, terutama data skrining gigi yang sudah berada di area `pos2.skrining_gigi` sesuai kategori pasien.

Card Gigi & Mulut harus berupa **derived/read-only presentation** dari data yang sudah ada.

## Status yang Direkomendasikan
Jangan memakai boolean sederhana jika tidak cukup. Gunakan status derived di UI:

```text
Sudah diperiksa
Belum diperiksa
Tidak berlaku
Data legacy/perlu verifikasi
```

### Sudah diperiksa
Jika field skrining gigi yang applicable untuk kategori pasien mempunyai jawaban valid sesuai schema existing.

### Belum diperiksa
Jika pemeriksaan gigi applicable tetapi field wajib/representatif belum memiliki jawaban.

### Tidak berlaku
Jika berdasarkan kategori usia/gender/schema pemeriksaan tersebut memang tidak applicable.

### Data legacy/perlu verifikasi
Jika record lama mempunyai struktur yang tidak cukup untuk memastikan status dengan aman.

## Jangan Gunakan Status Antrean sebagai Proxy
Dilarang membuat logic:

```text
status_antrian == Selesai
→ Gigi & Mulut = Sudah diperiksa
```

Karena status antrean menggambarkan workflow, bukan kelengkapan semua elemen klinis.

## Implementasi Aman
Buat helper pure/read-only, misalnya secara konseptual:

```text
getDentalScreeningStatus(visit, patientCategory)
```

Helper:
- hanya membaca data;
- tidak melakukan Firestore write;
- tidak melakukan mutation object;
- tidak mengubah field lama;
- memiliki unit test untuk kategori pasien yang berbeda.

## UI
Card baru harus menggunakan komponen/style dashboard existing.

Dilarang:
- redesign dashboard;
- mengubah grid global secara besar;
- mengubah breakpoint global;
- membuat card menyebabkan overflow mobile.

Jika ruang tidak cukup, lakukan penyesuaian lokal minimal dan screenshot comparison.

## Test Minimum

- [ ] visit DTD baru dengan skrining gigi terisi → status sesuai.
- [ ] visit normal dengan skrining gigi terisi → status sesuai.
- [ ] visit applicable tetapi kosong → Belum diperiksa.
- [ ] kategori tidak applicable → Tidak berlaku.
- [ ] legacy record tanpa field baru → tidak crash.
- [ ] tidak ada Firestore write saat dashboard dibuka.
- [ ] export tidak berubah.
- [ ] rapor tidak berubah kecuali memang sebelumnya membaca field yang sama.
- [ ] UI mobile tidak overflow.

## Acceptance Criteria
Fitur dianggap aman bila hanya menambah lapisan interpretasi/presentasi atas data existing dan tidak menyebabkan perubahan satu byte pun pada record lama di Firestore.
