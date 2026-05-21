import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDePHXOa8DnhwoOgo4LwfZpuv-iWDU9Gcs",
  authDomain: "ckg-malimpung-app.firebaseapp.com",
  projectId: "ckg-malimpung-app",
  storageBucket: "ckg-malimpung-app.firebasestorage.app",
  messagingSenderId: "591893975061",
  appId: "1:591893975061:web:975383d26e8d2279f07e1c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clean() {
  console.log('Fetching schools from Firestore...');
  const snap = await getDocs(collection(db, 'schools'));
  const unique = new Set();
  let deletedCount = 0;
  
  for (const doc of snap.docs) {
    const data = doc.data();
    const npsn = String(data.npsn || '').trim();
    const name = String(data.name || '').trim().toLowerCase();
    
    // We prioritize NPSN, but if no NPSN, use name
    const key = (npsn && npsn !== '-' && npsn !== '0' && npsn !== 'undefined') ? `npsn_${npsn}` : `name_${name}`;
    
    if (unique.has(key)) {
      console.log(`Deleting duplicate: ${data.name} (NPSN: ${npsn})`);
      await deleteDoc(doc.ref);
      deletedCount++;
    } else {
      unique.add(key);
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} duplicate schools.`);
  process.exit(0);
}

clean().catch(console.error);
