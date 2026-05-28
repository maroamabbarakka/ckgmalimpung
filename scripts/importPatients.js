import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getFirestore,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

const POS_LIST = ['Pos 1', 'Pos 2', 'Pos 3', 'Pos 4', 'Pos 5', 'Pos 6', 'Pos 7'];

const REGISTRY = {
  POS2: ['berat badan', 'tinggi badan', 'panjang badan', 'lingkar kepala', 'lingkar betis', 'imt', 'index massa tubuh', 'tekanan darah', 'sistolik', 'diastolik', 'lingkar perut', 'lila', 'suhu', 'nadi', 'napas', 'gula darah', 'gds', 'gdp', 'hba1c', 'hb1ac', 'bb/u', 'pb/u', 'tb/u', 'bb/pb', 'bb/tb'],
  POS3: ['mata', 'visus', 'pupil', 'pinhole', 'kacamata', 'juling', 'penglihatan', 'daya lihat', 'e-tumbling', 'snellen', 'telinga', 'pendengaran', 'serumen', 'berbisik', 'dengar', 'otoskop', 'penala', 'gigi', 'karies', 'periodontal', 'goyang', 'mulut', 'jantung bawaan', 'empedu', 'ikterus', 'tinja'],
  POS4: ['kolesterol', 'ldl', 'hdl', 'trigliserida', 'asam urat', 'dislipidemia', 'hepatitis', 'hcv', 'hbsag', 'hiv', 'sifilis', 'malaria', 'transfusi', 'cuci darah', 'hemodialisa', 'kencing nanah', 'gonore', 'talasemia', 'hemoglobin', 'mcv', 'mch', 'eritrosit', 'rbc', 'rdw', 'shk', 'g6pd', 'hak', 'hipotiroid', 'adrenal kongenital'],
  POS6: ['minicog', 'mini-cog', 'menggambar jam', 'depresi', 'sdq', 'srq', 'emosi', 'khawatir', 'cemas', 'adl', 'ad-8', 'ad8', 'sppb', 'spbb', 'risiko jatuh', 'mna', 'mnasf', 'skilas', 'kognitif', 'kpsp', 'autisme', 'm-chat', 'kmpe', 'gpph', 'tantrum', 'impulsif', 'perilaku', 'mengingat', 'berkurang >3 kg', 'penurunan berat badan', 'berapa nilai imt', 'gangguan memori', 'klien/pasien lansia', 'membersihkan diri', 'keputusan', 'hobi', 'lupa nama bulan', 'mengatur keuangan', 'mengingat janji', 'nafsu makan', 'mobilitas', 'neuropsikologis', 'psikologis', 'berdiri dari kursi', 'keseimbangan', 'tandem', 'kecepatan berjalan', 'buang air besar', 'berkemih', 'jamban', 'makan dan minum', 'berbaring ke duduk', 'memakai baju', 'naik turun tangga', 'mandi', 'sedih', 'minat', 'kesenangan', 'puas dengan kehidupan', 'bosan', 'tidak berdaya', 'tidak berharga'],
  POS5_SPECIFIC: ['batuk', 'tb', 'tbc', 'tuberkulosis', 'keringat malam', 'demam', 'lesu', 'dahak', 'nafsu makan', 'mantoux', 'indurasi', 'pembesaran kelenjar', 'pembengkakan tulang', 'spirometri', 'puma', 'tcm', 'bta', 'skoring tb', 'sadanis', 'inspekulo', 'iva', 'dna hpv', 'ekg', 'bercak', 'putih mati rasa', 'kudis', 'skabies', 'koreng', 'gatal', 'kusta', 'frambusia', 'olahraga', 'merokok', 'alkohol', 'sayur', 'buah', 'narkoba', 'hubungan seksual', 'hubungan intim', 'aktif', 'terbangun', 'haus', 'lapar', 'mengompol', 'napas pendek']
};

function classifyQuestion(questionText) {
  const text = String(questionText || '').toLowerCase();
  const isP2 = REGISTRY.POS2.some((keyword) => text.includes(keyword));
  if (isP2) return 'pos2';
  const isP3 = REGISTRY.POS3.some((keyword) => text.includes(keyword));
  if (isP3) return 'pos3';
  const isP4 = REGISTRY.POS4.some((keyword) => text.includes(keyword));
  if (isP4) return 'pos4';
  const isP6 = REGISTRY.POS6.some((keyword) => text.includes(keyword));
  if (isP6) return 'pos6';
  return 'pos5'; // Default ke Pos 5
}

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

function formatPhone(phoneVal) {
  let val = String(phoneVal || '').trim();
  if (!val || val === '0' || val.includes('0000000')) return '080000000000';
  if (val.startsWith('62')) val = '0' + val.slice(2);
  if (!val.startsWith('0')) val = '08' + val;
  return val;
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

  const xlsxPath = path.join(ROOT, 'src', 'docs', 'CKG_Tersanjung_Import_CKGMalimpung_FormSchema.xlsx');
  
  if (!fs.existsSync(xlsxPath)) {
    console.error(`ERROR: File Excel tidak ditemukan di: ${xlsxPath}`);
    process.exit(1);
  }

  console.log(`Membaca workbook Excel: ${xlsxPath}`);
  const workbook = XLSX.readFile(xlsxPath);

  // 1. Ambil data dari sheet
  const patientsSheet = workbook.Sheets['PATIENTS_IMPORT'];
  const visitsSheet = workbook.Sheets['VISITS_IMPORT'];
  const responsesSheet = workbook.Sheets['FORM_RESPONSES_LONG'];

  if (!patientsSheet || !visitsSheet || !responsesSheet) {
    console.error('ERROR: Sheet PATIENTS_IMPORT, VISITS_IMPORT, atau FORM_RESPONSES_LONG tidak ditemukan!');
    process.exit(1);
  }

  const rawPatients = XLSX.utils.sheet_to_json(patientsSheet);
  const rawVisits = XLSX.utils.sheet_to_json(visitsSheet);
  const rawResponses = XLSX.utils.sheet_to_json(responsesSheet);

  console.log(`Jumlah Pasien di Excel: ${rawPatients.length}`);
  console.log(`Jumlah Kunjungan di Excel: ${rawVisits.length}`);
  console.log(`Jumlah Jawaban di Excel: ${rawResponses.length}`);

  // 2. Kelompokkan respon pertanyaan berdasarkan visit_id
  console.log('Mengelompokkan respon pertanyaan...');
  const responsesByVisit = {};
  rawResponses.forEach((res) => {
    const vId = res.visit_id;
    if (!responsesByVisit[vId]) {
      responsesByVisit[vId] = [];
    }
    responsesByVisit[vId].push(res);
  });

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  let batch = writeBatch(db);
  let ops = 0;

  console.log(`\nMode: ${WRITE ? 'EXECUTE (SIMPAN KE FIRESTORE)' : 'DRY RUN (HANYA SIMULASI)'}`);

  // 3. Impor data patients
  console.log('\nMemproses data Pasien (patients)...');
  const dummyMeta = {
    isDummy: true,
    importBatch: 'CKG_TERSANJUNG_2026',
    importSource: 'Excel Import',
    importDate: Timestamp.now(),
    importVersion: '1.0'
  };

  const formattedPatients = rawPatients.map((p) => {
    const formattedGender = String(p.gender || '').trim().toLowerCase() === 'laki-laki' ? 'L' : 'P';
    const formattedPhone = formatPhone(p.phone);

    return {
      nik: String(p.nik).trim(),
      name: String(p.name).trim(),
      birthDate: String(p.birthDate).trim(),
      gender: formattedGender,
      phone: formattedPhone,
      status_perkawinan: String(p.status_perkawinan || 'Belum Kawin').toUpperCase(),
      desa: String(p.desa || 'Desa Malimpung').trim(),
      dusun: String(p.dusun || 'Dusun Malimpung').trim(),
      lastUpdated: Timestamp.now(),
      ...dummyMeta
    };
  });

  if (WRITE) {
    for (const pat of formattedPatients) {
      const docRef = doc(collection(db, 'patients'), pat.nik);
      batch.set(docRef, pat, { merge: true });
      ops += 1;

      if (ops >= 400) {
        console.log(`Mengirim batch patients (${ops} operasi)...`);
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
  }

  // 4. Impor data visits & form responses
  console.log('\nMemproses data Kunjungan (visits)...');
  
  const formattedVisits = rawVisits.map((v, index) => {
    // Algoritma Round-Robin untuk distribusi pos yang merata
    const targetPos = POS_LIST[index % POS_LIST.length];
    
    // Sesuaikan status antrean dan workflow status
    let status_antrian = `Antri ${targetPos}`;
    let workflow_status = `${targetPos.replace(' ', '').toUpperCase()}_IN_PROGRESS`;

    const formattedGender = String(v.j_kelamin || '').trim().toLowerCase() === 'laki-laki' ? 'L' : 'P';
    const formattedPhone = formatPhone(v.no_hp);

    const visitId = String(v.visit_id).trim();

    // Buat template dokumen kunjungan dasar
    const visitDoc = {
      seed_dummy: true,
      seed_batch: 'CKG_TERSANJUNG_2026',
      seed_form: String(v.form_name).trim(),
      nomor_antrian: String(v.nomor_antrian || '').trim(),
      status_antrian,
      workflow_status,
      assigned_pos: targetPos,
      patientNIK: String(v.patientNIK).trim(),
      kategori_usia_satusehat: String(v.kategori_usia || 'Dewasa').trim(),
      umur_saat_periksa: Number(v.umur_tahun || 0),
      tanggal_pelaksanaan: String(v.tanggal_pelaksanaan).trim(),
      tanggal_kunjungan: Timestamp.fromDate(new Date(v.tanggal_pelaksanaan)),
      waktu_ambil_tiket: Timestamp.fromDate(new Date(v.tanggal_pelaksanaan + 'T08:00:00+08:00')),
      tempat_pelaksanaan: String(v.tempat_pelaksanaan || 'Dusun Malimpung').trim(),
      desa_pelaksanaan: String(v.desa_pelaksanaan || 'Desa Malimpung').trim(),
      pasien_snapshot: {
        nama: String(v.nama).trim(),
        j_kelamin: formattedGender,
        tgl_lahir: String(v.tgl_lahir).trim(),
        desa: String(v.desa_pelaksanaan || 'Desa Malimpung').trim(),
        dusun: String(v.tempat_pelaksanaan || 'Dusun Malimpung').trim(),
        no_hp: formattedPhone,
        status: String(v.status_perkawinan || 'Belum Kawin').toUpperCase()
      },
      pos1: {
        nik: String(v.patientNIK).trim(),
        nama: String(v.nama).trim(),
        tgl_lahir: String(v.tgl_lahir).trim(),
        j_kelamin: formattedGender,
        no_hp: formattedPhone,
        desa: String(v.desa_pelaksanaan || 'Desa Malimpung').trim(),
        dusun: String(v.tempat_pelaksanaan || 'Dusun Malimpung').trim(),
        sekolah: '',
        kelas: '',
        form_schema: String(v.form_name).trim()
      },
      petugas_pos1: 'Excel Importer',
      petugas_aktif: null,
      updatedAt: Timestamp.now(),
      ...dummyMeta
    };

    // Petakan respon jawaban (jika ada) ke pos-pos
    const myResponses = responsesByVisit[visitId] || [];
    myResponses.forEach((res) => {
      const posKey = classifyQuestion(res.question_text);
      
      if (!visitDoc[posKey]) {
        visitDoc[posKey] = {};
        visitDoc[`${posKey}_question_map`] = {};
      }

      // Gunakan nilai normal/netral jika kosong
      let ans = res.answer;
      if (ans === undefined || ans === null || String(ans).trim() === '') {
        const text = String(res.question_text).toLowerCase();
        if (text.includes('karies') || text.includes('gigi')) {
          ans = 'Tidak Karies';
        } else if (text.includes('normal') || text.includes('sesuai')) {
          ans = 'Normal';
        } else if (text.includes('negatif')) {
          ans = 'Negatif';
        } else if (res.answer_type === 'number') {
          ans = text.includes('sistolik') ? 120 : text.includes('diastolik') ? 80 : text.includes('gula') ? 95 : 1;
        } else {
          ans = 'Tidak';
        }
      }

      visitDoc[posKey][res.question_id] = ans;
      visitDoc[`${posKey}_question_map`][res.question_id] = res.question_text;
      visitDoc[`petugas_${posKey}`] = 'Excel Importer';
    });

    // Validasi penanggung jawab untuk pos 7 / selesai
    if (targetPos === 'Pos 7') {
      visitDoc.kesimpulan_dokter = 'Hasil skrining lengkap terimpor dari CKG Tersanjung. Seluruh indikator berada dalam batas normal/rujukan.';
      visitDoc.dokter_pemeriksa = 'dr. Excel Importer';
    }

    return { id: visitId, data: visitDoc };
  });

  if (WRITE) {
    for (const vis of formattedVisits) {
      const docRef = doc(collection(db, 'visits'), vis.id);
      batch.set(docRef, vis.data, { merge: true });
      ops += 1;

      if (ops >= 400) {
        console.log(`Mengirim batch visits (${ops} operasi)...`);
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
  }

  // Kirim sisa batch operasi
  if (WRITE && ops > 0) {
    console.log(`Mengirim batch terakhir (${ops} operasi)...`);
    await batch.commit();
  }

  console.log('\n--- RINGKASAN IMPOR ---');
  console.log(`Total Pasien Diproses   : ${formattedPatients.length}`);
  console.log(`Total Kunjungan Diproses : ${formattedVisits.length}`);
  if (WRITE) {
    console.log('✅ SUKSES: Semua data pasien dummy berhasil disimpan ke Cloud Firestore!');
  } else {
    console.log('ℹ️ DRY RUN SELESAI: Jalankan dengan flag "--write" untuk menyimpan data ke database.');
    console.log('Contoh: node scripts/importPatients.js --write');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Gagal menjalankan impor:', error);
  process.exit(1);
});
