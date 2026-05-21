import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Mencatat aktivitas pengguna ke Firestore (koleksi activity_logs)
 * @param {string} aksi - Deskripsi aktivitas (misal: "Mengubah hak akses staff")
 * @param {string} modul - Nama modul tempat aktivitas terjadi (misal: "Admin SIMPEG")
 */
export const logActivity = async (aksi, modul) => {
    try {
        const username = sessionStorage.getItem('username') || 'sistem';
        const nama = sessionStorage.getItem('namaPegawai') || 'Sistem / Anonim';
        await addDoc(collection(db, "activity_logs"), {
            waktu: serverTimestamp(),
            user: username,
            nama: nama,
            aksi: aksi,
            modul: modul
        });
    } catch (e) {
        console.error("Gagal mencatat log aktivitas:", e);
    }
};
