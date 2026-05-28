import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

// 1. Kredensial Proyek Firebase Lama (Sumber Data)
const firebaseConfigOld = {
  apiKey: "AIzaSyDePHXOa8DnhwoOgo4LwfZpuv-iWDU9Gcs",
  authDomain: "ckg-malimpung-app.firebaseapp.com",
  projectId: "ckg-malimpung-app",
  storageBucket: "ckg-malimpung-app.firebasestorage.app",
  messagingSenderId: "591893975061",
  appId: "1:591893975061:web:975383d26e8d2279f07e1c"
};

// 2. Kredensial Proyek Firebase Baru (Tujuan Migrasi)
const firebaseConfigNew = {
  apiKey: "AIzaSyAVBhUvUGDYvtpH_chAAXzsUJnW7vrtnco",
  authDomain: "ckg-malimpung.firebaseapp.com",
  projectId: "ckg-malimpung",
  storageBucket: "ckg-malimpung.firebasestorage.app",
  messagingSenderId: "695466415592",
  appId: "1:695466415592:web:ee89945b07b0523cd3c05d"
};

// Inisialisasi Aplikasi Firebase
console.log("🔄 Menginisialisasi koneksi ke kedua proyek Firebase...");
const appOld = initializeApp(firebaseConfigOld, "oldProject");
const appNew = initializeApp(firebaseConfigNew, "newProject");

const dbOld = getFirestore(appOld);
const dbNew = getFirestore(appNew);

// Daftar Koleksi Utama yang Digunakan Aplikasi CKG-Malimpung
const COLLECTIONS_TO_MIGRATE = [
  "schools",
  "staff",
  "visits",
  "activity_logs",
  "panggilan_tv"
];

async function migrateData() {
  console.log("\n🚀 Memulai proses migrasi data Firestore...\n");
  let totalMigrated = 0;

  for (const collectionName of COLLECTIONS_TO_MIGRATE) {
    console.log(`--------------------------------------------------`);
    console.log(`📦 Membaca data dari koleksi: [ ${collectionName} ] di proyek lama...`);
    
    try {
      const querySnapshot = await getDocs(collection(dbOld, collectionName));
      const docsCount = querySnapshot.size;
      console.log(`✓ Ditemukan ${docsCount} dokumen di proyek lama.`);

      if (docsCount === 0) {
        console.log(`⚠️ Koleksi [ ${collectionName} ] kosong. Melompati...`);
        continue;
      }

      let count = 0;
      for (const docSnap of querySnapshot.docs) {
        const docId = docSnap.id;
        const docData = docSnap.data();

        // Menulis dokumen ke proyek baru dengan ID yang sama persis
        await setDoc(doc(dbNew, collectionName, docId), docData);
        count++;
        
        if (count % 5 === 0 || count === docsCount) {
          console.log(`   └─ Menulis dokumen ke proyek baru: ${count}/${docsCount}...`);
        }
      }
      
      console.log(`🟢 Sukses! ${count} dokumen dari koleksi [ ${collectionName} ] berhasil dimigrasi.`);
      totalMigrated += count;

    } catch (error) {
      console.error(`🔴 GAGAL memigrasikan koleksi [ ${collectionName} ]:`, error.message);
      console.log(`👉 Pastikan Firebase Rules di proyek lama & baru mengizinkan pembacaan/penulisan.`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 MIGRASI SELESAI! Total ${totalMigrated} dokumen berhasil dipindahkan.`);
  console.log(`==================================================\n`);
}

migrateData().catch((err) => {
  console.error("❌ Terjadi kesalahan fatal selama migrasi:", err);
});
