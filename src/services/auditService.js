import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getStoredUser } from '../auth/AuthContext';

const getDeviceInfo = () => {
  if (typeof navigator === 'undefined') return {};
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine
  };
};

export async function writeAuditLog({
  action,
  module,
  visitId = null,
  patientKey = null,
  before = null,
  after = null
}) {
  const actor = getStoredUser();
  const actorUid = actor?.uid || actor?.id || actor?.username || 'sistem';
  const actorName = actor?.nama || actor?.name || 'Sistem / Anonim';
  const actorRoles = actor?.roles || [];

  const payload = {
    actorUid,
    actorName,
    actorRoles,
    action,
    module,
    visitId,
    patientKey,
    before,
    after,
    createdAt: serverTimestamp(),
    deviceInfo: getDeviceInfo(),

    // Backward-compatible fields used by the current Admin audit table.
    waktu: serverTimestamp(),
    user: actorUid,
    nama: actorName,
    aksi: action,
    modul: module
  };

  await addDoc(collection(db, 'activity_logs'), payload);
}
