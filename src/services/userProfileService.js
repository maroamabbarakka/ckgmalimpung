import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';

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

  const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  if (usersSnapshot.empty) {
    return { synced: false, reason: 'user-profile-not-found' };
  }

  const roles = normalizeRoles(staff.roles || staff.role || []);
  const payload = {
    username,
    email,
    nama: staff.nama || staff.name || '',
    roles,
    role: roles,
    permissions: staff.permissions || {},
    pos: staff.pos || '',
    status: staff.status || '',
    status_detail: staff.status_detail || '',
    staffDocId: staff.id || staff.staffDocId || '',
    isActive: staff.isActive !== false,
    updatedAt: serverTimestamp()
  };

  await Promise.all(usersSnapshot.docs.map((item) => setDoc(doc(db, 'users', item.id), payload, { merge: true })));
  return { synced: true, count: usersSnapshot.size };
}
