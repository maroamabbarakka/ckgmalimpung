import { addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getQueueStatusValues, STATUS_MAPPING } from '../utils/constants';
import { getQueueStatusKey } from '../utils/queueStatus';
import { VISIT_STATUS } from '../features/workflow/workflowStatus';
import { buildVisitLock, canClaimVisit } from '../features/workflow/visitLock';
import { upsertPublicQueueFromVisit } from './publicQueueService';

export async function claimVisitForStaff({ visitId, staffName = 'Petugas', isAdmin = false, actor = null, module = '', workflowStatus = null }) {
  let latestVisit = null;

  await runTransaction(db, async (transaction) => {
    const docRef = doc(db, 'visits', visitId);
    const docSnap = await transaction.get(docRef);
    if (!docSnap.exists()) throw new Error('Data tidak ditemukan!');

    const data = docSnap.data();
    if (!canClaimVisit({
      currentLock: data.lock,
      currentStaffName: data.petugas_aktif,
      nextStaffName: staffName,
      isAdmin
    })) {
      throw new Error(`Pasien sedang ditangani oleh ${data.petugas_aktif || data.lock?.byName || 'petugas lain'}`);
    }

    latestVisit = { id: docSnap.id, ...data };
    transaction.update(docRef, {
      petugas_aktif: staffName,
      lockedBy: {
        staffId: actor?.uid || actor?.staffId || null,
        username: actor?.username || null,
        nama: actor?.nama || staffName,
        role: actor?.roles || []
      },
      lockedModule: module || null,
      lock: buildVisitLock({
        staffId: actor?.uid || actor?.staffId || null,
        username: actor?.username || '',
        nama: actor?.nama || staffName,
        role: actor?.roles || [],
        module
      }),
      ...(workflowStatus ? { status: workflowStatus } : {})
    });
  });

  return latestVisit;
}

export async function createTvQueueCall({ pos, queueNumber, speechText }) {
  await addDoc(collection(db, 'panggilan_tv'), {
    pos,
    identitas_layar: queueNumber,
    teks_suara: speechText,
    waktu: serverTimestamp()
  });
}

export function subscribeLatestTvQueueCall(onChange) {
  const q = query(collection(db, 'panggilan_tv'), orderBy('waktu', 'desc'), limit(1));
  return onSnapshot(q, onChange);
}

export function subscribeQueueByStatus(statusKey, onChange, onError) {
  const q = query(collection(db, 'visits'), where('status_antrian', 'in', getQueueStatusValues(statusKey)));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = [];
      snapshot.forEach((visitDoc) => data.push({ id: visitDoc.id, ...visitDoc.data() }));
      data.sort((a, b) => (a.waktu_ambil_tiket?.toMillis() || 0) - (b.waktu_ambil_tiket?.toMillis() || 0));
      onChange(data);
    },
    onError
  );
}

export function subscribeTvQueueGrid(onChange, onError) {
  const q = query(collection(db, 'visits'), where('status_antrian', '!=', STATUS_MAPPING.SELESAI));

  return onSnapshot(q, (snapshot) => {
    const data = [];
    snapshot.forEach((visitDoc) => data.push(visitDoc.data()));
    data.sort((a, b) => (a.waktu_ambil_tiket?.toMillis() || 0) - (b.waktu_ambil_tiket?.toMillis() || 0));

    onChange({
      pos1: data.filter((visit) => getQueueStatusKey(visit.status_antrian) === 'POS1'),
      pos2: data.filter((visit) => getQueueStatusKey(visit.status_antrian) === 'POS2'),
      pos3: data.filter((visit) => getQueueStatusKey(visit.status_antrian) === 'POS3'),
      pos4: data.filter((visit) => getQueueStatusKey(visit.status_antrian) === 'POS4'),
      pos5: data.filter((visit) => getQueueStatusKey(visit.status_antrian) === 'POS5'),
      pos6: data.filter((visit) => getQueueStatusKey(visit.status_antrian) === 'POS6'),
      pos7: data.filter((visit) => getQueueStatusKey(visit.status_antrian) === 'POS7')
    });
  }, onError);
}

export function buildQueueSpeech(queueNumber, destinationText) {
  return `Nomor antrean... ${String(queueNumber || '').replace(/-/g, ' ')}... ${destinationText}`;
}

export async function createQueueTicket({ tanggalPelaksanaan, desaPelaksanaan, tempatPelaksanaan, kodeDesa }) {
  const q = query(
    collection(db, 'visits'),
    where('tanggal_pelaksanaan', '==', tanggalPelaksanaan),
    where('tempat_pelaksanaan', '==', tempatPelaksanaan)
  );
  const querySnapshot = await getDocs(q);
  const counterId = `${tanggalPelaksanaan}_${tempatPelaksanaan}`.replace(/[\\.#$[\]/]/g, '_');
  const counterRef = doc(db, 'queue_counters', counterId);

  const nomorUrut = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const currentNumber = counterDoc.exists()
      ? Number(counterDoc.data().lastNumber || 0)
      : querySnapshot.size;
    const nextNumber = currentNumber + 1;
    transaction.set(counterRef, {
      tanggal_pelaksanaan: tanggalPelaksanaan,
      tempat_pelaksanaan: tempatPelaksanaan,
      desa_pelaksanaan: desaPelaksanaan,
      lastNumber: nextNumber,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return nextNumber;
  });

  const dataAntrian = {
    nomor_antrian: `${kodeDesa}${String(nomorUrut).padStart(3, '0')}`,
    status: VISIT_STATUS.REGISTERED,
    status_antrian: STATUS_MAPPING.POS1,
    waktu_ambil_tiket: serverTimestamp(),
    tempat_pelaksanaan: tempatPelaksanaan,
    tanggal_pelaksanaan: tanggalPelaksanaan,
    desa_pelaksanaan: desaPelaksanaan
  };
  const docRef = await addDoc(collection(db, 'visits'), dataAntrian);
  await upsertPublicQueueFromVisit(docRef.id, dataAntrian).catch((error) => {
    console.warn('Gagal memperbarui antrean publik:', error);
  });
  return { id: docRef.id, dataAntrian };
}
