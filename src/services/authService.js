import { doc, getDoc } from 'firebase/firestore';
import { getIdTokenResult, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../firebase';

export const normalizeRoles = (rawRole) => {
  if (Array.isArray(rawRole)) return rawRole.map(String).map((role) => role.trim().toLowerCase()).filter(Boolean);
  if (!rawRole) return [];
  try {
    const parsed = JSON.parse(rawRole);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return String(rawRole)
      .split(',')
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);
  }
};

export const buildAuthEmail = (username) => {
  const normalized = String(username || '').toLowerCase().replace(/\s/g, '');
  if (normalized.includes('@')) return normalized;
  return `${normalized}@tersanjung.local`;
};

export const buildSignedUser = (source, fallbackUsername = '') => {
  const roles = normalizeRoles(source.role || source.roles || '');
  return {
    uid: source.uid || source.id || null,
    username: source.username || fallbackUsername,
    email: source.email || '',
    nama: source.nama || source.name || '',
    roles,
    isAuthenticated: true,
  };
};

export async function getActiveUserProfile(firebaseUser) {
  const tokenResult = await getIdTokenResult(firebaseUser, true);
  const claimRoles = normalizeRoles(tokenResult.claims.roles || tokenResult.claims.role || '');
  const claimIsActive = tokenResult.claims.isActive !== false;
  const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
  const profile = userSnap.exists() ? userSnap.data() : {};

  if (!claimIsActive || (!userSnap.exists() && claimRoles.length === 0) || profile.isActive === false) {
    return null;
  }

  return buildSignedUser(
    {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      ...profile,
      roles: claimRoles.length > 0 ? claimRoles : profile.roles || profile.role || []
    },
    firebaseUser.email?.split('@')[0] || ''
  );
}

export async function signInWithUsernameAndPin(username, pin) {
  const normalizedUsername = String(username || '').toLowerCase().replace(/\s/g, '');
  const credential = await signInWithEmailAndPassword(auth, buildAuthEmail(normalizedUsername), pin);
  const signedUser = await getActiveUserProfile(credential.user);
  if (!signedUser) {
    await firebaseSignOut(auth);
    return null;
  }
  return signedUser;
}

export async function signOutAuth() {
  if (auth.currentUser) {
    await firebaseSignOut(auth);
  }
}
