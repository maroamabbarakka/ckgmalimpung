import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import https from 'node:https';
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
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'ckg-malimpung';

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Konversi nilai JavaScript ke Firestore REST API Value.
 */
function valToFirestore(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(valToFirestore) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = valToFirestore(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Konversi Firestore REST API field ke JavaScript Value.
 */
function firestoreToJs(field) {
  if (!field) return null;
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return field.doubleValue;
  if ('booleanValue' in field) return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('nullValue' in field) return null;
  if ('arrayValue' in field) {
    return (field.arrayValue?.values || []).map(firestoreToJs);
  }
  if ('mapValue' in field) {
    const res = {};
    for (const [k, v] of Object.entries(field.mapValue?.fields || {})) {
      res[k] = firestoreToJs(v);
    }
    return res;
  }
  return null;
}

/**
 * Mencoba membaca token Firebase CLI dari configstore lokal.
 */
function getLocalFirebaseCliToken() {
  try {
    const cfgPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
    if (fsSync.existsSync(cfgPath)) {
      const cfg = JSON.parse(fsSync.readFileSync(cfgPath, 'utf8'));
      return cfg.tokens?.access_token || null;
    }
  } catch {
    // Abaikan jika tidak ditemukan
  }
  return null;
}

/**
 * Klien abstraksi Firestore yang mendukung Firebase Admin SDK dan REST API.
 */
async function getFirestoreAdapter() {
  // 1. Coba Firebase Admin SDK via Service Account
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (raw || saPath) {
      if (!getApps().length) {
        const credential = raw
          ? cert(JSON.parse(raw))
          : cert(JSON.parse(await fs.readFile(saPath, 'utf8')));
        initializeApp({ credential });
      }
      const adminDb = getFirestore();
      return {
        mode: 'admin_sdk',
        async listSchools() {
          const snapshot = await adminDb.collection('schools').get();
          return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        },
        async upsertSchool(docId, payload) {
          await adminDb.collection('schools').doc(docId).set({
            ...payload,
            dapodikSync: {
              ...payload.dapodikSync,
              syncedAt: FieldValue.serverTimestamp()
            }
          }, { merge: true });
        }
      };
    }
  } catch (err) {
    console.warn(`[INFO] Admin SDK init gagal (${err.message}), mencoba metode REST API...`);
  }

  // 2. Coba Firebase REST API via Access Token
  const token = process.env.FIREBASE_TOKEN || getLocalFirebaseCliToken();
  if (token) {
    return {
      mode: 'rest_api',
      async listSchools() {
        return new Promise((resolve, reject) => {
          const req = https.request(
            `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/schools`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` }
            },
            (res) => {
              let body = '';
              res.on('data', (c) => { body += c; });
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  const data = JSON.parse(body);
                  const docs = (data.documents || []).map((doc) => {
                    const id = doc.name.split('/').pop();
                    const jsData = {};
                    for (const [k, v] of Object.entries(doc.fields || {})) {
                      jsData[k] = firestoreToJs(v);
                    }
                    return { id, ...jsData };
                  });
                  resolve(docs);
                } else {
                  reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
              });
            }
          );
          req.on('error', reject);
          req.end();
        });
      },
      async upsertSchool(docId, payload) {
        return new Promise((resolve, reject) => {
          const fields = {};
          const fieldPaths = [];
          for (const [k, v] of Object.entries(payload)) {
            if (v !== undefined) {
              fields[k] = valToFirestore(v);
              fieldPaths.push(`updateMask.fieldPaths=${encodeURIComponent(k)}`);
            }
          }
          const maskQuery = fieldPaths.join('&');
          const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/schools/${encodeURIComponent(docId)}?${maskQuery}`;

          const req = https.request(
            url,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            },
            (res) => {
              let body = '';
              res.on('data', (c) => { body += c; });
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve(JSON.parse(body));
                } else {
                  reject(new Error(`Gagal upsert dokumen ${docId} (HTTP ${res.statusCode}): ${body}`));
                }
              });
            }
          );
          req.on('error', reject);
          req.write(JSON.stringify({ fields }));
          req.end();
        });
      }
    };
  }

  return null;
}

/**
 * Ekstraksi jumlah peserta didik secara defensif dan spesifik dari portal Residu Kemendikdasmen.
 * 
 * Aturan Wajib:
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
  console.log(`[SYNC] Memulai sinkronisasi Dapodik Kemendikdasmen untuk tahun ajaran ${year}`);
  console.log(`[SYNC] Mode eksekusi: ${apply ? 'APPLY (Menyimpan langsung ke database Firestore)' : 'DRY-RUN (Simulasi)'}`);

  const adapter = await getFirestoreAdapter();

  if (apply && !adapter) {
    throw new Error('Mode --apply membutuhkan kredensial Firebase Admin SDK atau Firebase CLI Token.');
  }

  if (adapter) {
    console.log(`[SYNC] Terhubung ke Firestore menggunakan adapter: ${adapter.mode}`);
  } else {
    console.log('[SYNC] Menjalankan dry-run tanpa koneksi database.');
  }

  // 1. Baca seluruh dokumen schools existing bila database terhubung
  let existingSchools = [];
  if (adapter) {
    try {
      existingSchools = await adapter.listSchools();
      console.log(`[SYNC] Ditemukan ${existingSchools.length} dokumen di koleksi 'schools'.`);
    } catch (err) {
      console.warn(`[SYNC WARNING] Gagal membaca koleksi 'schools': ${err.message}`);
    }
  }

  // Kelompokkan dokumen existing berdasarkan NPSN
  const existingByNpsn = new Map();
  for (const s of existingSchools) {
    const n = clean(s.npsn);
    if (n) {
      if (!existingByNpsn.has(n)) existingByNpsn.set(n, []);
      existingByNpsn.get(n).push(s);
    }
  }

  // 2. Sumber daftar NPSN untuk sinkronisasi HARUS SELALU 16 target resmi
  const targetScope = CKG_TARGET_SCHOOLS_SCOPE;
  console.log(`[SYNC] Memproses ${targetScope.length} satuan pendidikan sasaran resmi CKG Malimpung...\n`);

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage({ userAgent: 'CKG-Malimpung-KemendikdasmenSync/1.0 (administrative use)' });
  const results = [];

  for (const target of targetScope) {
    const npsn = clean(target.npsn);
    const url = template.replace('{NPSN}', encodeURIComponent(npsn));

    // Cari existing docs
    const matchingDocs = existingByNpsn.get(npsn) || [];
    let representativeDoc = null;
    let targetDocId = null;

    if (matchingDocs.length > 0) {
      // Pilih representative secara deterministik
      const sorted = [...matchingDocs].sort((a, b) => {
        const aSnapshots = Object.keys(a.studentSnapshots || {}).length;
        const bSnapshots = Object.keys(b.studentSnapshots || {}).length;
        if (bSnapshots !== aSnapshots) return bSnapshots - aSnapshots;
        const aUpdated = a.lastUpdated || a.syncedAt || '';
        const bUpdated = b.lastUpdated || b.syncedAt || '';
        return String(bUpdated).localeCompare(String(aUpdated));
      });
      representativeDoc = sorted[0];
      targetDocId = representativeDoc.id;
    } else {
      // Belum ada dokumen, buatkan ID baru yang aman dan deterministik
      targetDocId = `school_${npsn}`;
    }

    const result = {
      npsn,
      schoolId: targetDocId,
      schoolName: target.name,
      level: target.level,
      desa: target.desa,
      url,
      status: 'parser_error',
      totalStudents: null
    };

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1200);
      const text = await page.locator('body').innerText();

      if (/kesalahan\s*\(#?\d+\)|terjadi kesalahan internal server|internal server error/i.test(text)) {
        result.httpStatus = response?.status() ?? null;
        result.status = 'portal_error';
        result.error = 'Portal publik mengembalikan pesan internal server error.';
        results.push(result);
        console.log(`${result.status.padEnd(12)} ${npsn} ${result.schoolName}`);
        continue;
      }

      const totalStudents = extractStudentCount(text);
      result.httpStatus = response?.status() ?? null;
      result.totalStudents = totalStudents;
      result.status = totalStudents === null ? 'parser_error' : 'ready';

      // Jika parsing sukses (termasuk eksplisit 0), dan mode --apply aktif:
      if (totalStudents !== null && apply && adapter) {
        const existingSnapshots = representativeDoc?.studentSnapshots || {};
        const nowIso = new Date().toISOString();

        const payload = {
          npsn: target.npsn,
          name: target.name,
          level: target.level,
          status: target.status,
          address: target.address,
          desa: target.desa,
          totalStudents,
          source: 'Kemendikdasmen Residu',
          sourceUrl: url,
          syncedAt: nowIso,
          studentSnapshots: {
            ...existingSnapshots,
            [year]: {
              totalStudents,
              source: 'Kemendikdasmen Residu',
              sourceUrl: url,
              syncedAt: nowIso
            }
          },
          lastUpdated: nowIso,
          dapodikSync: {
            status: 'success',
            year,
            syncedAt: nowIso,
            source: 'Kemendikdasmen Residu'
          }
        };

        await adapter.upsertSchool(targetDocId, payload);
        result.status = 'applied';
      }
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
    }

    results.push(result);
    const displayCount = result.totalStudents !== null ? `${result.totalStudents} siswa` : 'tidak ditemukan';
    console.log(`${result.status.padEnd(12)} ${npsn} ${result.schoolName.padEnd(35)} : ${displayCount}`);
  }

  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    academicYear: year,
    mode: apply ? 'apply' : 'dry-run',
    adapter: adapter?.mode || 'none',
    total: results.length,
    results
  };

  await fs.writeFile(output, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nLaporan tersimpan di: ${output}`);
  console.log(apply ? 'Snapshot tersimpan ke database. Data tahun sebelumnya tetap dipertahankan.' : 'DRY-RUN selesai. Tidak ada data database yang diubah.');
}

main().catch((error) => {
  console.error(`Sinkronisasi gagal: ${error.message}`);
  process.exitCode = 1;
});
