import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, addDoc } from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// 1. Memuat berkas .env untuk mendapatkan kredensial Firebase proyek baru
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
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

const env = loadEnv();
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

console.log(`🔄 Menginisialisasi Firebase untuk Proyek: [ ${firebaseConfig.projectId} ]`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data 15 Sekolah Default (Malimpung & Sekitarnya)
const SCHOOL_SEEDS = [
  { name: "UPT SD NEGERI 258 PINRANG", npsn: "40305052", level: "SD", status: "NEGERI", address: "Takkalalla Timur", desa: "Kelurahan Maccirinna" },
  { name: "MIS DDI TAKKALALLA TIMUR", npsn: "60723874", level: "MI", status: "SWASTA", address: "Takkalalla Timur", desa: "Kelurahan Maccirinna" },
  { name: "RA/BA/TA DDI TAKKALALLA TIMUR", npsn: "69751520", level: "RA", status: "SWASTA", address: "Takkalalla Timur", desa: "Kelurahan Maccirinna" },
  { name: "LKP RAHMA", npsn: "K9990293", level: "Kursus", status: "SWASTA", address: "Jl. Poros Benteng", desa: "Kelurahan Maccirinna" },
  { name: "UPT SD NEGERI INPRES PADANG LOANG", npsn: "40305178", level: "SD", status: "NEGERI", address: "Dusun Padang", desa: "Desa Padang Loang" },
  { name: "RA DDI AL-MUNAWARAH PALITA", npsn: "69886044", level: "RA", status: "SWASTA", address: "Dusun Palita", desa: "Desa Padang Loang" },
  { name: "RA DDI ASH-SHIDDIQ", npsn: "69886045", level: "RA", status: "SWASTA", address: "Padang Loang", desa: "Desa Padang Loang" },
  { name: "UPT SD NEGERI 121 PINRANG", npsn: "40304322", level: "SD", status: "NEGERI", address: "Malimpung", desa: "Desa Malimpung" },
  { name: "UPT SD NEGERI 123 PINRANG", npsn: "40305338", level: "SD", status: "NEGERI", address: "Malimpung", desa: "Desa Malimpung" },
  { name: "UPT SD NEGERI 195 PINRANG", npsn: "40305274", level: "SD", status: "NEGERI", address: "Malimpung", desa: "Desa Malimpung" },
  { name: "UPT SMP NEGERI 5 PATAMPANUA", npsn: "69761928", level: "SMP", status: "NEGERI", address: "Malimpung", desa: "Desa Malimpung" },
  { name: "UPT SD NEGERI 218 PINRANG", npsn: "40305298", level: "SD", status: "NEGERI", address: "Jln. Poros Malimpung", desa: "Koridor Poros (Benteng)" },
  { name: "TK IT WAHDAH QURROTA AYUN", npsn: "70057285", level: "TK", status: "SWASTA", address: "Jl. Poros Malimpung", desa: "Koridor Poros (Sipatuo)" },
  { name: "RA DDI DARABATU", npsn: "69886048", level: "RA", status: "SWASTA", address: "Jl. Poros Malimpung", desa: "Koridor Poros (Sipatuo)" },
  { name: "RA KARTINI URUNG", npsn: "69886046", level: "RA", status: "SWASTA", address: "Jl. Poros Malimpung Urung", desa: "Koridor Poros (Sipatuo)" }
];

// Data Akun Staf/Admin Pertama
const STAFF_SEEDS = [
  {
    nama: "Administrator Utama",
    nip: "199001012020121001",
    status: "ASN",
    status_detail: "PNS",
    username: "admin",
    pin: "123456",
    pos: "ADMINISTRATOR",
    role: ["admin", "petugas"],
    permissions: {
      admin: true,
      pos1: true,
      pos2: true,
      pos3: true,
      pos4: true,
      pos5: true,
      pos6: true,
      pos7: true
    },
    isActive: true,
    lastUpdated: new Date().toISOString()
  }
];

async function initializeDatabase() {
  console.log("\n🚀 Memulai Inisialisasi Database Baru...\n");

  // 1. Suntik Data Sekolah
  console.log("🏫 Menyuntikkan data 15 sekolah dasar/menengah...");
  let schoolCount = 0;
  for (const school of SCHOOL_SEEDS) {
    const docId = `school_${school.npsn}`;
    await setDoc(doc(collection(db, 'schools'), docId), {
      ...school,
      source: "System Init",
      lastUpdated: new Date().toISOString()
    });
    schoolCount++;
  }
  console.log(`🟢 Sukses! ${schoolCount} data sekolah berhasil diinjeksi.`);

  // 2. Suntik Data Akun Staf / Admin
  console.log("\n👤 Menyuntikkan akun Administrator Utama...");
  const adminId = "staff_admin_main";
  await setDoc(doc(collection(db, 'staff'), adminId), STAFF_SEEDS[0]);
  console.log(`🟢 Sukses! Akun admin default berhasil dibuat:`);
  console.log(`   👉 Username: admin`);
  console.log(`   👉 PIN: 123456`);

  console.log(`\n==================================================`);
  console.log(`🎉 INISIALISASI DATABASE AWAL BERHASIL SELESAI!`);
  console.log(`==================================================\n`);
}

initializeDatabase().catch((error) => {
  console.error("❌ Gagal menginisialisasi database:", error.message);
  console.log("👉 Pastikan Firebase Rules Anda sudah diset ke publik (allow read, write: if true;).");
});
