import { isValidIsoDate } from '../../utils/dateAge';

const FINAL_STATUSES = new Set(['FINALIZED', 'Selesai']);
const VALID_GENDERS = new Set(['L', 'P']);

function getFirstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getPatientSnapshot(visit = {}) {
  return visit.pasien_snapshot || visit.patientSnapshot || {};
}

export function getVisitIdentityKey(visit = {}) {
  const patient = getPatientSnapshot(visit);
  return normalizeText(
    getFirstValue(
      visit.patient_identity_key,
      visit.patientKey,
      visit.patientNIK,
      patient.nik,
      visit.nik
    )
  );
}

export function getVisitYearValue(visit = {}) {
  const rawDate = getFirstValue(
    visit.visitDate,
    visit.tanggal_kunjungan,
    visit.tanggal_pelaksanaan,
    visit.waktu_ambil_tiket?.toDate?.()?.toISOString?.().slice(0, 10)
  );
  const year = Number(visit.visitYear || visit.tahun_kunjungan || String(rawDate || '').slice(0, 4));
  return Number.isFinite(year) && year > 1900 ? year : null;
}

export function evaluateVisitDataQuality(visit = {}) {
  const patient = getPatientSnapshot(visit);
  const issues = [];
  const nik = normalizeText(getFirstValue(visit.patientNIK, patient.nik, visit.nik));
  const birthDate = normalizeText(getFirstValue(visit.patientBirthDate, patient.tgl_lahir, visit.tgl_lahir));
  const gender = normalizeText(getFirstValue(visit.jenisKelamin, patient.j_kelamin, visit.j_kelamin));
  const village = normalizeText(getFirstValue(patient.desa, visit.desa, visit.desa_pelaksanaan));
  const status = normalizeText(getFirstValue(visit.status, visit.status_antrian));

  if (!nik) {
    issues.push({ code: 'MISSING_NIK', severity: 'warning', message: 'NIK belum terisi.' });
  } else if (!nik.startsWith('NONIK') && !/^\d{16}$/.test(nik)) {
    issues.push({ code: 'INVALID_NIK', severity: 'error', message: 'NIK harus 16 digit angka.' });
  }

  if (!birthDate) {
    issues.push({ code: 'MISSING_BIRTH_DATE', severity: 'error', message: 'Tanggal lahir belum terisi.' });
  } else if (!isValidIsoDate(birthDate)) {
    issues.push({ code: 'INVALID_BIRTH_DATE', severity: 'error', message: 'Tanggal lahir tidak valid.' });
  }

  if (!gender) {
    issues.push({ code: 'MISSING_GENDER', severity: 'error', message: 'Jenis kelamin belum terisi.' });
  } else if (!VALID_GENDERS.has(gender)) {
    issues.push({ code: 'INVALID_GENDER', severity: 'error', message: 'Jenis kelamin harus L atau P.' });
  }

  if (!village) {
    issues.push({ code: 'MISSING_VILLAGE', severity: 'warning', message: 'Desa/kelurahan belum terisi.' });
  }

  if (!status) {
    issues.push({ code: 'INVALID_WORKFLOW', severity: 'error', message: 'Status workflow belum tersedia.' });
  }

  if (FINAL_STATUSES.has(status) && !visit.validasiDokter && !visit.pos7?.validasiDokter) {
    issues.push({ code: 'FINALIZED_WITHOUT_DOCTOR', severity: 'error', message: 'Finalisasi belum punya validasi dokter.' });
  }

  return {
    visitId: visit.id || null,
    issues,
    isComplete: issues.length === 0
  };
}

export function calculateDataQualitySummary(visits = []) {
  const summary = {
    missingNik: 0,
    invalidNik: 0,
    missingBirthDate: 0,
    invalidBirthDate: 0,
    missingGender: 0,
    invalidGender: 0,
    missingVillage: 0,
    invalidWorkflow: 0,
    finalizedWithoutDoctor: 0,
    duplicateIdentityYear: 0,
    issueRows: []
  };
  const identityYearMap = new Map();

  visits.forEach((visit) => {
    const result = evaluateVisitDataQuality(visit);
    if (result.issues.length > 0) {
      summary.issueRows.push(result);
    }

    result.issues.forEach((issue) => {
      if (issue.code === 'MISSING_NIK') summary.missingNik += 1;
      if (issue.code === 'INVALID_NIK') summary.invalidNik += 1;
      if (issue.code === 'MISSING_BIRTH_DATE') summary.missingBirthDate += 1;
      if (issue.code === 'INVALID_BIRTH_DATE') summary.invalidBirthDate += 1;
      if (issue.code === 'MISSING_GENDER') summary.missingGender += 1;
      if (issue.code === 'INVALID_GENDER') summary.invalidGender += 1;
      if (issue.code === 'MISSING_VILLAGE') summary.missingVillage += 1;
      if (issue.code === 'INVALID_WORKFLOW') summary.invalidWorkflow += 1;
      if (issue.code === 'FINALIZED_WITHOUT_DOCTOR') summary.finalizedWithoutDoctor += 1;
    });

    const identityKey = getVisitIdentityKey(visit);
    const visitYear = getVisitYearValue(visit);
    if (identityKey && visitYear) {
      const mapKey = `${identityKey}:${visitYear}`;
      identityYearMap.set(mapKey, (identityYearMap.get(mapKey) || 0) + 1);
    }
  });

  identityYearMap.forEach((count) => {
    if (count > 1) summary.duplicateIdentityYear += count;
  });

  return summary;
}
