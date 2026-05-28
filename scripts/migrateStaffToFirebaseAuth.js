import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) {
      process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
    }
  });
};

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : '';
};

const normalizeUsername = (value) => String(value || '').toLowerCase().replace(/\s/g, '');
const authEmailForUsername = (username) => {
  const normalized = normalizeUsername(username);
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

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(`Konfigurasi Firebase belum lengkap: ${missingKeys.join(', ')}`);
  process.exit(1);
}

const adminUsername = normalizeUsername(getArgValue('admin-user') || process.env.MIGRATE_ADMIN_USER);
const adminPin = getArgValue('admin-pin') || process.env.MIGRATE_ADMIN_PIN;
const commit = process.argv.includes('--commit');

if (!adminUsername || !adminPin) {
  console.error('Admin Firebase Auth wajib diisi: --admin-user=admin --admin-pin=PIN atau MIGRATE_ADMIN_USER/MIGRATE_ADMIN_PIN.');
  process.exit(1);
}

const adminApp = initializeApp(firebaseConfig, 'staff-auth-migration-admin');
const workerApp = initializeApp(firebaseConfig, 'staff-auth-migration-worker');
const adminAuth = getAuth(adminApp);
const workerAuth = getAuth(workerApp);
const db = getFirestore(adminApp);

const createOrReuseAuthUser = async ({ username, pin }) => {
  const email = authEmailForUsername(username);
  try {
    const credential = await createUserWithEmailAndPassword(workerAuth, email, pin);
    await signOut(workerAuth);
    return { uid: credential.user.uid, email, status: 'created' };
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') throw error;
    const credential = await signInWithEmailAndPassword(workerAuth, email, pin);
    await signOut(workerAuth);
    return { uid: credential.user.uid, email, status: 'reused' };
  }
};

try {
  await signInWithEmailAndPassword(adminAuth, authEmailForUsername(adminUsername), adminPin);
  const staffSnapshot = await getDocs(collection(db, 'staff'));
  const staffRows = staffSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Staff ditemukan: ${staffRows.length}`);
  console.log(commit ? 'Mode: COMMIT' : 'Mode: DRY-RUN');

  let created = 0;
  let reused = 0;
  let skipped = 0;
  let failed = 0;

  for (const staff of staffRows) {
    const username = normalizeUsername(staff.username);
    const pin = String(staff.pin || '').trim();
    if (!username || !pin || staff.isActive === false) {
      skipped++;
      console.log(`SKIP ${staff.id}: username/PIN kosong atau akun nonaktif.`);
      continue;
    }

    const roles = normalizeRoles(staff.roles || staff.role || []);
    const payload = {
      username,
      email: authEmailForUsername(username),
      nama: staff.nama || staff.name || '',
      roles,
      role: roles,
      permissions: staff.permissions || {},
      pos: staff.pos || '',
      status: staff.status || '',
      status_detail: staff.status_detail || '',
      staffDocId: staff.id,
      isActive: staff.isActive !== false,
      updatedAt: serverTimestamp()
    };

    if (!commit) {
      console.log(`DRY ${username}: ${payload.email} roles=[${roles.join(', ')}]`);
      continue;
    }

    try {
      const authUser = await createOrReuseAuthUser({ username, pin });
      await setDoc(doc(db, 'users', authUser.uid), {
        ...payload,
        email: authUser.email
      }, { merge: true });

      if (authUser.status === 'created') created++;
      else reused++;
      console.log(`OK ${username}: ${authUser.status} uid=${authUser.uid}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${username}: ${error.code || error.message}`);
    }
  }

  console.log(`Selesai. created=${created}, reused=${reused}, skipped=${skipped}, failed=${failed}`);
  if (!commit) {
    console.log('Dry-run selesai. Jalankan dengan --commit untuk membuat akun Firebase Auth dan users/{uid}.');
  }
} finally {
  await signOut(adminAuth).catch(() => {});
  await deleteApp(workerApp).catch(() => {});
  await deleteApp(adminApp).catch(() => {});
}
