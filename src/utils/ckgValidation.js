import { collection, getDocs, query, where } from 'firebase/firestore';

const getVisitDate = (visit) => {
  const raw = visit.waktu_selesai_total || visit.tanggal_kunjungan || visit.waktu_ambil_tiket;
  if (raw?.toDate) return raw.toDate();
  if (raw instanceof Date) return raw;
  if (typeof raw === 'string') {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof visit.tanggal_pelaksanaan === 'string') {
    const parsed = new Date(visit.tanggal_pelaksanaan);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

export const getVisitYear = (visit) => getVisitDate(visit)?.getFullYear() || null;

export const formatVisitDate = (visit) => {
  const date = getVisitDate(visit);
  if (!date) return visit.tanggal_pelaksanaan || '-';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const findCkgVisitInYear = async (db, nik, { year = new Date().getFullYear(), excludeVisitId = null } = {}) => {
  if (!nik || String(nik).startsWith('NONIK')) return null;

  const snapshot = await getDocs(query(collection(db, 'visits'), where('patientNIK', '==', nik)));
  const visits = [];
  snapshot.forEach((docSnap) => {
    if (docSnap.id !== excludeVisitId) visits.push({ id: docSnap.id, ...docSnap.data() });
  });

  return visits.find((visit) => getVisitYear(visit) === year) || null;
};

export const findCkgVisitByIdentityKeyInYear = async (db, identityKey, { year = new Date().getFullYear(), excludeVisitId = null } = {}) => {
  if (!identityKey) return null;

  const snapshot = await getDocs(query(collection(db, 'visits'), where('patient_identity_key', '==', identityKey)));
  const visits = [];
  snapshot.forEach((docSnap) => {
    if (docSnap.id !== excludeVisitId) visits.push({ id: docSnap.id, ...docSnap.data() });
  });

  return visits.find((visit) => getVisitYear(visit) === year) || null;
};
