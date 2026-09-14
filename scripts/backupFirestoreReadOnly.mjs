import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

const COLLECTIONS = [
  'patients',
  'visits',
  'users',
  'staff',
  'activity_logs',
  'public_queue',
  'schools',
  'pengaturan',
  'panggilan_tv',
  'queue_counters'
];

const username = process.env.DTD_BACKUP_USERNAME || process.env.E2E_USERNAME;
const pin = process.env.DTD_BACKUP_PIN || process.env.E2E_PIN;
const baselineCommit = process.env.DTD_BASELINE_COMMIT || 'unknown';

if (!username || !pin) {
  throw new Error('Set DTD_BACKUP_USERNAME and DTD_BACKUP_PIN before running this read-only backup.');
}

const requiredConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

for (const [key, value] of Object.entries(requiredConfig)) {
  if (!value) throw new Error(`Missing Firebase configuration: ${key}`);
}

const encodeFirestoreValue = (value) => {
  if (value === null || value === undefined) return value ?? null;
  if (Array.isArray(value)) return value.map(encodeFirestoreValue);
  if (typeof value !== 'object') return value;

  if (typeof value.toDate === 'function' && typeof value.seconds === 'number') {
    return {
      __firestoreType: 'timestamp',
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
      iso: value.toDate().toISOString()
    };
  }

  if (typeof value.latitude === 'number' && typeof value.longitude === 'number') {
    return { __firestoreType: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  }

  if (typeof value.toBase64 === 'function') {
    return { __firestoreType: 'bytes', base64: value.toBase64() };
  }

  if (typeof value.path === 'string' && value.firestore) {
    return { __firestoreType: 'reference', path: value.path };
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, encodeFirestoreValue(nestedValue)])
  );
};

const sha256 = (content) => crypto.createHash('sha256').update(content).digest('hex');
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const backupRoot = path.resolve(process.cwd(), '..', 'Backups_Tersanjung');
const outputDir = path.join(backupRoot, `firestore_pre_dtd_${timestamp}`);

await fs.mkdir(outputDir, { recursive: true });

const app = initializeApp(requiredConfig, `dtd-read-only-backup-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);
const email = String(username).includes('@')
  ? String(username).trim().toLowerCase()
  : `${String(username).trim().toLowerCase().replace(/\s/g, '')}@tersanjung.local`;

const checksums = [];
const manifest = {
  purpose: 'pre-door-to-door-rbac-patch',
  createdAt: new Date().toISOString(),
  baselineCommit,
  projectId: requiredConfig.projectId,
  mode: 'read-only-client-sdk',
  collections: {}
};

try {
  await signInWithEmailAndPassword(auth, email, pin);

  for (const collectionName of COLLECTIONS) {
    const snapshot = await getDocs(collection(db, collectionName));
    const documents = snapshot.docs.map((documentSnapshot) => ({
      id: documentSnapshot.id,
      data: encodeFirestoreValue(documentSnapshot.data())
    }));
    const json = `${JSON.stringify(documents, null, 2)}\n`;
    const filename = `${collectionName}.json`;
    await fs.writeFile(path.join(outputDir, filename), json, 'utf8');
    const digest = sha256(json);
    checksums.push(`${digest}  ${filename}`);
    manifest.collections[collectionName] = { count: documents.length, sha256: digest };
    console.log(`${collectionName}: ${documents.length}`);
  }

  const configFiles = ['firestore.rules', 'firestore.indexes.json', '.firebaserc', 'firebase.json', '.env.example'];
  for (const filename of configFiles) {
    const source = path.resolve(process.cwd(), filename);
    const destination = path.join(outputDir, filename);
    await fs.copyFile(source, destination);
    const content = await fs.readFile(destination);
    checksums.push(`${sha256(content)}  ${filename}`);
  }

  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(path.join(outputDir, 'manifest.json'), manifestJson, 'utf8');
  checksums.push(`${sha256(manifestJson)}  manifest.json`);
  await fs.writeFile(path.join(outputDir, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`, 'utf8');
  console.log(`BACKUP_DIR=${outputDir}`);
} finally {
  if (auth.currentUser) await signOut(auth);
}
