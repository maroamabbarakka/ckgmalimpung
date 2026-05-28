import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { findCkgVisitByIdentityKeyInYear, findCkgVisitInYear } from '../utils/ckgValidation';

export function buildPatientPayload({
  nik,
  identityKey = null,
  name,
  birthDate,
  gender,
  phone = '',
  statusPerkawinan = '',
  desa = '',
  dusun = '',
  wali = null
}) {
  const payload = {
    nik,
    patient_identity_key: identityKey,
    name,
    birthDate,
    gender,
    phone,
    status_perkawinan: statusPerkawinan,
    desa,
    dusun,
    lastUpdated: serverTimestamp()
  };

  if (wali) {
    payload.data_wali = wali;
  }

  return payload;
}

export async function upsertPatient(patientNik, patientData) {
  await setDoc(doc(db, 'patients', patientNik), patientData, { merge: true });
}

export async function getPatientByNik(patientNik) {
  if (!patientNik) return null;
  const patientSnap = await getDoc(doc(db, 'patients', patientNik));
  return patientSnap.exists() ? { id: patientSnap.id, ...patientSnap.data() } : null;
}

export async function findCurrentYearCkgVisit({ patientNik, identityKey, excludeVisitId } = {}) {
  if (identityKey) {
    return findCkgVisitByIdentityKeyInYear(db, identityKey, { excludeVisitId });
  }

  if (patientNik) {
    return findCkgVisitInYear(db, patientNik, { excludeVisitId });
  }

  return null;
}
