import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';

const FINAL_STATUS = new Set(['FINALIZED', 'Selesai']);
const CANCELLED_STATUS = new Set(['CANCELLED', 'Dibatalkan']);

export const defaultDashboardFilters = {
  startDate: '',
  endDate: '',
  desa: 'ALL',
  jenisKelamin: 'ALL',
  kelompokUmur: 'ALL',
  status: 'ALL',
  risk: 'ALL',
  petugas: 'ALL',
};

export function subscribeDashboardVisits(onChange, onError, maxRows = 2500) {
  const dashboardQuery = query(
    collection(db, 'visits'),
    orderBy('waktu_ambil_tiket', 'desc'),
    limit(maxRows)
  );

  return onSnapshot(
    dashboardQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
}

export async function deleteDashboardVisits(visitIds = []) {
  const batch = writeBatch(db);
  visitIds.forEach((id) => batch.delete(doc(db, 'visits', id)));
  await batch.commit();
}

export async function updateDashboardVisit(visitId, payload) {
  await updateDoc(doc(db, 'visits', visitId), payload);
}

export function calculateDashboardMetrics(visits = []) {
  const finalized = visits.filter((visit) => FINAL_STATUS.has(visit.status) || FINAL_STATUS.has(visit.status_antrian)).length;
  const cancelled = visits.filter((visit) => CANCELLED_STATUS.has(visit.status) || CANCELLED_STATUS.has(visit.status_antrian)).length;
  const inProgress = visits.length - finalized - cancelled;
  const highRisk = visits.filter((visit) => visit.riskLevel === 'HIGH' || visit.risk_level === 'HIGH' || visit.keterangan_akhir === 'Risiko Tinggi').length;
  const incomplete = visits.filter((visit) => visit.dataQuality?.isComplete === false || !visit.status || !visit.nama || !visit.desa).length;

  return {
    total: visits.length,
    finalized,
    inProgress: Math.max(0, inProgress),
    cancelled,
    highRisk,
    incomplete,
    exportReady: finalized,
  };
}

export function calculateBottleneck(visits = []) {
  return visits.reduce((acc, visit) => {
    const status = visit.status || visit.status_antrian || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

export function calculateDataQuality(visits = []) {
  return visits.reduce((acc, visit) => {
    if (!visit.nik && !visit.patientNIK) acc.missingNik += 1;
    if (!visit.tgl_lahir && !visit.patientBirthDate) acc.missingBirthDate += 1;
    if (!visit.desa && !visit.desa_pelaksanaan) acc.missingVillage += 1;
    if (!visit.status && !visit.status_antrian) acc.invalidWorkflow += 1;
    if ((visit.status === 'FINALIZED' || visit.status_antrian === 'Selesai') && !visit.validasiDokter && !visit.pos7?.validasiDokter) {
      acc.finalizedWithoutDoctor += 1;
    }
    return acc;
  }, {
    missingNik: 0,
    missingBirthDate: 0,
    missingVillage: 0,
    invalidWorkflow: 0,
    finalizedWithoutDoctor: 0,
  });
}

export function applyDashboardFilters(visits = [], filters = defaultDashboardFilters) {
  return visits.filter((visit) => {
    if (filters.desa !== 'ALL' && (visit.desa || visit.desa_pelaksanaan) !== filters.desa) return false;
    if (filters.jenisKelamin !== 'ALL' && (visit.j_kelamin || visit.jenisKelamin) !== filters.jenisKelamin) return false;
    if (filters.status !== 'ALL' && (visit.status || visit.status_antrian) !== filters.status) return false;
    if (filters.risk !== 'ALL' && (visit.riskLevel || visit.risk_level || 'ALL') !== filters.risk) return false;
    return true;
  });
}
