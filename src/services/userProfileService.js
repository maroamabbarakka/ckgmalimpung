import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { sanitizeStaffPositions } from '../utils/staffConstants';

export const authEmailForUsername = (username) => {
  const normalized = String(username || '').toLowerCase().replace(/\s/g, '');
  if (!normalized) return '';
  return normalized.includes('@') ? normalized : `${normalized}@tersanjung.local`;
};

const normalizeRoles = (rawRole) => {
  if (Array.isArray(rawRole)) return rawRole.map(String).filter(Boolean);
  if (!rawRole) return [];
  try {
    const parsed = JSON.parse(rawRole);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return String(rawRole)
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
  }
};

export async function syncUserProfileFromStaff(staff) {
  const username = String(staff?.username || '').toLowerCase().replace(/\s/g, '');
  const email = authEmailForUsername(username);
  if (!email) return { synced: false, reason: 'missing-email' };

  const usersSnapshot = staff.authUid
    ? { empty: false, docs: [{ id: staff.authUid }] }
    : await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  if (usersSnapshot.empty) {
    return { synced: false, reason: 'user-profile-not-found' };
  }

  const roles = normalizeRoles(staff.roles || staff.role || []);
  const cleanPositions = sanitizeStaffPositions(staff.positions, staff.pos);
  const primaryPos = cleanPositions.length > 0 ? cleanPositions[0] : (staff.pos === 'BELUM DITUGASKAN' ? '' : staff.pos || '');

  const payload = {
    username,
    email,
    nama: staff.nama || staff.name || '',
    roles,
    role: roles,
    permissions: staff.permissions || {},
    pos: primaryPos,
    positions: cleanPositions,
    status: staff.status || '',
    status_detail: staff.status_detail || '',
    staffDocId: staff.id || staff.staffDocId || '',
    isActive: staff.isActive !== false,
    updatedAt: serverTimestamp()
  };

  await Promise.all(usersSnapshot.docs.map((item) => setDoc(doc(db, 'users', item.id), payload, { merge: true })));
  return { synced: true, count: usersSnapshot.size };
}

let provisioningAuth = null;
const getProvisioningAuth = () => {
  if (!provisioningAuth) {
    const provisioningApp = initializeApp(auth.app.options, 'staff-account-provisioning');
    provisioningAuth = getAuth(provisioningApp);
  }
  return provisioningAuth;
};

/**
 * Creates the production Auth account without replacing the currently signed-in
 * admin session, then writes the matching users/{uid} profile.
 */
export async function provisionStaffAuth(staff, password) {
  const username = String(staff?.username || '').toLowerCase().replace(/\s/g, '');
  const email = authEmailForUsername(username);
  const cleanPassword = String(password || '').trim();
  if (!email || cleanPassword.length < 6) {
    throw new Error('Username dan password awal minimal 6 karakter wajib diisi.');
  }

  const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  let uid = usersSnapshot.docs[0]?.id || '';
  if (!uid) {
    const secondaryAuth = getProvisioningAuth();
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, cleanPassword);
      uid = credential.user.uid;
    } finally {
      await signOut(secondaryAuth).catch(() => {});
    }
  }

  const roles = normalizeRoles(staff.roles || staff.role || []);
  const cleanPositions = sanitizeStaffPositions(staff.positions, staff.pos);
  const primaryPos = cleanPositions.length > 0 ? cleanPositions[0] : (staff.pos === 'BELUM DITUGASKAN' ? '' : staff.pos || '');

  await setDoc(doc(db, 'users', uid), {
    username,
    email,
    nama: staff.nama || staff.name || '',
    roles,
    role: roles,
    permissions: staff.permissions || {},
    pos: primaryPos,
    positions: cleanPositions,
    status: staff.status || '',
    status_detail: staff.status_detail || '',
    staffDocId: staff.id || staff.staffDocId || '',
    isActive: staff.isActive !== false,
    updatedAt: serverTimestamp()
  }, { merge: true });

  if (staff.id && staff.authUid !== uid) {
    await updateDoc(doc(db, 'staff', staff.id), { authUid: uid });
  }
  return { uid, email };
}
