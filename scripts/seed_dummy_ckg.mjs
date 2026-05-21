import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  Timestamp,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const COUNT_PER_FORM = Number(process.argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] || 2);
const DUMMY_WA = '081343511099';
const TODAY_ISO = '2026-05-13';
const TODAY_DDMMYYYY = '13/05/2026';

const STATUS_MAPPING = {
  POS1: 'Antri Pos 1',
  POS2: 'Antri Pos 2',
  POS3: 'Antri Pos 3',
  POS4: 'Antri Pos 4',
  POS5: 'Antri Pos 5',
  POS6: 'Antri Pos 6',
  POS7: 'Antri Pos 7',
  SELESAI: 'Selesai'
};

const STATUS_SEQUENCE = [
  STATUS_MAPPING.POS1,
  STATUS_MAPPING.POS2,
  STATUS_MAPPING.POS3,
  STATUS_MAPPING.POS4,
  STATUS_MAPPING.POS5,
  STATUS_MAPPING.POS6,
  STATUS_MAPPING.POS7,
  STATUS_MAPPING.SELESAI
];

const WILAYAH_KERJA = [
  ['Desa Malimpung', 'Dusun Malimpung'],
  ['Desa Malimpung', 'Dusun Palita'],
  ['Desa Malimpung', 'Dusun Pajalele'],
  ['Desa Padang Loang', 'Dusun Padang'],
  ['Desa Padang Loang', 'Dusun Banga'],
  ['Kelurahan Maccirinna', 'Lingkungan Dioang'],
  ['Kelurahan Maccirinna', 'Lingkungan Bulu Dua'],
  ['Kelurahan Maccirinna', 'Lingkungan Paraungan']
];

const SCHOOL_BY_LEVEL = {
  SD: [
    ['UPT SDN 001 Malimpung', 'Kelas 1'],
    ['UPT SDN 002 Padang Loang', 'Kelas 4'],
    ['UPT SDN 003 Maccirinna', 'Kelas 6']
  ],
  SMP: [
    ['UPT SMPN 1 Malimpung', 'Kelas 7'],
    ['UPT SMPN 2 Padang Loang', 'Kelas 8'],
    ['UPT SMPN 3 Maccirinna', 'Kelas 9']
  ],
  SMA: [
    ['SMAN 1 Malimpung', 'Kelas 10'],
    ['SMK Kesehatan Malimpung', 'Kelas 11'],
    ['MA Maccirinna', 'Kelas 12']
  ]
};

const REGISTRY = {
  BLOCKED: ['nama faskes', 'nik', 'nisn', 'nama lengkap', 'tanggal lahir', 'jenis kelamin', 'status perkawinan', 'apabila belum menikah', 'tanggal pemeriksaan', 'kelas', 'nama sekolah', 'jenis sekolah', 'alamat'],
  POS2: ['berat badan', 'tinggi badan', 'panjang badan', 'lingkar kepala', 'lingkar betis', 'imt', 'index massa tubuh', 'tekanan darah', 'sistolik', 'diastolik', 'lingkar perut', 'lila', 'suhu', 'nadi', 'napas', 'gula darah', 'gds', 'gdp', 'hba1c', 'hb1ac', 'diabetes', 'dm', 'bb/u', 'pb/u', 'tb/u', 'bb/pb', 'bb/tb'],
  POS3: ['mata', 'visus', 'pupil', 'pinhole', 'kacamata', 'juling', 'penglihatan', 'daya lihat', 'e-tumbling', 'snellen', 'telinga', 'pendengaran', 'serumen', 'berbisik', 'dengar', 'otoskop', 'penala', 'gigi', 'karies', 'periodontal', 'goyang', 'mulut', 'jantung bawaan', 'empedu', 'ikterus', 'tinja'],
  POS4: ['kolesterol', 'ldl', 'hdl', 'trigliserida', 'asam urat', 'dislipidemia', 'hepatitis', 'hcv', 'hbsag', 'hiv', 'sifilis', 'malaria', 'transfusi', 'cuci darah', 'hemodialisa', 'kencing nanah', 'gonore', 'talasemia', 'hemoglobin', 'mcv', 'mch', 'eritrosit', 'rbc', 'rdw', 'shk', 'g6pd', 'hak', 'hipotiroid', 'adrenal kongenital'],
  POS6: ['minicog', 'mini-cog', 'menggambar jam', 'depresi', 'sdq', 'srq', 'emosi', 'khawatir', 'cemas', 'adl', 'ad-8', 'ad8', 'sppb', 'spbb', 'risiko jatuh', 'mna', 'mnasf', 'skilas', 'kognitif', 'kpsp', 'autisme', 'm-chat', 'kmpe', 'gpph', 'tantrum', 'impulsif', 'perilaku', 'mengingat', 'berkurang >3 kg', 'penurunan berat badan', 'berapa nilai imt', 'gangguan memori', 'klien/pasien lansia', 'membersihkan diri', 'keputusan', 'hobi', 'lupa nama bulan', 'mengatur keuangan', 'mengingat janji', 'nafsu makan', 'mobilitas', 'neuropsikologis', 'psikologis', 'berdiri dari kursi', 'keseimbangan', 'tandem', 'kecepatan berjalan', 'buang air besar', 'berkemih', 'jamban', 'makan dan minum', 'berbaring ke duduk', 'memakai baju', 'naik turun tangga', 'mandi', 'sedih', 'minat', 'kesenangan', 'puas dengan kehidupan', 'bosan', 'tidak berdaya', 'tidak berharga'],
  POS5_SPECIFIC: ['batuk', 'tb', 'tbc', 'tuberkulosis', 'keringat malam', 'demam', 'lesu', 'dahak', 'nafsu makan', 'mantoux', 'indurasi', 'pembesaran kelenjar', 'pembengkakan tulang', 'spirometri', 'puma', 'tcm', 'bta', 'skoring tb', 'sadanis', 'inspekulo', 'iva', 'dna hpv', 'ekg', 'bercak', 'putih mati rasa', 'kudis', 'skabies', 'koreng', 'gatal', 'kusta', 'frambusia', 'olahraga', 'merokok', 'alkohol', 'sayur', 'buah', 'narkoba', 'hubungan seksual', 'hubungan intim', 'aktif', 'terbangun', 'haus', 'lapar', 'mengompol', 'napas pendek']
};

const FORM_PROFILES = {
  BBL: { age: 0, category: 'BBL', gender: 'P', birth: '01/05/2026', names: ['Bayi Nur Azzahra', 'Bayi Andi Malik'] },
  'Balita 1 tahun': { age: 1, category: 'Balita', gender: 'L', birth: '13/05/2025', names: ['Muhammad Alif Pratama', 'Andi Kenzie Malimpung'] },
  'Balita 2 tahun': { age: 2, category: 'Balita', gender: 'P', birth: '13/05/2024', names: ['Nur Aisyah Padang', 'Siti Khadijah Palita'] },
  'Balita 3-6 tahun': { age: 4, category: 'Balita', gender: 'L', birth: '13/05/2022', names: ['Fahri Ramadhan', 'Arkan Maulana'] },
  SD: { age: 8, category: 'SD', gender: 'P', birth: '13/05/2018', names: ['Naila Putri Malimpung', 'Rizky Ananda'] },
  SMP: { age: 13, category: 'SMP', gender: 'L', birth: '13/05/2013', names: ['Ahmad Fadli', 'Nurul Inayah'] },
  SMA: { age: 17, category: 'SMA', gender: 'P', birth: '13/05/2009', names: ['Aulia Rahmah', 'Muhammad Ilham'] },
  'Laki-laki 18-24 tahun': { age: 22, category: 'Dewasa', gender: 'L', birth: '13/05/2004', names: ['Arman Saputra', 'Irfan Maulana'] },
  'Laki-laki 25-39 tahun': { age: 32, category: 'Dewasa', gender: 'L', birth: '13/05/1994', names: ['Syamsul Bahri', 'Rahmat Hidayat'] },
  'Laki-laki 40-44 tahun': { age: 42, category: 'Dewasa', gender: 'L', birth: '13/05/1984', names: ['Hasanuddin', 'Jamaluddin'] },
  'Laki-laki 45-59 tahun': { age: 51, category: 'Dewasa', gender: 'L', birth: '13/05/1975', names: ['Abdul Rahman', 'Baharuddin'] },
  'Laki-laki >=60 tahun': { age: 66, category: 'Lansia', gender: 'L', birth: '13/05/1960', names: ['Haji Muhammad Yusuf', 'Puang La Mappasessu'] },
  'Perempuan 18-24 tahun': { age: 21, category: 'Dewasa', gender: 'P', birth: '13/05/2005', names: ['Nur Hikmah', 'Salsabila Putri'] },
  'Perempuan 25-29 tahun': { age: 27, category: 'Dewasa', gender: 'P', birth: '13/05/1999', names: ['Fitriani', 'Indah Permatasari'] },
  'Perempuan 30-39 tahun': { age: 35, category: 'Dewasa', gender: 'P', birth: '13/05/1991', names: ['Hasnawati', 'Rahmawati'] },
  'Perempuan 40-59 tahun': { age: 48, category: 'Dewasa', gender: 'P', birth: '13/05/1978', names: ['Murniati', 'Rosdiana'] },
  'Perempuan 60-69 tahun': { age: 64, category: 'Lansia', gender: 'P', birth: '13/05/1962', names: ['Hajja Aminah', 'St. Maryam'] },
  'Perempuan >=70 tahun': { age: 74, category: 'Lansia', gender: 'P', birth: '13/05/1952', names: ['Nenek Ramlah', 'Hajja Fatimah'] }
};

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

function buildQuestionMap(schema) {
  return Object.fromEntries((schema?.questions || []).map((q) => [q.id, q.question_text]));
}

function isBlocked(question) {
  const text = String(question.question_text || '').toLowerCase();
  return REGISTRY.BLOCKED.some((keyword) => text.includes(keyword));
}

function classifyQuestion(question) {
  const text = String(question.question_text || '').toLowerCase();
  if (isBlocked(question)) return null;
  const isP2 = REGISTRY.POS2.some((keyword) => text.includes(keyword));
  const isP3 = REGISTRY.POS3.some((keyword) => text.includes(keyword));
  const isP4 = REGISTRY.POS4.some((keyword) => text.includes(keyword));
  const isP6 = REGISTRY.POS6.some((keyword) => text.includes(keyword));
  const isP5 = REGISTRY.POS5_SPECIFIC.some((keyword) => text.includes(keyword));
  if (isP2) return 'pos2';
  if (isP3) return 'pos3';
  if (isP4) return 'pos4';
  if (isP6) return 'pos6';
  if (isP5) return 'pos5';
  return 'pos5';
}

function passedPos(status, posKey) {
  const order = {
    [STATUS_MAPPING.POS1]: 0,
    [STATUS_MAPPING.POS2]: 1,
    [STATUS_MAPPING.POS3]: 2,
    [STATUS_MAPPING.POS4]: 3,
    [STATUS_MAPPING.POS5]: 4,
    [STATUS_MAPPING.POS6]: 5,
    [STATUS_MAPPING.POS7]: 6,
    [STATUS_MAPPING.SELESAI]: 7
  };
  const required = { pos2: 2, pos3: 3, pos4: 4, pos5: 5, pos6: 6 };
  return order[status] >= required[posKey];
}

function selectOption(question, index, profile) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (!options.length) return '';
  const text = String(question.question_text || '').toLowerCase();
  const riskCase = index % 5 === 3;
  const lowerOptions = options.map((option) => String(option).toLowerCase());

  if (text.includes('jenis kelamin')) {
    return options.find((option) => String(option).toLowerCase().startsWith(profile.gender === 'L' ? 'l' : 'p')) || profile.gender;
  }
  if (text.includes('status perkawinan')) {
    return profile.age < 19 ? 'Belum Kawin' : (options.find((option) => String(option).toLowerCase().includes('kawin')) || options[0]);
  }
  if (/^[0-7] hari$/.test(String(options[0]).toLowerCase())) return options[Math.min(options.length - 1, riskCase ? 2 : 5)];
  if (lowerOptions.includes('ya') && lowerOptions.includes('tidak')) {
    const normalYes = ['dapat', 'mampu', 'bisa', 'aktif secara fisik', 'berpuasa', 'mandiri'].some((keyword) => text.includes(keyword));
    const desired = riskCase ? (normalYes ? 'tidak' : 'ya') : (normalYes ? 'ya' : 'tidak');
    return options.find((option) => String(option).toLowerCase() === desired) || options[0];
  }
  const preferred = options.find((option) => {
    const value = String(option).toLowerCase();
    return value === 'normal' ||
      (value.includes('normal') && !value.includes('tidak normal')) ||
      value.includes('negatif') ||
      value.includes('non reaktif') ||
      value.includes('tidak beresiko') ||
      value.includes('tidak ada') ||
      value.includes('sesuai') ||
      value.includes('mandiri') ||
      value.includes('baik') ||
      value.includes('risiko rendah');
  });
  if (!riskCase && preferred) return preferred;
  return options[Math.min(options.length - 1, riskCase ? 1 : 0)] || options[0];
}

function numberAnswer(question, index, profile) {
  const text = String(question.question_text || '').toLowerCase();
  const riskCase = index % 5 === 3;
  if (text.includes('berat badan lahir')) return 3100 + (index % 4) * 120;
  if (text.includes('panjang badan lahir')) return 49 + (index % 3);
  if (text.includes('berat badan')) {
    if (profile.age === 0) return 3300 + (index % 3) * 150;
    if (profile.age <= 1) return 9 + (index % 2);
    if (profile.age <= 2) return 12 + (index % 2);
    if (profile.age <= 6) return 16 + (index % 3);
    if (profile.age <= 12) return 26 + (index % 6);
    if (profile.age <= 17) return 48 + (index % 8);
    return riskCase ? 86 + (index % 8) : 62 + (index % 12);
  }
  if (text.includes('tinggi badan') || text.includes('panjang badan')) {
    if (profile.age === 0) return 50;
    if (profile.age <= 1) return 76;
    if (profile.age <= 2) return 87;
    if (profile.age <= 6) return 103 + (index % 10);
    if (profile.age <= 12) return 126 + (index % 14);
    if (profile.age <= 17) return profile.gender === 'L' ? 164 : 156;
    return profile.gender === 'L' ? 166 + (index % 5) : 154 + (index % 5);
  }
  if (text.includes('sistolik')) return riskCase || profile.age >= 60 ? 148 : 118 + (index % 10);
  if (text.includes('diastolik')) return riskCase || profile.age >= 60 ? 92 : 76 + (index % 8);
  if (text.includes('gula') || text.includes('gds')) return riskCase ? 205 : 104 + (index % 12);
  if (text.includes('gdp')) return riskCase ? 130 : 92 + (index % 8);
  if (text.includes('hba1c') || text.includes('hb1ac')) return riskCase ? 7.1 : 5.4;
  if (text.includes('kolesterol')) return riskCase ? 242 : 178;
  if (text.includes('ldl')) return riskCase ? 164 : 96;
  if (text.includes('hdl')) return riskCase ? 36 : 52;
  if (text.includes('trigliserida')) return riskCase ? 214 : 118;
  if (text.includes('asam urat')) return riskCase ? 8.2 : 5.4;
  if (text.includes('hemoglobin') || text.includes('hb')) return riskCase ? 10.8 : 13.4;
  if (text.includes('mcv')) return riskCase ? 72 : 86;
  if (text.includes('mch')) return riskCase ? 24 : 29;
  if (text.includes('eritrosit') || text.includes('rbc')) return 4.8;
  if (text.includes('rdw')) return riskCase ? 16.5 : 13.2;
  if (text.includes('suhu')) return 36.6;
  if (text.includes('nadi')) return profile.age < 6 ? 104 : 78;
  if (text.includes('napas')) return profile.age < 6 ? 28 : 18;
  if (text.includes('lingkar kepala')) return profile.age < 2 ? 46 : 50;
  if (text.includes('lingkar perut')) return riskCase ? 98 : 78;
  if (text.includes('lila')) return profile.age < 6 ? 14.5 : 27;
  if (text.includes('lingkar betis')) return profile.age >= 60 ? 33 : 36;
  if (text.includes('pulse') || text.includes('oksimetri') || text.includes('saturasi')) return riskCase ? 92 : 98;
  if (text.includes('apri')) return riskCase ? 1.2 : 0.3;
  if (text.includes('kreatinin')) return 0.9;
  if (text.includes('trombosit')) return 260000;
  if (text.includes('sgot')) return riskCase ? 68 : 28;
  if (text.includes('tahun') && text.includes('merokok')) return riskCase ? 18 : 0;
  if (text.includes('batang')) return riskCase ? 12 : 0;
  if (text.includes('menit')) return riskCase ? 15 : 45;
  if (text.includes('kali')) return riskCase ? 1 : 4;
  return riskCase ? 2 : 1;
}

function textAnswer(question, index, profile, patient) {
  const text = String(question.question_text || '').toLowerCase();
  if (text.includes('nama faskes')) return 'UPT Puskesmas Malimpung';
  if (text.includes('nik')) return patient.nik;
  if (text.includes('nama lengkap')) return patient.name;
  if (text.includes('tanggal lahir')) return patient.birthDate;
  if (text.includes('tanggal pemeriksaan')) return TODAY_DDMMYYYY;
  if (text.includes('nama sekolah')) return patient.school || '';
  if (text.includes('kelas')) return patient.className || '';
  if (text.includes('imt') || text.includes('index massa tubuh')) return profile.age >= 18 ? (index % 5 === 3 ? '31.2 (OBESITAS)' : '22.6 (NORMAL)') : 'Sesuai kurva pertumbuhan';
  if (text.includes('hasil tekanan darah')) return profile.age >= 60 || index % 5 === 3 ? 'Sistol 140-159 / Diastol 90-99' : 'Sistol <120 / Diastol <80';
  if (text.includes('dislipidemia')) return index % 5 === 3 ? 'Dislipidemia' : 'Normal';
  if (text.includes('skoring tb')) return index % 5 === 3 ? 'Kontak TB: Ya; indikator: batuk >2 minggu, BB tidak naik' : 'Kontak TB: Tidak; tidak ada indikator aktif';
  if (text.includes('kesimpulan') || text.includes('interpretasi')) return index % 5 === 3 ? 'Perlu edukasi lanjutan dan pemantauan' : 'Dalam batas normal untuk skrining';
  return `Data dummy ${patient.name} - ${question.question_text}`.slice(0, 180);
}

function answerQuestion(question, index, profile, patient) {
  if (Array.isArray(question.options) && question.options.length) return selectOption(question, index, profile);
  if (question.answer_type === 'number') return numberAnswer(question, index, profile);
  if (question.answer_type === 'date') return TODAY_DDMMYYYY;
  return textAnswer(question, index, profile, patient);
}

function buildFormData(schema, profile, patient, index) {
  const dataByPos = { pos2: {}, pos3: {}, pos4: {}, pos5: {}, pos6: {} };
  for (const question of schema.questions || []) {
    const target = classifyQuestion(question);
    if (!target) continue;
    dataByPos[target][question.id] = answerQuestion(question, index, profile, patient);
  }
  return dataByPos;
}

function makeNik(index, profile) {
  const genderDate = profile.gender === 'P' ? 40 + 13 : 13;
  return `7315${String(genderDate).padStart(2, '0')}05${String(90 + (index % 10)).padStart(2, '0')}${String(100000 + index).slice(-6)}`.slice(0, 16);
}

function makePatient(formName, profile, index) {
  const [desa, dusun] = WILAYAH_KERJA[index % WILAYAH_KERJA.length];
  const schoolEntry = SCHOOL_BY_LEVEL[profile.category]?.[index % (SCHOOL_BY_LEVEL[profile.category]?.length || 1)];
  const name = profile.names[index % profile.names.length];
  const nik = makeNik(index + 1, profile);
  return {
    nik,
    name,
    birthDate: profile.birth,
    gender: profile.gender,
    phone: DUMMY_WA,
    status_perkawinan: profile.age < 19 ? 'Belum Kawin' : (profile.gender === 'P' ? 'Kawin' : 'Kawin'),
    desa,
    dusun,
    school: schoolEntry?.[0] || '',
    className: schoolEntry?.[1] || '',
    formName
  };
}

function makeVisit(formName, schema, profile, patient, globalIndex) {
  const status = STATUS_SEQUENCE[globalIndex % STATUS_SEQUENCE.length];
  const [desa, dusun] = [patient.desa, patient.dusun];
  const queueCode = desa.includes('Padang') ? 'B' : desa.includes('Maccirinna') ? 'C' : 'A';
  const visit = {
    seed_dummy: true,
    seed_batch: 'CKG_SMART_FILL_FULL_FORMS_2026_05_13',
    seed_form: formName,
    nomor_antrian: `${queueCode}${String(globalIndex + 1).padStart(3, '0')}`,
    status_antrian: status,
    patientNIK: patient.nik,
    kategori_usia_satusehat: profile.category,
    umur_saat_periksa: profile.age,
    tanggal_pelaksanaan: TODAY_ISO,
    tanggal_kunjungan: Timestamp.fromDate(new Date('2026-05-13T08:00:00+08:00')),
    waktu_ambil_tiket: Timestamp.fromDate(new Date(Date.parse('2026-05-13T08:00:00+08:00') + globalIndex * 120000)),
    tempat_pelaksanaan: dusun,
    desa_pelaksanaan: desa,
    pasien_snapshot: {
      nama: patient.name,
      j_kelamin: patient.gender,
      tgl_lahir: patient.birthDate,
      desa,
      dusun,
      no_hp: DUMMY_WA,
      status: patient.status_perkawinan
    },
    pos1: {
      nik: patient.nik,
      nama: patient.name,
      tgl_lahir: patient.birthDate,
      j_kelamin: patient.gender,
      no_hp: DUMMY_WA,
      desa,
      dusun,
      sekolah: patient.school,
      kelas: patient.className,
      form_schema: formName
    },
    petugas_pos1: 'Dummy Seeder',
    petugas_aktif: null,
    updatedAt: serverTimestamp()
  };

  const dataByPos = buildFormData(schema, profile, patient, globalIndex);
  for (const posKey of ['pos2', 'pos3', 'pos4', 'pos5', 'pos6']) {
    if (passedPos(status, posKey)) {
      visit[posKey] = dataByPos[posKey];
      visit[`${posKey}_question_map`] = buildQuestionMap(schema);
      visit[`petugas_${posKey}`] = 'Dummy Seeder';
    }
  }
  if (status === STATUS_MAPPING.POS7 || status === STATUS_MAPPING.SELESAI) {
    visit.kesimpulan_dokter = `Data dummy lengkap ${formName}: skrining terisi untuk ujicoba alur dan rapor digital.`;
    visit.dokter_pemeriksa = 'dr. Dummy CKG';
  }
  if (status === STATUS_MAPPING.SELESAI) {
    visit.waktu_selesai = Timestamp.fromDate(new Date(Date.parse('2026-05-13T11:30:00+08:00') + globalIndex * 120000));
  }
  return visit;
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
  const schemaPath = path.join(ROOT, 'src', 'formSchemas.json');
  const formSchemas = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const forms = Object.keys(formSchemas.forms);
  const visits = [];
  let globalIndex = 0;
  for (const formName of forms) {
    const schema = formSchemas.forms[formName];
    const profile = FORM_PROFILES[formName];
    if (!profile) throw new Error(`Profil dummy belum tersedia untuk form: ${formName}`);
    for (let copy = 0; copy < COUNT_PER_FORM; copy += 1) {
      const patient = makePatient(formName, profile, globalIndex);
      const visit = makeVisit(formName, schema, profile, patient, globalIndex);
      visits.push({ id: `ckg_dummy_visit_${String(globalIndex + 1).padStart(3, '0')}`, patient, visit });
      globalIndex += 1;
    }
  }

  const statusSummary = visits.reduce((acc, item) => {
    acc[item.visit.status_antrian] = (acc[item.visit.status_antrian] || 0) + 1;
    return acc;
  }, {});
  const wilayahSummary = visits.reduce((acc, item) => {
    const key = `${item.visit.desa_pelaksanaan} - ${item.visit.tempat_pelaksanaan}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(`Mode: ${WRITE ? 'WRITE FIRESTORE' : 'DRY RUN'}`);
  console.log(`Total form: ${forms.length}`);
  console.log(`Total pasien/visit dummy: ${visits.length}`);
  console.log('Distribusi status:', statusSummary);
  console.log('Distribusi wilayah:', wilayahSummary);
  console.log('Nomor WA semua pasien:', DUMMY_WA);

  if (!WRITE) {
    console.log('\nPreview 3 data pertama:');
    console.log(JSON.stringify(visits.slice(0, 3).map(({ id, patient, visit }) => ({
      id,
      nama: patient.name,
      form: patient.formName,
      status: visit.status_antrian,
      wilayah: `${patient.desa} - ${patient.dusun}`,
      posTerisi: ['pos2', 'pos3', 'pos4', 'pos5', 'pos6'].filter((key) => visit[key])
    })), null, 2));
    console.log('\nJalankan dengan --write untuk menyimpan ke Firestore.');
    return;
  }

  let batch = writeBatch(db);
  let ops = 0;
  for (const { id, patient, visit } of visits) {
    const patientRef = doc(collection(db, 'patients'), patient.nik);
    batch.set(patientRef, {
      seed_dummy: true,
      seed_batch: 'CKG_SMART_FILL_FULL_FORMS_2026_05_13',
      nik: patient.nik,
      name: patient.name,
      birthDate: patient.birthDate,
      gender: patient.gender,
      phone: DUMMY_WA,
      status_perkawinan: patient.status_perkawinan,
      desa: patient.desa,
      dusun: patient.dusun,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    ops += 1;

    batch.set(doc(collection(db, 'visits'), id), visit, { merge: true });
    ops += 1;

    if (ops >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  console.log(`Selesai menyimpan ${visits.length} pasien dan ${visits.length} visit dummy.`);
}

main().catch((error) => {
  console.error('Gagal membuat data dummy:', error);
  process.exit(1);
});
