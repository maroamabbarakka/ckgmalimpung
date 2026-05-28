import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

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
    if (ops >= 400) {
      console.log(`Mengirim batch delete (${ops} dokumen)...`);
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) {
    console.log(`Mengirim batch delete terakhir (${ops} dokumen)...`);
    await batch.commit();
  }
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

  console.log(`Menghubungkan ke Firebase: ${firebaseConfig.projectId}`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const collections = ['patients', 'visits'];
  const docsToDelete = [];
  const summary = {};

  for (const colName of collections) {
    console.log(`Memindai data dummy di koleksi: ${colName}...`);
    const q = query(collection(db, colName), where('isDummy', '==', true));
    const snapshot = await getDocs(q);
    
    summary[colName] = snapshot.size;
    snapshot.forEach((docSnap) => {
      docsToDelete.push({ collectionName: colName, id: docSnap.id });
    });
  }

  console.log('\n--- RINGKASAN PEMINDAIAN DATA DUMMY ---');
  console.log(`Mode: ${WRITE ? 'EXECUTE (DELETE FROM FIRESTORE)' : 'DRY RUN (HANYA MEMINDAI)'}`);
  console.log('Jumlah data dummy terdeteksi:', summary);
  console.log(`Total dokumen dummy yang akan dihapus: ${docsToDelete.length}`);

  if (!WRITE) {
    console.log('\n>>> Jalankan dengan flag "--write" untuk mengeksekusi penghapusan fisik.');
    console.log('Contoh: node scripts/deleteDummyData.js --write');
    process.exit(0);
  }

  if (docsToDelete.length === 0) {
    console.log('\nTidak ada data dummy yang perlu dihapus. Selesai.');
    process.exit(0);
  }

  console.log(`\nMemulai penghapusan ${docsToDelete.length} dokumen dummy dari Cloud Firestore secara batch...`);
  const deleted = await commitDeletes(db, docsToDelete);
  console.log(`\nSelesai! Berhasil menghapus ${deleted} dokumen dummy dari Cloud Firestore.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Gagal menghapus data dummy:', error);
  process.exit(1);
});
