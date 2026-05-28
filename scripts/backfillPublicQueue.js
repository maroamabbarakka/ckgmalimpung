import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { getQueueStatusKey } from '../src/utils/queueStatus.js';

const STATUS_SELESAI = 'Selesai';

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

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : '';
};

const normalizeUsername = (value) => String(value || '').toLowerCase().replace(/\s/g, '');
const authEmailForUsername = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return '';
  return normalized.includes('@') ? normalized : `${normalized}@tersanjung.local`;
};

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

const commit = process.argv.includes('--commit');
const includeFinished = process.argv.includes('--include-finished');
const adminUsername = normalizeUsername(getArgValue('admin-user') || process.env.MIGRATE_ADMIN_USER);
const adminPin = getArgValue('admin-pin') || process.env.MIGRATE_ADMIN_PIN;

if (!adminUsername || !adminPin) {
  console.error('Admin Firebase Auth wajib diisi: --admin-user=admin --admin-pin=PIN atau MIGRATE_ADMIN_USER/MIGRATE_ADMIN_PIN.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const toPublicQueuePayload = (visit) => ({
  nomor_antrian: visit.nomor_antrian || visit.queueNumber || '-',
  status_antrian: visit.status_antrian || visit.queueStatus || '',
  pos_key: getQueueStatusKey(visit.status_antrian || visit.queueStatus || '') || '',
  waktu_ambil_tiket: visit.waktu_ambil_tiket || visit.createdAt || null,
  updatedAt: serverTimestamp()
});

try {
  await signInWithEmailAndPassword(auth, authEmailForUsername(adminUsername), adminPin);

  const snapshot = await getDocs(collection(db, 'visits'));
  const candidates = [];

  snapshot.forEach((docSnap) => {
    const visit = docSnap.data();
    if (!visit.nomor_antrian) return;
    if (!includeFinished && visit.status_antrian === STATUS_SELESAI) return;

    candidates.push({
      id: docSnap.id,
      payload: toPublicQueuePayload(visit)
    });
  });

  console.log(`Total visits dipindai: ${snapshot.size}`);
  console.log(`Public queue akan disinkronkan: ${candidates.length}`);
  candidates.slice(0, 20).forEach((item) => {
    console.log(`- ${item.id}: ${item.payload.nomor_antrian} -> ${item.payload.status_antrian || '-'}`);
  });

  if (candidates.length > 20) {
    console.log(`... ${candidates.length - 20} dokumen lain disembunyikan`);
  }

  if (!commit) {
    console.log('Dry-run selesai. Jalankan `node scripts/backfillPublicQueue.js --admin-user=admin --admin-pin=PIN --commit` untuk menulis public_queue.');
  } else {
    for (const item of candidates) {
      await setDoc(doc(db, 'public_queue', item.id), item.payload, { merge: true });
    }
    console.log(`Backfill public_queue selesai. ${candidates.length} dokumen disinkronkan.`);
  }
} finally {
  await signOut(auth).catch(() => {});
  await deleteApp(app).catch(() => {});
}
