import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { assertCanTransition } from './workflowGuards';

export async function updateVisitStatus({ visitId, currentStatus, nextStatus, actor }) {
  assertCanTransition(currentStatus, nextStatus);

  await updateDoc(doc(db, 'visits', visitId), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
    updatedBy: actor?.username || null,
    updatedByName: actor?.nama || null,
    [`statusHistory.${nextStatus}`]: {
      at: new Date().toISOString(),
      by: actor?.username || null,
      name: actor?.nama || null,
    },
  });
}

export function inferStatusFromOldVisit(visit = {}) {
  if (visit.finalizedAt || visit.status_antrian === 'Selesai') return 'FINALIZED';
  if (visit.pos7) return 'POS7_IN_PROGRESS';
  if (visit.pos6) return 'POS6_COMPLETE';
  if (visit.pos5) return 'POS5_COMPLETE';
  if (visit.pos4) return 'POS4_COMPLETE';
  if (visit.pos3) return 'POS3_COMPLETE';
  if (visit.pos2) return 'POS2_COMPLETE';
  if (visit.pos1 || visit.nama) return 'POS1_COMPLETE';
  return 'REGISTERED';
}
