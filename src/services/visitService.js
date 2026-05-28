import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { upsertPublicQueueFromVisit } from './publicQueueService';

export function createVisitDocRef() {
  return doc(collection(db, 'visits'));
}

export async function updateVisit(visitId, payload) {
  const safePayload = payload?.petugas_aktif === null
    ? { ...payload, lock: null, lockedBy: null, lockedModule: null }
    : payload;
  const visitRef = doc(db, 'visits', visitId);
  await updateDoc(visitRef, safePayload);
  if (Object.prototype.hasOwnProperty.call(safePayload, 'status_antrian') || Object.prototype.hasOwnProperty.call(safePayload, 'nomor_antrian')) {
    const latestVisit = await getDoc(visitRef);
    const publicPayload = latestVisit.exists() ? latestVisit.data() : safePayload;
    await upsertPublicQueueFromVisit(visitId, publicPayload).catch((error) => {
      console.warn('Gagal memperbarui antrean publik:', error);
    });
  }
}

export async function createVisitWithRef(visitRef, payload) {
  await setDoc(visitRef, payload);
  await upsertPublicQueueFromVisit(visitRef.id, payload).catch((error) => {
    console.warn('Gagal memperbarui antrean publik:', error);
  });
}

export async function getVisitsByPatientNik(patientNik) {
  if (!patientNik) return [];
  const snapshot = await getDocs(query(collection(db, 'visits'), where('patientNIK', '==', patientNik)));
  const visits = [];
  snapshot.forEach((visitDoc) => visits.push({ id: visitDoc.id, ...visitDoc.data() }));
  return visits;
}

export function buildPatientSnapshot({
  nama,
  gender,
  birthDate,
  desa,
  dusun,
  phone = '',
  status = '-',
  alamat = ''
}) {
  const snapshot = {
    nama,
    j_kelamin: gender,
    tgl_lahir: birthDate,
    desa,
    dusun,
    no_hp: phone,
    status
  };

  if (alamat) snapshot.alamat = alamat;
  return snapshot;
}

export const nowTimestamp = () => serverTimestamp();
