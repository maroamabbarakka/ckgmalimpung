import fs from 'node:fs/promises';
import process from 'node:process';
import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { chromium } from '@playwright/test';

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
function extractStudentCount(text) {
  const normalized = clean(text).replace(/\./g, '');
  const matchResidu = text.match(/Peserta Didik\s*\[Total\]\s*:\s*(\d+)/i);
  if (matchResidu) {
    return Number(matchResidu[1]);
  }
  const patterns = [
    /(?:jumlah|total)\s+(?:peserta didik|pd|siswa)[^\d]{0,80}(\d{1,5})/gi,
    /(?:peserta didik|siswa)[^\d]{0,80}(\d{1,5})/gi
  ];
  const candidates = [];
  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      const value = Number(match[1]);
      if (Number.isInteger(value) && value >= 0 && value <= 100000) candidates.push(value);
    }
  }
  return candidates.length ? Math.max(...candidates) : null;
}

async function main() {
  const db = await getAdminDb();
  const snapshot = await db.collection('schools').get();
  const schools = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((school) => /^\d{8}$/.test(clean(school.npsn)));
  if (!schools.length) throw new Error('Tidak ada sekolah dengan NPSN 8 digit di koleksi schools.');

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage({ userAgent: 'CKG-Malimpung-DapodikSync/1.0 (administrative use)' });
  const results = [];
  for (const school of schools) {
    const npsn = clean(school.npsn);
    const url = template.replace('{NPSN}', encodeURIComponent(npsn));
    const result = { schoolId: school.id, schoolName: school.name || '-', npsn, url, status: 'not_found' };
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1200);
      const text = await page.locator('body').innerText();
      if (/kesalahan\s*\(#?\d+\)|terjadi kesalahan internal server|internal server error/i.test(text)) {
        result.httpStatus = response?.status() ?? null;
        result.status = 'portal_error';
        result.error = 'Portal publik mengembalikan halaman error, bukan data sekolah.';
        results.push(result);
        console.log(`${result.status.padEnd(10)} ${npsn} ${result.schoolName}`);
        continue;
      }
      const totalStudents = extractStudentCount(text);
      result.httpStatus = response?.status() ?? null;
      result.totalStudents = totalStudents;
      result.status = totalStudents === null ? 'not_found' : 'ready';
      if (totalStudents !== null && apply) {
        await db.collection('schools').doc(school.id).set({
          studentSnapshots: {
            ...(school.studentSnapshots || {}),
            [year]: {
              totalStudents,
              source: 'Dapodik Public Portal',
              sourceUrl: url,
              syncedAt: new Date().toISOString()
            }
          },
          lastUpdated: new Date().toISOString(),
          dapodikSync: { status: 'success', year, syncedAt: FieldValue.serverTimestamp(), source: 'public-portal' }
        }, { merge: true });
        result.status = 'applied';
      }
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
    }
    results.push(result);
    console.log(`${result.status.padEnd(10)} ${npsn} ${result.schoolName} ${result.totalStudents ?? '-'} siswa`);
  }
  await browser.close();
  const report = { generatedAt: new Date().toISOString(), academicYear: year, mode: apply ? 'apply' : 'dry-run', total: results.length, results };
  await fs.writeFile(output, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nLaporan: ${output}`);
  console.log(apply ? 'Snapshot tersimpan. Data tahun sebelumnya tetap dipertahankan.' : 'DRY-RUN: tidak ada data Firebase yang diubah. Gunakan --apply setelah memeriksa laporan.');
}

main().catch((error) => { console.error(`Sinkronisasi gagal: ${error.message}`); process.exitCode = 1; });
