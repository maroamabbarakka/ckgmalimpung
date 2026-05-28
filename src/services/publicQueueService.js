import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { STATUS_MAPPING } from '../utils/constants';
import { getQueueStatusKey } from '../utils/queueStatus';

const EMPTY_QUEUE_GRID = {
  pos1: [],
  pos2: [],
  pos3: [],
  pos4: [],
  pos5: [],
  pos6: [],
  pos7: []
};

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
}

function sanitizePublicQueuePayload(visit = {}) {
  const statusAntrian = visit.status_antrian || visit.queueStatus || '';
  const payload = {
    updatedAt: serverTimestamp()
  };

  if (visit.nomor_antrian || visit.queueNumber) {
    payload.nomor_antrian = visit.nomor_antrian || visit.queueNumber;
  }

  if (statusAntrian) {
    payload.status_antrian = statusAntrian;
    payload.pos_key = getQueueStatusKey(statusAntrian) || '';
  }

  if (visit.waktu_ambil_tiket || visit.createdAt) {
    payload.waktu_ambil_tiket = visit.waktu_ambil_tiket || visit.createdAt;
  }

  return payload;
}

export async function upsertPublicQueueFromVisit(visitId, visit = {}) {
  if (!visitId) return;
  await setDoc(doc(db, 'public_queue', visitId), sanitizePublicQueuePayload(visit), { merge: true });
}

export function subscribePublicTvQueueGrid(onChange, onError) {
  return onSnapshot(collection(db, 'public_queue'), (snapshot) => {
    const grid = {
      pos1: [],
      pos2: [],
      pos3: [],
      pos4: [],
      pos5: [],
      pos6: [],
      pos7: []
    };

    snapshot.forEach((queueDoc) => {
      const item = { id: queueDoc.id, ...queueDoc.data() };
      if (!item.nomor_antrian || item.status_antrian === STATUS_MAPPING.SELESAI) return;

      const key = getQueueStatusKey(item.status_antrian);
      if (key === 'POS1') grid.pos1.push(item);
      if (key === 'POS2') grid.pos2.push(item);
      if (key === 'POS3') grid.pos3.push(item);
      if (key === 'POS4') grid.pos4.push(item);
      if (key === 'POS5') grid.pos5.push(item);
      if (key === 'POS6') grid.pos6.push(item);
      if (key === 'POS7') grid.pos7.push(item);
    });

    Object.values(grid).forEach((items) => {
      items.sort((a, b) => toMillis(a.waktu_ambil_tiket) - toMillis(b.waktu_ambil_tiket));
    });

    onChange(grid);
  }, onError);
}

export function emptyPublicQueueGrid() {
  return { ...EMPTY_QUEUE_GRID };
}
