import fs from 'node:fs/promises';
import process from 'node:process';
import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { chromium } from '@playwright/test';
import { CKG_TARGET_SCHOOLS_SCOPE } from '../src/features/schools/schoolScope.js';

dotenv.config();

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const headless = !args.has('--headed');
const year = process.env.DAPODIK_ACADEMIC_YEAR || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
const template = process.env.DAPODIK_PUBLIC_URL_TEMPLATE || 'https://referensi.data.kemendikdasmen.go.id/residu/satuanpendidikan/detail/{NPSN}';
const output = process.env.DAPODIK_SYNC_REPORT || `dapodik-sync-${year.replace('/', '-')}.json`;

async function getAdminDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credential = raw
      ? cert(JSON.parse(raw))
      : cert(await readServiceAccount(process.env.GOOGLE_APPLICATION_CREDENTIALS));
    initializeApp({ credential });
  }
  return getFirestore();
}

async function readServiceAccount(file) {
  if (!file) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS atau FIREBASE_SERVICE_ACCOUNT_JSON.');
  // Synchronous read is intentional during CLI startup, before any data access.
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function clean(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }

/**
 * Ekstraksi jumlah peserta didik secara defensif dan spesifik dari portal Residu Kemendikdasmen.
 * 
 * Aturan Penting:
 * - Explicit 0 ('Peserta Didik [Total] : 0') => 0 (nilai valid)
 * - Elemen tidak ditemukan atau pola tidak cocok => null (bukan 0)
 * - Jangan mengambil angka terbesar acak dari halaman jika pola tidak cocok.
 */
function extractStudentCount(text) {
  if (!text || typeof text !== 'string') return null;

  // Pola utama resmi: Peserta Didik [Total] : <angka>
  const matchResidu = text.match(/Peserta Didik\s*\[Total\]\s*:\s*(\d+)/i);
  if (matchResidu) {
    const val = Number(matchResidu[1]);
    return Number.isInteger(val) && val >= 0 ? val : null;
  }

  // Pola sekunder berbasis label tabel: Peserta Didik : <angka>
  const matchPesertaDidik = text.match(/Peserta Didik\s*:\s*(\d+)/i);
  if (matchPesertaDidik) {
    const val = Number(matchPesertaDidik[1]);
    return Number.isInteger(val) && val >= 0 ? val : null;
  }

  return null;
}

async function main() {
  let db = null;
  let schools = [];
  try {
    db = await getAdminDb();
    const snapshot = await db.collection('schools').get();
    schools = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((school) => /^\d{8}$/.test(clean(school.npsn)));
  } catch (err) {
    if (apply) {
      throw new Error(`Mode --apply membutuhkan kredensial Firebase Admin: ${err.message}`);
    }
    console.warn(`[DRY-RUN INFO] Kredensial Firebase Admin tidak terdeteksi (${err.message}).`);
    console.log('[DRY-RUN INFO] Menjalankan simulasi scraping pada 16 sekolah sasaran resmi CKG Malimpung...');
    schools = CKG_TARGET_SCHOOLS_SCOPE.map((s) => ({ id: `target_${s.npsn}`, ...s }));
  }

  if (!schools.length) throw new Error('Tidak ada sekolah dengan NPSN 8 digit di koleksi schools.');

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage({ userAgent: 'CKG-Malimpung-KemendikdasmenSync/1.0 (administrative use)' });
  const results = [];
  for (const school of schools) {
    const npsn = clean(school.npsn);
    const url = template.replace('{NPSN}', encodeURIComponent(npsn));
    const result = { schoolId: school.id, schoolName: school.name || '-', npsn, url, status: 'parser_error' };
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1200);
      const text = await page.locator('body').innerText();
      if (/kesalahan\s*\(#?\d+\)|terjadi kesalahan internal server|internal server error/i.test(text)) {
        result.httpStatus = response?.status() ?? null;
        result.status = 'portal_error';
        result.error = 'Portal publik mengembalikan halaman error, bukan data sekolah.';
        results.push(result);
        console.log(`${result.status.padEnd(12)} ${npsn} ${result.schoolName}`);
        continue;
      }
      const totalStudents = extractStudentCount(text);
      result.httpStatus = response?.status() ?? null;
      result.totalStudents = totalStudents;
      result.status = totalStudents === null ? 'parser_error' : 'ready';

      // Hanya update jika totalStudents valid (angka integer >= 0, termasuk eksplisit 0).
      // Jangan pernah overwrite data lama jika parsing menghasilkan null.
      if (totalStudents !== null && apply) {
        const existingSnapshots = school.studentSnapshots || {};
        await db.collection('schools').doc(school.id).set({
          totalStudents,
          source: 'Kemendikdasmen Residu',
          syncedAt: new Date().toISOString(),
          studentSnapshots: {
            ...existingSnapshots,
            [year]: {
              totalStudents,
              source: 'Kemendikdasmen Residu',
              sourceUrl: url,
              syncedAt: new Date().toISOString()
            }
          },
          lastUpdated: new Date().toISOString(),
          dapodikSync: { status: 'success', year, syncedAt: FieldValue.serverTimestamp(), source: 'Kemendikdasmen Residu' }
        }, { merge: true });
        result.status = 'applied';
      }
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
    }
    results.push(result);
    console.log(`${result.status.padEnd(12)} ${npsn} ${result.schoolName} ${result.totalStudents !== null ? `${result.totalStudents} siswa` : 'tidak ditemukan'}`);
  }
  await browser.close();
  const report = { generatedAt: new Date().toISOString(), academicYear: year, mode: apply ? 'apply' : 'dry-run', total: results.length, results };
  await fs.writeFile(output, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nLaporan: ${output}`);
  console.log(apply ? 'Snapshot tersimpan. Data tahun sebelumnya tetap dipertahankan.' : 'DRY-RUN: tidak ada data Firebase yang diubah. Gunakan --apply setelah memeriksa laporan.');
}

main().catch((error) => { console.error(`Sinkronisasi gagal: ${error.message}`); process.exitCode = 1; });
