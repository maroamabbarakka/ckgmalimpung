import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { alertDialog } from '../utils/appDialog';

function DummyDataManager() {
  const [stats, setStats] = useState({ patients: 0, visits: 0 });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [message, setMessage] = useState(null);

  // Ambil statistik data dummy dari Firestore
  const fetchStats = async () => {
    setLoading(true);
    try {
      let patientCount = 0;
      let visitCount = 0;

      // 1. Hitung pasien dummy
      const qPatients = query(collection(db, 'patients'), where('isDummy', '==', true));
      const snapPatients = await getDocs(qPatients);
      patientCount = snapPatients.size;

      // 2. Hitung kunjungan dummy
      const qVisits = query(collection(db, 'visits'), where('isDummy', '==', true));
      const snapVisits = await getDocs(qVisits);
      visitCount = snapVisits.size;

      setStats({ patients: patientCount, visits: visitCount });
    } catch (error) {
      console.error('Gagal mengambil statistik data dummy:', error);
      setMessage({ type: 'error', text: 'Gagal mengambil data dari server database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Hapus semua data dummy secara batch
  const handleDeleteAll = async () => {
    if (confirmInput.trim().toUpperCase() !== 'HAPUS') {
      await alertDialog({ title: 'Konfirmasi belum sesuai', message: 'Silakan ketik HAPUS untuk melanjutkan.', variant: 'warning' });
      return;
    }

    setDeleting(true);
    setShowConfirm(false);
    setMessage(null);

    try {
      const docsToDelete = [];

      // 1. Ambil pasien dummy
      const qPatients = query(collection(db, 'patients'), where('isDummy', '==', true));
      const snapPatients = await getDocs(qPatients);
      snapPatients.forEach((docSnap) => {
        docsToDelete.push({ collectionName: 'patients', id: docSnap.id });
      });

      // 2. Ambil kunjungan dummy
      const qVisits = query(collection(db, 'visits'), where('isDummy', '==', true));
      const snapVisits = await getDocs(qVisits);
      snapVisits.forEach((docSnap) => {
        docsToDelete.push({ collectionName: 'visits', id: docSnap.id });
      });

      if (docsToDelete.length === 0) {
        setMessage({ type: 'success', text: 'Tidak ada data dummy yang perlu dihapus.' });
        setDeleting(false);
        return;
      }

      // 3. Lakukan penghapusan secara batch
      let batch = writeBatch(db);
      let ops = 0;
      let deletedCount = 0;

      for (const item of docsToDelete) {
        batch.delete(doc(db, item.collectionName, item.id));
        ops += 1;
        deletedCount += 1;

        if (ops >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      }

      if (ops > 0) {
        await batch.commit();
      }

      setMessage({ type: 'success', text: `Sukses! Berhasil menghapus ${deletedCount} dokumen dummy.` });
      setConfirmInput('');
      fetchStats();
    } catch (error) {
      console.error('Gagal menghapus data dummy:', error);
      setMessage({ type: 'error', text: 'Gagal menghapus data dummy dari server.' });
    } finally {
      setDeleting(false);
    }
  };

  const totalDummy = stats.patients + stats.visits;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-black text-slate-900">Dummy Data Manager</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Kelola data dummy hasil impor Excel secara massal. Data dummy dapat dibersihkan secara instan sebelum aplikasi digunakan dalam operasional riil pelayanan.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-bold shadow-sm ${
            message.type === 'success'
              ? 'bg-teal-50 border border-teal-200 text-teal-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Pasien Dummy</p>
          {loading ? (
            <div className="h-9 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="mt-2 text-3xl font-black text-slate-900">{stats.patients}</p>
          )}
          <p className="text-[10px] font-semibold text-slate-400 mt-1">Koleksi: patients</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Kunjungan Dummy</p>
          {loading ? (
            <div className="h-9 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="mt-2 text-3xl font-black text-slate-900">{stats.visits}</p>
          )}
          <p className="text-[10px] font-semibold text-slate-400 mt-1">Koleksi: visits</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 shadow-sm text-white">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Keseluruhan</p>
          {loading ? (
            <div className="h-9 w-16 bg-slate-800 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="mt-2 text-3xl font-black">{totalDummy}</p>
          )}
          <p className="text-[10px] font-semibold text-slate-400 mt-1">Status: Siap Dibersihkan</p>
        </div>
      </div>

      {/* Kontrol Hapus Massal */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6 shadow-sm">
        <h3 className="text-lg font-black text-rose-950">Zona Bahaya (Danger Zone)</h3>
        <p className="text-sm font-medium text-rose-700 mt-2">
          Tombol di bawah ini akan **MENGHAPUS PERMANEN** semua data pasien dan kunjungan dummy yang bertanda <code>isDummy: true</code>. Tindakan ini tidak dapat dibatalkan. Data pelayanan yang riil (asli) di database tidak akan terpengaruh.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading || deleting || totalDummy === 0}
            onClick={() => setShowConfirm(true)}
            className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white hover:bg-rose-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Sedang Menghapus...' : 'DELETE ALL DUMMY DATA'}
          </button>

          <button
            type="button"
            disabled={loading || deleting}
            onClick={fetchStats}
            className="rounded-xl bg-white border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900">Konfirmasi Penghapusan Massal</h3>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Tindakan ini akan menghapus total **{totalDummy}** dokumen dummy. Ketik kata **HAPUS** di bawah ini untuk mengonfirmasi tindakan Anda.
            </p>

            <div className="mt-4">
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Ketik HAPUS di sini..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmInput('');
                }}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== 'HAPUS'}
                onClick={handleDeleteAll}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DummyDataManager;
