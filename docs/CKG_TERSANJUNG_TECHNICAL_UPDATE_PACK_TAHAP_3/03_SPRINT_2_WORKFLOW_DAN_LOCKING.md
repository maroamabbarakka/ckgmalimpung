# SPRINT 2 — Workflow State Machine dan Locking Pasien

## Tujuan
Mencegah pasien lompat alur, data setengah jadi, dan edit ganda oleh dua operator.

## Status Workflow Standar
Gunakan status berikut:

```txt
REGISTERED
POS1_IN_PROGRESS
POS1_COMPLETE
POS2_IN_PROGRESS
POS2_COMPLETE
POS3_IN_PROGRESS
POS3_COMPLETE
POS4_IN_PROGRESS
POS4_COMPLETE
POS5_IN_PROGRESS
POS5_COMPLETE
POS6_IN_PROGRESS
POS6_COMPLETE
POS7_IN_PROGRESS
POS7_COMPLETE
READY_FOR_REPORT
FINALIZED
CANCELLED
```

## Buat File
```txt
src/features/workflow/
  workflowStates.js
  workflowTransitions.js
  workflowGuards.js
  patientLock.js
```

## Aturan Transisi
Contoh:
```js
const transitions = {
  REGISTERED: ['POS1_IN_PROGRESS'],
  POS1_IN_PROGRESS: ['POS1_COMPLETE'],
  POS1_COMPLETE: ['POS2_IN_PROGRESS', 'READY_FOR_REPORT'],
}
```

Jangan biarkan komponen pos menentukan transisi sendiri.

## Locking Pasien
Tambahkan field pada dokumen visit/patient aktif:
```js
lock: {
  lockedBy: userId,
  lockedByName: displayName,
  lockedAt: serverTimestamp(),
  expiresAt: timestampPlusMinutes(15),
  pos: 'POS1'
}
```

## Perilaku Lock
- Saat operator membuka pasien, lock dibuat.
- Jika pasien sudah dilock orang lain, tampilkan warning.
- Admin boleh force unlock.
- Lock otomatis dianggap expired setelah 15 menit.
- Simpan/keluar halaman melepas lock.

## Validasi Finalisasi
Sebelum `FINALIZED`:
- data identitas minimal lengkap,
- pos wajib sesuai kategori usia selesai,
- hasil abnormal ditandai,
- rapor siap dicetak,
- tidak ada draft pending.

## UI Yang Wajib Ada
Di halaman pos tampilkan:
- nama pasien,
- umur,
- status workflow,
- siapa yang sedang memproses,
- tombol lanjut/simpan/keluar,
- indikator lock.

## Checklist
- [ ] File workflow dibuat.
- [ ] Semua pos memakai helper transisi.
- [ ] Lock pasien aktif berjalan.
- [ ] Force unlock admin tersedia.
- [ ] Finalisasi punya validasi.
- [ ] Audit log untuk lock/unlock/finalize.

## Acceptance Criteria
- Pasien tidak bisa lompat dari REGISTERED ke FINALIZED.
- Dua operator tidak bisa mengedit pasien yang sama tanpa warning.
- Lock expired tidak membuat pasien macet.
