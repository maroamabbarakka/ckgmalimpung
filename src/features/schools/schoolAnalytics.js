/**
 * Modul Analitik & Kalkulasi Cakupan Sarana Binaan CKG Malimpung
 * 
 * Prinsip:
 * 1. Diperiksa = Anak Unik yang sudah menyelesaikan CKG (bukan hitung total kunjungan).
 * 2. 0 adalah data valid. Denominator 0 menghasilkan cakupan null / '—'.
 * 3. Nilai cakupan di atas 100% (misal 107%) tidak dipotong (tidak ada Math.min(100)).
 * 4. Agregasi total menggunakan total numerator / total denominator (bukan rata-rata persentase).
 */

import { STATUS_MAPPING } from '../../utils/constants';
import { visitMatchesSchool } from './schoolScope';

/**
 * Memeriksa apakah suatu kunjungan telah selesai CKG sesuai standar status aplikasi.
 */
export function isVisitCompleted(visit) {
  if (!visit) return false;
  return visit.status_antrian === STATUS_MAPPING.SELESAI || visit.status_antrian === 'Selesai';
}

/**
 * Ekstraksi identitas unik pasien secara stabil dan deterministik.
 * Prioritas:
 * 1. patient_identity_key
 * 2. patientNIK / nik (16 digit atau string identitas NIK)
 * 3. patientId / pasien_id / id_pasien
 * 
 * Jika tidak ada identitas yang stabil, mengembalikan null untuk menghindari duplikasi.
 */
export function getStablePatientKey(visit) {
  if (!visit) return null;

  if (visit.patient_identity_key && typeof visit.patient_identity_key === 'string') {
    const raw = visit.patient_identity_key.trim().toLowerCase();
    const cleanKey = raw.replace(/^nik[_:\s]*/i, '');
    return `nik_${cleanKey}`;
  }

  const nik = visit.patientNIK || visit.nik || visit.pasien_snapshot?.nik;
  if (nik && String(nik).trim() && String(nik).trim() !== '-') {
    const cleanNik = String(nik).trim().toLowerCase().replace(/^nik[_:\s]*/i, '');
    return `nik_${cleanNik}`;
  }

  const patientId = visit.patientId || visit.pasien_id || visit.id_pasien || visit.pasien_snapshot?.id;
  if (patientId && String(patientId).trim()) {
    return `id_${String(patientId).trim().toLowerCase()}`;
  }

  return null;
}

/**
 * Mendapatkan snapshot jumlah siswa resmi terbaru secara aman menggunakan nullish logic.
 * Explicit 0 tetap bernilai 0.
 * 
 * @param {Object} school
 * @returns {{ count: number|null, year: string|null, source: string|null, syncedAt: string|null }}
 */
export function getLatestStudentData(school) {
  if (!school) return { count: null, year: null, source: null, syncedAt: null };

  const snapshots = school.studentSnapshots || {};
  const years = Object.keys(snapshots).sort((a, b) => b.localeCompare(a));
  
  if (years.length > 0) {
    const latestYear = years[0];
    const latest = snapshots[latestYear];
    const count = latest?.totalStudents ?? school.totalStudents ?? null;
    return {
      count: count !== null ? Number(count) : null,
      year: latestYear,
      source: latest?.source || school.source || 'Kemendikdasmen Residu',
      syncedAt: latest?.syncedAt || school.syncedAt || null
    };
  }

  const rawCount = school.totalStudents ?? null;
  return {
    count: rawCount !== null ? Number(rawCount) : null,
    year: null,
    source: school.source || 'Admin Input',
    syncedAt: school.syncedAt || null
  };
}

/**
 * Menghitung cakupan dan statistik kunjungan untuk satu satuan pendidikan.
 * 
 * @param {Object} school - Dokumen sekolah
 * @param {Array<Object>} visits - Seluruh data kunjungan CKG
 * @returns {Object} baris ringkasan sekolah
 */
export function buildSchoolRowAnalytics(school, visits = []) {
  const matchedVisits = visits.filter((v) => visitMatchesSchool(v, school));

  // Ambil anak unik yang sudah menyelesaikan CKG
  const completedVisits = matchedVisits.filter(isVisitCompleted);
  const uniqueCompletedKeys = new Set();
  const completedPatients = [];

  for (const visit of completedVisits) {
    const key = getStablePatientKey(visit);
    if (key) {
      if (!uniqueCompletedKeys.has(key)) {
        uniqueCompletedKeys.add(key);
        completedPatients.push(visit);
      }
    } else {
      // Jika sama sekali tidak ada key stabil, hanya masukkan sekali berdasarkan visit.id jika aman
      if (visit.id && !uniqueCompletedKeys.has(visit.id)) {
        uniqueCompletedKeys.add(visit.id);
        completedPatients.push(visit);
      }
    }
  }

  const examinedCount = uniqueCompletedKeys.size;
  const studentData = getLatestStudentData(school);
  const denominator = studentData.count;

  let coveragePct = null;
  let visualWidth = 0;
  let isOverTarget = false;

  if (denominator !== null && typeof denominator === 'number' && denominator > 0) {
    coveragePct = (examinedCount / denominator) * 100;
    visualWidth = Math.min(coveragePct, 100);
    isOverTarget = coveragePct > 100;
  }

  return {
    ...school,
    studentCount: denominator,
    academicYear: studentData.year,
    sourceName: studentData.source,
    lastSyncedAt: studentData.syncedAt,
    examinedCount,
    coveragePct,
    coverageDisplay: coveragePct !== null ? `${coveragePct.toFixed(1)}%` : '—',
    visualWidth,
    isOverTarget,
    matchedVisits,
    completedPatients
  };
}

/**
 * Menghitung metrik agregasi total dashboard untuk seluruh sekolah target CKG.
 * 
 * @param {Array<Object>} schoolRows - Hasil dari buildSchoolRowAnalytics
 * @returns {Object} Ringkasan KPI kompak
 */
export function calculateAggregateSummary(schoolRows = []) {
  let totalStudents = 0;
  let totalExamined = 0;
  let eligibleDenominatorTotal = 0;
  let eligibleExaminedTotal = 0;
  let schoolsWithDenominatorCount = 0;

  for (const row of schoolRows) {
    totalExamined += row.examinedCount;

    if (row.studentCount !== null && typeof row.studentCount === 'number') {
      totalStudents += row.studentCount;

      if (row.studentCount > 0) {
        eligibleDenominatorTotal += row.studentCount;
        eligibleExaminedTotal += row.examinedCount;
        schoolsWithDenominatorCount += 1;
      }
    }
  }

  const aggregateCoveragePct = eligibleDenominatorTotal > 0
    ? (eligibleExaminedTotal / eligibleDenominatorTotal) * 100
    : null;

  return {
    totalSchools: schoolRows.length,
    totalStudents,
    totalExamined,
    eligibleDenominatorTotal,
    eligibleExaminedTotal,
    schoolsWithDenominatorCount,
    aggregateCoveragePct,
    aggregateCoverageDisplay: aggregateCoveragePct !== null ? `${aggregateCoveragePct.toFixed(1)}%` : '—'
  };
}
