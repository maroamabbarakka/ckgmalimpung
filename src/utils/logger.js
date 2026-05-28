import { writeAuditLog } from '../services/auditService';

/**
 * Mencatat aktivitas pengguna ke Firestore (koleksi activity_logs)
 * @param {string} aksi - Deskripsi aktivitas (misal: "Mengubah hak akses staff")
 * @param {string} modul - Nama modul tempat aktivitas terjadi (misal: "Admin SIMPEG")
 */
export const logActivity = async (aksi, modul) => {
    try {
        await writeAuditLog({
            action: aksi,
            module: modul
        });
    } catch (e) {
        console.error("Gagal mencatat log aktivitas:", e);
    }
};
