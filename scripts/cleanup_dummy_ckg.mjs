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
const TARGET_COLLECTIONS = ['patients', 'visits'];

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local tidak ditemukan di ${ROOT}`);
  }
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

  console.log(`Menghubungkan ke proyek Firebase: ${firebaseConfig.projectId}`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const docsToDelete = [];
  const summary = {};

  for (const collectionName of TARGET_COLLECTIONS) {
    console.log(`Mengambil data dari koleksi: ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));
    summary[collectionName] = { total: snapshot.size, dummy: 0, real: 0 };

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let isDummy = false;
      const reasons = [];

      // 1. Cek flag seed_dummy
      if (data.seed_dummy === true) {
        isDummy = true;
        reasons.push('seed_dummy: true');
      }

      // 2. Cek seed_batch
      if (data.seed_batch && (String(data.seed_batch).includes('dummy') || String(data.seed_batch).includes('CKG_SMART_FILL'))) {
        isDummy = true;
        reasons.push(`seed_batch: ${data.seed_batch}`);
      }

      // 3. Cek ID dokumen (untuk visits)
      if (collectionName === 'visits' && docSnap.id.startsWith('ckg_dummy_visit_')) {
        isDummy = true;
        reasons.push('ID ckg_dummy_visit_*');
      }

      // 4. Cek nomor telepon/WhatsApp dummy (081343511099)
      const dummyPhone = '081343511099';
      if (data.phone === dummyPhone || 
          (data.pasien_snapshot && data.pasien_snapshot.no_hp === dummyPhone) || 
          (data.pos1 && data.pos1.no_hp === dummyPhone)) {
        isDummy = true;
        reasons.push('No HP dummy');
      }

      // 5. Cek teks "dummy" di nama pasien (case-insensitive)
      const nameToCheck = data.name || (data.pasien_snapshot && data.pasien_snapshot.nama) || (data.pos1 && data.pos1.nama);
      if (nameToCheck && String(nameToCheck).toLowerCase().includes('dummy')) {
        isDummy = true;
        reasons.push(`Nama mengandung kata 'dummy': "${nameToCheck}"`);
      }

      // 6. Cek teks "dummy" di bidang lain (dokter, petugas, kesimpulan)
      if (data.dokter_pemeriksa && String(data.dokter_pemeriksa).toLowerCase().includes('dummy')) {
        isDummy = true;
        reasons.push('Dokter mengandung kata \'dummy\'');
      }
      if (data.kesimpulan_dokter && String(data.kesimpulan_dokter).toLowerCase().includes('dummy')) {
        isDummy = true;
        reasons.push('Kesimpulan mengandung kata \'dummy\'');
      }
      for (let i = 1; i <= 7; i++) {
        const petugasKey = `petugas_pos${i}`;
        if (data[petugasKey] && String(data[petugasKey]).toLowerCase().includes('dummy')) {
          isDummy = true;
          reasons.push(`Petugas Pos ${i} mengandung kata 'dummy'`);
          break;
        }
      }

      if (isDummy) {
        summary[collectionName].dummy += 1;
        docsToDelete.push({ 
          collectionName, 
          id: docSnap.id, 
          name: nameToCheck || 'Tanpa Nama',
          reasons
        });
      } else {
        summary[collectionName].real += 1;
      }
    });
  }

  console.log('\n--- RINGKASAN PEMINDAIAN ---');
  console.log(`Mode: ${WRITE ? 'EXECUTE (DELETE FROM FIRESTORE)' : 'DRY RUN (HANYA MEMINDAI)'}`);
  console.log('Statistik per koleksi:', summary);
  console.log(`Total dokumen dummy yang teridentifikasi untuk dihapus: ${docsToDelete.length}`);

  if (!WRITE) {
    console.log('\nPreview 20 dokumen dummy yang akan dihapus:');
    if (docsToDelete.length === 0) {
      console.log('Tidak ada dokumen dummy yang terdeteksi.');
    } else {
      docsToDelete.slice(0, 20).forEach((docInfo, idx) => {
        console.log(`${idx + 1}. [${docInfo.collectionName}] ID: ${docInfo.id} | Nama: ${docInfo.name} | Alasan: ${docInfo.reasons.join(', ')}`);
      });
    }
    console.log('\n>>> Jalankan dengan flag "--write" untuk mengeksekusi penghapusan fisik.');
    console.log('Contoh: node scripts/cleanup_dummy_ckg.mjs --write');
    process.exit(0);
  }

  if (docsToDelete.length === 0) {
    console.log('\nTidak ada dokumen dummy yang perlu dihapus. Selesai.');
    process.exit(0);
  }

  console.log(`\nMemulai penghapusan ${docsToDelete.length} dokumen dari Cloud Firestore secara batch...`);
  const deleted = await commitDeletes(db, docsToDelete);
  console.log(`\nSelesai! Berhasil menghapus ${deleted} dokumen dummy dari Cloud Firestore.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Gagal menjalankan skrip pembersihan data dummy:', error);
  process.exit(1);
});
