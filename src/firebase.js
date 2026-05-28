import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Konfigurasi Database Firebase CKG Malimpung
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 1. Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * 2. Inisialisasi Firestore dengan fitur Offline Persistence
 * persistentLocalCache: Menyimpan data di memori browser (IndexedDB) agar bisa diakses tanpa internet.
 * persistentMultipleTabManager: Memungkinkan fitur offline tetap jalan meskipun user membuka banyak tab TERSANJUNG.
 */
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Export database dan auth untuk digunakan di komponen lain (Pos, Dashboard, dll)
export { auth, db };
