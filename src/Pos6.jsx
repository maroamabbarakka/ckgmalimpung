import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import formSchemas from './formSchemas.json';
import DynamicFormRenderer from './DynamicFormRenderer';
import { STATUS_MAPPING } from './utils/constants';
import { buildQuestionMap, sanitizeFormDataForSchema } from './utils/formSchemaData';

function Pos6() {
  const [antrian, setAntrian] = useState([]);
  const [pasienAktif, setPasienAktif] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false); 
  const [pesan, setPesan] = useState('');

  const umurPasien = pasienAktif?.umur_saat_periksa || 0;

  useEffect(() => {
    const q = query(collection(db, "visits"), where("status_antrian", "in", [STATUS_MAPPING.POS6, 'Menunggu Pos 6', 'Antri Pos 6', 'Antre Pos 6', 'POS 6', 'Pos 6']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = []; 
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setAntrian(data.sort((a, b) => (a.waktu_ambil_tiket?.toMillis() || 0) - (b.waktu_ambil_tiket?.toMillis() || 0)));
    });
    return () => unsubscribe();
  }, []);

  const handlePanggil = async (item) => {
    try {
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, "visits", item.id);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error("Data tidak ditemukan!");
        const data = docSnap.data();
        const rawRole = sessionStorage.getItem('rolePegawai') || '';
        const isAdmin = rawRole.includes('admin');
        if (!isAdmin && data.petugas_aktif && data.petugas_aktif !== sessionStorage.getItem('namaPegawai')) {
             throw new Error(`Pasien sedang ditangani oleh ${data.petugas_aktif}`);
        }
        transaction.update(docRef, { petugas_aktif: sessionStorage.getItem('namaPegawai') || 'Petugas' });
      });
      const activeSchema = getSchemaForVisit(item);
      setPasienAktif(item); setPesan(''); setFormData(sanitizeFormDataForSchema(activeSchema, item.pos6 || {})); window.scrollTo({ top: 0, behavior: 'smooth' });
      try { await addDoc(collection(db, "panggilan_tv"), { pos: "POS 6", identitas_layar: item.nomor_antrian, teks_suara: `Nomor antrean... ${item.nomor_antrian.replace(/-/g, ' ')}... Silakan menuju meja Pos Enam.`, waktu: serverTimestamp() }); } catch (e) { console.warn("Gagal membuat panggilan TV Pos 6:", e); }
    } catch (e) {
      alert("⚠️ " + e.message);
    }
  };

  const handleSimpanData = async (e) => {
    e.preventDefault(); if (!pasienAktif) return; setLoading(true); setPesan('');
    try {
      // 🚀 Setelah POS 6 selesai, pasien dikirim ke POS 7 (Review Dokter & Rapor)
      const activeSchema = getActiveSchema();
      const sanitizedFormData = sanitizeFormDataForSchema(activeSchema, formData, {
        posNumber: 6,
        kategoriUsia: pasienAktif.kategori_usia_satusehat || '-'
      });
      await updateDoc(doc(db, "visits", pasienAktif.id), {
          status_antrian: STATUS_MAPPING.POS7,
          petugas_pos6: sessionStorage.getItem('namaPegawai') || 'Sistem',
          pos6: sanitizedFormData,
          pos6_question_map: buildQuestionMap(activeSchema),
          petugas_aktif: null
      });
      setPesan(`✅ Data terekam.`); setTimeout(() => setPasienAktif(null), 1000); 
    } catch (error) { setPesan("❌ Gagal menyimpan data: " + error.message); } finally { setLoading(false); }
  };

  const handleBatal = async () => {
    if (pasienAktif?.id) {
      try {
        await updateDoc(doc(db, "visits", pasienAktif.id), { petugas_aktif: null });
      } catch (error) {
        console.error("Gagal melepas pasien:", error);
      }
    }
    setPasienAktif(null);
  };

  const handleKembaliPosSebelumnya = async () => {
    if (!pasienAktif?.id || loading) return;
    const lanjut = window.confirm('Kembalikan pasien ke Pos 5? Perubahan yang belum disimpan di Pos 6 tidak akan dicatat.');
    if (!lanjut) return;
    setLoading(true);
    setPesan('');
    try {
      await updateDoc(doc(db, "visits", pasienAktif.id), {
        status_antrian: STATUS_MAPPING.POS5,
        petugas_aktif: null
      });
      setPasienAktif(null);
    } catch (error) {
      setPesan("❌ Gagal mengembalikan pasien: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSchemaForVisit = (visit) => {
    if (!visit) return null;
    const us = visit.kategori_usia_satusehat; const jk = visit.pasien_snapshot?.j_kelamin; const up = visit.umur_saat_periksa || 0;
    if (us === 'Bayi' || us === 'BBL') return formSchemas.forms.BBL;
    if (['SD', 'SMP', 'SMA'].includes(us)) return formSchemas.forms[us];
    if (us === 'Balita') return formSchemas.forms[up <= 1 ? "Balita 1 tahun" : up === 2 ? "Balita 2 tahun" : "Balita 3-6 tahun"];
    if (jk === 'L') {
        if (up >= 18 && up <= 24) return formSchemas.forms["Laki-laki 18-24 tahun"];
        if (up >= 25 && up <= 39) return formSchemas.forms["Laki-laki 25-39 tahun"];
        if (up >= 40 && up <= 44) return formSchemas.forms["Laki-laki 40-44 tahun"];
        if (up >= 45 && up <= 59) return formSchemas.forms["Laki-laki 45-59 tahun"];
        return formSchemas.forms["Laki-laki >=60 tahun"];
    } else {
        if (up >= 18 && up <= 24) return formSchemas.forms["Perempuan 18-24 tahun"];
        if (up >= 25 && up <= 29) return formSchemas.forms["Perempuan 25-29 tahun"];
        if (up >= 30 && up <= 39) return formSchemas.forms["Perempuan 30-39 tahun"];
        if (up >= 40 && up <= 59) return formSchemas.forms["Perempuan 40-59 tahun"];
        if (up >= 60 && up <= 69) return formSchemas.forms["Perempuan 60-69 tahun"];
        return formSchemas.forms["Perempuan >=70 tahun"];
    }
  };

  const getActiveSchema = () => getSchemaForVisit(pasienAktif);

  return (
    <div className="space-y-6 max-w-5xl mx-auto mobile-safe-page px-2 md:px-0 font-sans">
      {!pasienAktif ? (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">POS 6: DIAGNOSIS DOKTER ({antrian.length})</h3>
            </div>
            
            {antrian.length === 0 ? (<div className="text-center py-16 opacity-50">⚕️ <p className="font-bold text-[10px] uppercase text-slate-400 mt-2">Tidak Ada Antrean</p></div>) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {antrian.map((item) => (
                <div key={item.id} onClick={() => handlePanggil(item)} className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-[#10b981] group shadow-sm transition-all">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-[#10b981]">Antrian</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-3 group-hover:text-[#10b981]">{item.nomor_antrian}</h3>
                    <div className="bg-slate-100 text-slate-600 text-[8px] font-black px-3 py-1 rounded uppercase tracking-widest group-hover:bg-[#ecfdf5] group-hover:text-[#059669]">{item.kategori_usia_satusehat}</div>
                </div>
                ))}
            </div>
            )}
        </div>
      ) : (
      <div className="bg-slate-50 rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-[#10b981] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚕️</span>
              <h2 className="text-4xl font-black">{pasienAktif.nomor_antrian}</h2>
            </div>
            <button type="button" onClick={handleBatal} className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-white/30 transition-all">✕ Batal</button>
        </div>
        <form onSubmit={handleSimpanData} className="p-4 md:p-6 bg-[#f8fafc] mobile-safe-page">
            {pesan && <div className={`p-4 rounded-xl font-bold text-xs shadow-sm mb-6 ${pesan.includes('❌') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{pesan}</div>}
            
            <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-lg">{pasienAktif.pasien_snapshot?.nama || "Tanpa Nama"}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{umurPasien} THN • {pasienAktif.kategori_usia_satusehat}</p>
            </div>

            <DynamicFormRenderer schema={getActiveSchema()} formData={formData} fullData={pasienAktif} onChange={(id, val) => setFormData(prev => ({ ...prev, [id]: val }))} posNumber={6} primaryColor="emerald" kategoriUsia={pasienAktif.kategori_usia_satusehat || '-'} />            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 sticky mobile-safe-submit z-40">
              <button type="button" onClick={handleKembaliPosSebelumnya} disabled={loading} className="w-full min-h-[60px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black rounded-2xl shadow-sm active:scale-95 transition-all text-sm uppercase disabled:opacity-50">
                  ‹ Pos 5
              </button>
              <button type="submit" disabled={loading} className="w-full min-h-[60px] bg-[#059669] text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase disabled:opacity-50">
                  {loading ? 'MENYIMPAN...' : 'Simpan & Ke Pos 7 ›'}
              </button>
            </div>
        </form>
      </div>
      )}
    </div>
  );
}
export default Pos6;
