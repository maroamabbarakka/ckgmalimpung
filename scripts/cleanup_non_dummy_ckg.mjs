import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const KEEP_BATCH = 'CKG_SMART_FILL_FULL_FORMS_2026_05_13';
const TARGET_COLLECTIONS = ['patients', 'visits'];

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  return Object.fromEntries(
    raw.split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [key, ...rest] = line.split('=');
        return [key, rest.join('=')];
      })
  );
}

async function commitDeletes(db, docsToDelete) {
  let batch = writeBatch(db);
  let ops = 0;
  let deleted = 0;

  for (const item of docsToDelete) {
    batch.delete(doc(db, item.collectionName, item.id));
    ops += 1;
    deleted += 1;
    if (ops >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return deleted;
}

async function main() {
  const env = loadEnv();
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const docsToDelete = [];
  const summary = {};

  for (const collectionName of TARGET_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, collectionName));
    summary[collectionName] = { total: snapshot.size, keep: 0, delete: 0 };

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isKeptDummy = data.seed_dummy === true && data.seed_batch === KEEP_BATCH;
      if (isKeptDummy) {
        summary[collectionName].keep += 1;
      } else {
        summary[collectionName].delete += 1;
        docsToDelete.push({ collectionName, id: docSnap.id });
      }
    });
  }

  console.log(`Mode: ${WRITE ? 'DELETE FIRESTORE' : 'DRY RUN'}`);
  console.log(`Batch dummy yang dipertahankan: ${KEEP_BATCH}`);
  console.log('Ringkasan:', summary);
  console.log(`Total dokumen yang akan dihapus: ${docsToDelete.length}`);

  if (!WRITE) {
    console.log('Contoh 20 dokumen yang akan dihapus:');
    console.log(docsToDelete.slice(0, 20));
    console.log('\nJalankan dengan --write untuk benar-benar menghapus.');
    return;
  }

  const deleted = await commitDeletes(db, docsToDelete);
  console.log(`Selesai menghapus ${deleted} dokumen non-dummy dari patients/visits.`);
}

main().catch((error) => {
  console.error('Gagal cleanup data non-dummy:', error);
  process.exit(1);
});
