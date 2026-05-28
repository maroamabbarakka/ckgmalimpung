# POS WORKFLOW SMART UX

## TUJUAN
Pos 1–7 harus terasa seperti alur kerja terpandu, bukan kumpulan form terpisah.

## STRUKTUR HALAMAN POS
Setiap halaman pos wajib punya:
1. PatientSummaryCard
2. WorkflowStepper
3. Section form pos aktif
4. Validation panel
5. BottomActionBar / sticky action
6. Status autosave/sync

## WORKFLOW STEPPER

```txt
Loket → Pos 1 → Pos 2 → Pos 3 → Pos 4 → Pos 5 → Pos 6 → Pos 7 → Rapor
```

Status:
- belum dimulai
- aktif
- selesai
- bermasalah
- dilewati dengan alasan

## VALIDATION PANEL
Sebelum lanjut tampilkan checklist:
- Identitas lengkap
- Pemeriksaan wajib terisi
- Nilai tidak ekstrem
- Catatan petugas jika ada abnormal
- Draft sudah sync

## BUTTON CONSISTENCY
Tombol utama:
- Simpan Draft
- Simpan & Lanjut
- Tandai Selesai Pos
- Kembali ke Antrean

Jangan gunakan:
- Submit
- OK
- Done

## LOCK UX
Jika pasien sedang diedit user lain:
- tampilkan nama petugas
- pos yang sedang membuka
- waktu lock
- tombol "Minta Ambil Alih" khusus admin/supervisor

## ACCEPTANCE
- Pasien tidak bisa lompat pos tanpa alasan.
- Operator tahu field mana yang belum lengkap.
- Pasien aktif selalu terlihat.