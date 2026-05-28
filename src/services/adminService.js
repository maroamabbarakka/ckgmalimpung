import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const mapDocs = (snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

export function subscribeAdminVisits(onChange, onError, maxRows = 2500) {
  const visitsQuery = query(collection(db, 'visits'), orderBy('waktu_ambil_tiket', 'desc'), limit(maxRows));
  return onSnapshot(visitsQuery, (snapshot) => onChange(mapDocs(snapshot)), onError);
}

export function subscribeAdminSchools(onChange, onError) {
  return onSnapshot(
    collection(db, 'schools'),
    (snapshot) => {
      const data = mapDocs(snapshot);
      data.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      onChange(data);
    },
    onError
  );
}

export function subscribeAdminStaff(onChange, onError) {
  return onSnapshot(
    collection(db, 'staff'),
    (snapshot) => {
      const data = mapDocs(snapshot);
      data.sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));
      onChange(data);
    },
    onError
  );
}

export function subscribeActivityLogs(onChange, onError, maxRows = 200) {
  const logsQuery = query(collection(db, 'activity_logs'), orderBy('waktu', 'desc'), limit(maxRows));
  return onSnapshot(logsQuery, (snapshot) => onChange(mapDocs(snapshot)), onError);
}

export async function removeDuplicateSchools() {
  const snapshot = await getDocs(collection(db, 'schools'));
  const unique = new Set();
  const duplicatesToDelete = [];

  for (const item of snapshot.docs) {
    const data = item.data();
    const name = String(data.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const npsn = String(data.npsn || '').trim();
    const key = npsn && npsn !== '-' && npsn.length > 3 ? `npsn_${npsn}` : `name_${name}`;

    if (unique.has(key)) {
      duplicatesToDelete.push(item.ref);
    } else {
      unique.add(key);
    }
  }

  if (duplicatesToDelete.length > 0) {
    await runTransaction(db, async (transaction) => {
      for (const ref of duplicatesToDelete) {
        const docSnap = await transaction.get(ref);
        if (docSnap.exists()) transaction.delete(ref);
      }
    });
  }

  return duplicatesToDelete.length;
}

export async function saveSchool(school) {
  const payload = { ...school, lastUpdated: new Date().toISOString() };
  if (school.id) {
    await updateDoc(doc(db, 'schools', school.id), payload);
    return { id: school.id, action: 'updated' };
  }

  const docRef = await addDoc(collection(db, 'schools'), payload);
  return { id: docRef.id, action: 'created' };
}

export async function deleteSchool(schoolId) {
  await deleteDoc(doc(db, 'schools', schoolId));
}

export async function saveStaff(staffPayload) {
  if (staffPayload.id) {
    const { id, ...dataToUpdate } = staffPayload;
    await updateDoc(doc(db, 'staff', id), dataToUpdate);
    return { id, action: 'updated' };
  }

  const docRef = await addDoc(collection(db, 'staff'), { ...staffPayload, isActive: true });
  return { id: docRef.id, action: 'created' };
}

export async function toggleStaffActive(staff) {
  const staffRef = doc(db, 'staff', staff.id);
  let newStatus = false;

  await runTransaction(db, async (transaction) => {
    const staffDoc = await transaction.get(staffRef);
    if (!staffDoc.exists()) throw new Error('Data pegawai tidak ditemukan!');
    newStatus = !staffDoc.data().isActive;
    transaction.update(staffRef, { isActive: newStatus });
  });

  return newStatus;
}

export async function resetStaffPin(staffId) {
  await updateDoc(doc(db, 'staff', staffId), { pin: '123456' });
}

export async function fetchCollectionBackup(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return mapDocs(snapshot);
}
