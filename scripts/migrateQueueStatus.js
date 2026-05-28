import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  getDocs,
  getFirestore,
  updateDoc,
  doc
} from 'firebase/firestore';
import { normalizeQueueStatus } from '../src/utils/queueStatus.js';

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
const adminUsername = normalizeUsername(getArgValue('admin-user') || process.env.MIGRATE_ADMIN_USER);
const adminPin = getArgValue('admin-pin') || process.env.MIGRATE_ADMIN_PIN;

if (!adminUsername || !adminPin) {
  console.error('Admin Firebase Auth wajib diisi: --admin-user=admin --admin-pin=PIN atau MIGRATE_ADMIN_USER/MIGRATE_ADMIN_PIN.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, authEmailForUsername(adminUsername), adminPin);

  const snapshot = await getDocs(collection(db, 'visits'));
  const changes = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const currentStatus = data.status_antrian;
    const normalizedStatus = normalizeQueueStatus(currentStatus);
    if (currentStatus && normalizedStatus !== currentStatus) {
      changes.push({
        id: docSnap.id,
        before: currentStatus,
        after: normalizedStatus
      });
    }
  });

  console.log(`Total visits dipindai: ${snapshot.size}`);
  console.log(`Status perlu dinormalisasi: ${changes.length}`);

  changes.slice(0, 20).forEach((change) => {
    console.log(`- ${change.id}: "${change.before}" -> "${change.after}"`);
  });

  if (changes.length > 20) {
    console.log(`... ${changes.length - 20} perubahan lain disembunyikan`);
  }

  if (!commit) {
    console.log('Dry-run selesai. Jalankan `node scripts/migrateQueueStatus.js --admin-user=admin --admin-pin=PIN --commit` untuk update Firestore.');
  } else {
    for (const change of changes) {
      await updateDoc(doc(db, 'visits', change.id), {
        status_antrian: change.after
      });
    }

    console.log(`Migrasi selesai. ${changes.length} dokumen diperbarui.`);
  }
} finally {
  await signOut(auth).catch(() => {});
  await deleteApp(app).catch(() => {});
}
