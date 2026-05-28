# 03 — Workflow Engine Pos CKG

## Tujuan

Mencegah data pasien lompat alur, setengah lengkap, salah finalisasi, atau sulit dilacak.

## Masalah Yang Harus Dicegah

- Pasien langsung masuk pos akhir tanpa data awal lengkap.
- Pos dianggap selesai padahal field wajib kosong.
- Rapor tercetak sebelum dokter validasi.
- Dua petugas mengedit pasien yang sama tanpa warning.
- Statistik dashboard menghitung data yang belum selesai.

## Status Workflow Standar

Buat file:

```txt
src/features/workflow/workflowStatus.js
```

Isi:

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
  FINALIZED: 'FINALIZED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_LABEL = {
  REGISTERED: 'Terdaftar',
  POS1_IN_PROGRESS: 'Pos 1 diproses',
  POS1_COMPLETE: 'Pos 1 selesai',
  POS2_IN_PROGRESS: 'Pos 2 diproses',
  POS2_COMPLETE: 'Pos 2 selesai',
  POS3_IN_PROGRESS: 'Pos 3 diproses',
  POS3_COMPLETE: 'Pos 3 selesai',
  POS4_IN_PROGRESS: 'Pos 4 diproses',
  POS4_COMPLETE: 'Pos 4 selesai',
  POS5_IN_PROGRESS: 'Pos 5 diproses',
  POS5_COMPLETE: 'Pos 5 selesai',
  POS6_IN_PROGRESS: 'Pos 6 diproses',
  POS6_COMPLETE: 'Pos 6 selesai',
  POS7_IN_PROGRESS: 'Pos 7 diproses',
  FINALIZED: 'Selesai final',
  CANCELLED: 'Dibatalkan',
};
```

---

## Transisi Status Yang Diizinkan

Buat:

```txt
src/features/workflow/workflowGuards.js
```

```js
import { VISIT_STATUS } from './workflowStatus';

export const ALLOWED_TRANSITIONS = {
  [VISIT_STATUS.REGISTERED]: [VISIT_STATUS.POS1_IN_PROGRESS, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.POS1_IN_PROGRESS]: [VISIT_STATUS.POS1_COMPLETE, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.POS1_COMPLETE]: [VISIT_STATUS.POS2_IN_PROGRESS],
  [VISIT_STATUS.POS2_IN_PROGRESS]: [VISIT_STATUS.POS2_COMPLETE],
  [VISIT_STATUS.POS2_COMPLETE]: [VISIT_STATUS.POS3_IN_PROGRESS],
  [VISIT_STATUS.POS3_IN_PROGRESS]: [VISIT_STATUS.POS3_COMPLETE],
  [VISIT_STATUS.POS3_COMPLETE]: [VISIT_STATUS.POS4_IN_PROGRESS],
  [VISIT_STATUS.POS4_IN_PROGRESS]: [VISIT_STATUS.POS4_COMPLETE],
  [VISIT_STATUS.POS4_COMPLETE]: [VISIT_STATUS.POS5_IN_PROGRESS],
  [VISIT_STATUS.POS5_IN_PROGRESS]: [VISIT_STATUS.POS5_COMPLETE],
  [VISIT_STATUS.POS5_COMPLETE]: [VISIT_STATUS.POS6_IN_PROGRESS],
  [VISIT_STATUS.POS6_IN_PROGRESS]: [VISIT_STATUS.POS6_COMPLETE],
  [VISIT_STATUS.POS6_COMPLETE]: [VISIT_STATUS.POS7_IN_PROGRESS],
  [VISIT_STATUS.POS7_IN_PROGRESS]: [VISIT_STATUS.FINALIZED],
  [VISIT_STATUS.FINALIZED]: [],
  [VISIT_STATUS.CANCELLED]: [],
};

export function canTransition(fromStatus, toStatus) {
  return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
}

export function assertCanTransition(fromStatus, toStatus) {
  if (!canTransition(fromStatus, toStatus)) {
    throw new Error(`Transisi status tidak valid: ${fromStatus} -> ${toStatus}`);
  }
}
```

---

## Workflow Service

Buat:

```txt
src/features/workflow/workflowService.js
```

```js
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { assertCanTransition } from './workflowGuards';

export async function updateVisitStatus({ visitId, currentStatus, nextStatus, actor }) {
  assertCanTransition(currentStatus, nextStatus);

  const ref = doc(db, 'visits', visitId);

  await updateDoc(ref, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
    lastUpdatedBy: actor?.username || null,
    lastUpdatedByName: actor?.nama || null,
    [`statusHistory.${nextStatus}`]: {
      at: new Date().toISOString(),
      by: actor?.username || null,
      name: actor?.nama || null,
    },
  });
}
```

Jika collection aktual bukan `visits`, sesuaikan nama.

---

## Lock Pasien Saat Diproses

Tambahkan field di visit:

```js
lockedBy: {
  staffId,
  username,
  nama,
  role,
  lockedAt
},
lockedModule: 'POS2',
lockExpiresAt
```

Aturan:
- Saat petugas membuka pasien untuk diedit, set lock.
- Jika sudah dikunci petugas lain, tampilkan warning.
- Lock otomatis kadaluarsa 10 menit tanpa update.
- Tombol "Ambil Alih" hanya untuk admin/dokter koordinator.

---

## Field Wajib Per Pos

Buat file:

```txt
src/features/workflow/requiredFields.js
```

Contoh:

```js
export const REQUIRED_FIELDS_BY_POS = {
  pos1: ['nik', 'nama', 'tanggalLahir', 'jenisKelamin', 'desa'],
  pos2: ['tekananDarahSistolik', 'tekananDarahDiastolik', 'beratBadan', 'tinggiBadan'],
  pos3: [],
  pos4: [],
  pos5: [],
  pos6: ['diagnosisAwal'],
  pos7: ['validasiDokter'],
};

export function validateRequiredFields(data, posKey) {
  const required = REQUIRED_FIELDS_BY_POS[posKey] || [];
  return required
    .filter((field) => data[field] === undefined || data[field] === null || data[field] === '')
    .map((field) => ({
      field,
      message: `${field} wajib diisi`,
    }));
}
```

---

## Tombol Selesai Pos

Setiap pos wajib punya pola:
1. Validate required fields.
2. Save data.
3. Update status.
4. Write audit log.
5. Move queue.

Pseudo:

```js
async function handleCompletePos() {
  const errors = validateRequiredFields(formData, 'pos2');
  if (errors.length > 0) {
    setValidationErrors(errors);
    return;
  }

  await savePos2Data(visitId, formData);
  await updateVisitStatus({
    visitId,
    currentStatus: visit.status,
    nextStatus: VISIT_STATUS.POS2_COMPLETE,
    actor: currentUser,
  });
  await writeAuditLog({ action: 'POS2_COMPLETE', visitId, patientId });
}
```

---

## Queue Filtering Per Pos

Pos 2 hanya menampilkan:
- `POS1_COMPLETE`
- `POS2_IN_PROGRESS`

Pos 3 hanya menampilkan:
- `POS2_COMPLETE`
- `POS3_IN_PROGRESS`

Dan seterusnya.

Jangan tampilkan semua pasien di semua pos.

---

## Rapor Digital

Rapor hanya boleh dicetak jika:
- status minimal `POS6_COMPLETE`, atau
- status `FINALIZED`, sesuai kebijakan.
- Untuk rapor final resmi, wajib `FINALIZED`.

Tambahkan guard:

```js
export function canPrintFinalReport(visit) {
  return visit?.status === 'FINALIZED';
}
```

---

## UI Status

Setiap kartu pasien antrean harus menampilkan:
- Nama.
- NIK/No RM.
- Umur.
- Status saat ini.
- Pos aktif.
- Locked by siapa.
- Lama menunggu.

---

## Migration Data Lama

Karena data lama mungkin belum punya `status`, buat migrasi ringan:

```js
function inferStatusFromOldVisit(visit) {
  if (visit.finalizedAt) return 'FINALIZED';
  if (visit.pos7) return 'POS7_IN_PROGRESS';
  if (visit.pos6) return 'POS6_COMPLETE';
  if (visit.pos5) return 'POS5_COMPLETE';
  if (visit.pos4) return 'POS4_COMPLETE';
  if (visit.pos3) return 'POS3_COMPLETE';
  if (visit.pos2) return 'POS2_COMPLETE';
  if (visit.pos1) return 'POS1_COMPLETE';
  return 'REGISTERED';
}
```

Jangan langsung overwrite massal tanpa backup.

---

## Testing

Manual:
1. Buat pasien baru di Loket.
2. Pastikan status `REGISTERED`.
3. Mulai Pos1.
4. Pastikan status `POS1_IN_PROGRESS`.
5. Simpan selesai Pos1.
6. Pastikan muncul di Pos2.
7. Coba akses langsung Pos5.
8. Harus ditolak atau tidak muncul.
9. Finalisasi di Pos7.
10. Pastikan rapor final bisa dicetak.
11. Edit pasien final.
12. Harus ada warning dan audit log.

## Definition of Done

- Ada file status workflow.
- Ada guard transisi.
- Minimal Pos1 dan Pos2 memakai workflow.
- Queue tiap pos sudah difilter.
- Rapor final punya guard status.
- Build sukses.
