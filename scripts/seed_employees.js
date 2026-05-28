import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// 1. Memuat berkas .env untuk kredensial Firebase
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

console.log(`🔄 Menghubungkan ke Firebase: [ ${firebaseConfig.projectId} ]`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Pembersih gelar untuk membuat username yang ramah
function generateUsername(fullName, existingUsernames) {
  let name = fullName;
  
  // Hapus gelar depan umum
  name = name.replace(/^(drg\.|dr\.|Bd\.|Bd\s|H\.\s|Hj\.\s)/i, '');
  
  // Hapus gelar belakang setelah koma
  if (name.includes(',')) {
    name = name.split(',')[0];
  }
  
  // Hapus gelar belakang umum lainnya
  name = name.replace(/\b(S\.ST|SKM|A\.Md\.Keb|AMKG|Amd\.Pk|S\.\s*Keb|A\.Md\.Kep|Amd\.Gz|Amd\.\s*AK|A\.MD\.Keb|A\.Md\.A\.B|A\.Md\.RMIK|S\.Kes|MM|S\.Kom|A\.Md\.Kes|Amd\.PJK|AMG|S\.Tr\.Ak|S\.Tr\.Kes|Ners|M\.\s*Kes|Ns|Ns\.)\b/gi, '');
  
  // Ambil kata-kata nama
  let words = name.trim().split(/\s+/)
    .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 0);
    
  // Cari nama depan yang bukan singkatan (misal "a" atau "i")
  let baseUsername = words.find(w => w.length >= 3) || words[0] || 'petugas';
  
  // Jika nama pertama sangat pendek (misal Muh), gabungkan dengan nama kedua
  if ((baseUsername === 'muh' || baseUsername === 'and' || baseUsername === 'sri') && words.length > 1) {
    baseUsername = `${baseUsername}${words[1]}`;
  }

  // Tangani bentrok username
  let username = baseUsername;
  let counter = 1;
  while (existingUsernames.has(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  existingUsernames.add(username);
  return username;
}

async function seedEmployees() {
  console.log("\n🚀 Memulai Migrasi Master Data Pegawai ke Firebase Firestore...\n");
  
  // Membaca file master pegawai dari folder induk
  const masterPath = path.resolve(ROOT, '..', 'Master Data Pegawai Puskesmas Malimpung.json');
  if (!fs.existsSync(masterPath)) {
    throw new Error(`Master data pegawai tidak ditemukan di lokasi: ${masterPath}`);
  }
  
  const rawData = fs.readFileSync(masterPath, 'utf8');
  const master = JSON.parse(rawData);
  const pegawaiList = master.data_pegawai || [];
  
  console.log(`📋 Ditemukan ${pegawaiList.length} pegawai untuk dimigrasikan.`);
  
  // Mengambil username yang sudah terdaftar di Firestore agar tidak terjadi tabrakan
  const existingUsernames = new Set();
  existingUsernames.add('admin'); // Reservasi untuk akun administrator default
  
  const staffSnapshot = await getDocs(collection(db, 'staff'));
  staffSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.username) {
      existingUsernames.add(data.username.toLowerCase());
    }
  });

  let successCount = 0;
  const accountsTable = [];

  for (const peg of pegawaiList) {
    const username = generateUsername(peg.nama_lengkap, existingUsernames);
    const pinDefault = "123456"; // PIN bawaan awal untuk semua pegawai
    
    // Pemetaan role dan permissions default
    const isAsn = peg.status_kepegawaian === "PNS" || peg.status_kepegawaian === "PPPK";
    const posRole = isAsn ? "PETUGAS ASN" : "PETUGAS MAGANG";
    
    const staffData = {
      nama: peg.nama_lengkap,
      nip: peg.nip || "",
      status: isAsn ? "ASN" : "NON-ASN",
      status_detail: peg.status_kepegawaian,
      username: username,
      pin: pinDefault,
      pos: posRole,
      role: ["petugas"],
      permissions: {
        admin: false,
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
    };
    
    // Simpan ke Firestore
    const docId = `staff_${username}`;
    await setDoc(doc(collection(db, 'staff'), docId), staffData);
    
    accountsTable.push({
      nama: peg.nama_lengkap,
      username: username,
      pin: pinDefault,
      status: peg.status_kepegawaian
    });
    
    successCount++;
  }
  
  console.log(`\n🟢 Sukses! ${successCount} data pegawai berhasil diinjeksi ke koleksi 'staff'.`);
  
  // Tampilkan tabel akun untuk referensi
  console.log("\n=============================================================");
  console.log("🔑 DAFTAR AKUN LOGIN PEGAWAI PUSKESMAS MALIMPUNG");
  console.log("=============================================================");
  console.log(String("Nama Lengkap").padEnd(35) + " | " + String("Username").padEnd(12) + " | " + String("PIN").padEnd(6) + " | Status");
  console.log("-".repeat(70));
  accountsTable.forEach(acc => {
    // Potong nama jika terlalu panjang untuk tampilan terminal
    const displayName = acc.nama.length > 33 ? acc.nama.slice(0, 30) + "..." : acc.nama;
    console.log(displayName.padEnd(35) + " | " + acc.username.padEnd(12) + " | " + acc.pin.padEnd(6) + " | " + acc.status);
  });
  console.log("=============================================================");
  console.log("\n👉 Semua pegawai di atas kini dapat login menggunakan Username & PIN default '123456'.");
  console.log("👉 Pegawai disarankan untuk mengganti PIN mereka setelah masuk pertama kali demi keamanan.\n");
}

seedEmployees().catch(err => {
  console.error("❌ Gagal menyuntikkan data pegawai:", err.message);
});
