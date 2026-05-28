# 19 — Patient Workflow State Machine

## Target
Pasien tidak boleh diproses secara acak tanpa status yang jelas.

## Status standar
```js
export const VISIT_STATUS = {
  REGISTERED: 'REGISTERED',
  POS1_IN_PROGRESS: 'POS1_IN_PROGRESS',
  POS1_COMPLETE: 'POS1_COMPLETE',
  POS2_IN_PROGRESS: 'POS2_IN_PROGRESS',
  POS2_COMPLETE: 'POS2_COMPLETE',
  POS3_IN_PROGRESS: 'POS3_IN_PROGRESS',
  POS3_COMPLETE: 'POS3_COMPLETE',
  POS4_IN_PROGRESS: 'POS4_IN_PROGRESS',
  POS4_COMPLETE: 'POS4_COMPLETE',
  POS5_IN_PROGRESS: 'POS5_IN_PROGRESS',
  POS5_COMPLETE: 'POS5_COMPLETE',
  POS6_IN_PROGRESS: 'POS6_IN_PROGRESS',
  POS6_COMPLETE: 'POS6_COMPLETE',
  POS7_IN_PROGRESS: 'POS7_IN_PROGRESS',
  POS7_COMPLETE: 'POS7_COMPLETE',
  READY_TO_FINALIZE: 'READY_TO_FINALIZE',
  FINALIZED: 'FINALIZED',
  CANCELLED: 'CANCELLED'
};
```

## File wajib
```txt
src/workflow/visitStatus.js
src/workflow/visitTransitions.js
src/workflow/posRequirements.js
```

## Fungsi wajib
```js
canStartPos(visit, posId, user)
canCompletePos(visit, posId, posData)
getNextVisitStatus(currentStatus, action)
getMissingRequirements(visit, posId)
```

## Aturan transisi minimum
| Dari | Aksi | Ke |
|---|---|---|
| REGISTERED | start_pos1 | POS1_IN_PROGRESS |
| POS1_IN_PROGRESS | complete_pos1 | POS1_COMPLETE |
| POS1_COMPLETE | start_pos2 | POS2_IN_PROGRESS |
| POS2_IN_PROGRESS | complete_pos2 | POS2_COMPLETE |
| POS7_COMPLETE | mark_ready | READY_TO_FINALIZE |
| READY_TO_FINALIZE | finalize | FINALIZED |

## Lock pasien aktif
Saat petugas membuka pasien:
```js
{
  activeOfficerId: uid,
  activeOfficerName: name,
  activePos: 'pos1',
  activeSince: serverTimestamp()
}
```

Jika petugas lain membuka:
- tampilkan warning;
- boleh takeover hanya admin/superadmin;
- takeover wajib dicatat audit log.

## Tombol UI
Untuk setiap Pos:
- `Mulai Pemeriksaan`
- `Simpan Draft`
- `Validasi & Selesai Pos`
- `Kembalikan ke Draft`

## Acceptance criteria
- Pasien tidak bisa finalisasi jika Pos wajib belum valid.
- Status pasien selalu berubah lewat helper workflow.
- Semua perubahan status masuk audit log.
- UI menampilkan status dengan bahasa manusia, bukan kode teknis.
