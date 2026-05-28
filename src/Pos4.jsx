import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import formSchemas from './formSchemas.json';
import DynamicFormRenderer from './DynamicFormRenderer';
import { STATUS_MAPPING } from './utils/constants';
import { VISIT_STATUS } from './features/workflow/workflowStatus';
import { buildQuestionMap, sanitizeFormDataForSchema } from './utils/formSchemaData';
import { auditQueueTransition } from './services/queueAudit';
import { buildQueueSpeech, claimVisitForStaff, createTvQueueCall } from './services/queueService';
import { updateVisit } from './services/visitService';
import useQueue from './hooks/useQueue';
import PatientStickyHeader from './components/patient/PatientStickyHeader';
import PosBottomActionBar from './components/patient/PosBottomActionBar';
import QueueEmptyState from './components/patient/QueueEmptyState';

function Pos4() {
  const { user } = useAuth();
  const antrian = useQueue('POS4');
  const [pasienAktif, setPasienAktif] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false); 
  const [callingVisitId, setCallingVisitId] = useState(null);

  // PENGAMAN VARIABEL UMUR
  const umurPasien = pasienAktif?.umur_saat_periksa || 0;
  const kategoriPasien = pasienAktif?.kategori_usia_satusehat || '-';

  const handlePanggil = async (item) => {
    if (callingVisitId || pasienAktif) return;
    setCallingVisitId(item.id);
    try {
      const activeVisit = await claimVisitForStaff({
        visitId: item.id,
        staffName: user?.nama || 'Petugas',
        isAdmin: user?.roles?.includes('admin'),
        actor: user,
        module: 'POS4',
        workflowStatus: VISIT_STATUS.POS4_IN_PROGRESS
      });
      const activeSchema = getSchemaForVisit(activeVisit);
      setPasienAktif(activeVisit); setFormData(sanitizeFormDataForSchema(activeSchema, activeVisit.pos4 || {})); window.scrollTo({ top: 0, behavior: 'smooth' });
      try { await createTvQueueCall({ pos: "POS 4", queueNumber: activeVisit.nomor_antrian, speechText: buildQueueSpeech(activeVisit.nomor_antrian, 'Silakan menuju Pos Empat.') }); } catch (e) { console.warn("Gagal membuat panggilan TV Pos 4:", e); }
    } catch (e) {
      alert("⚠️ " + e.message);
    } finally {
      setCallingVisitId(null);
    }
  };

  const handleSimpanData = async (e) => {
    e.preventDefault(); if (!pasienAktif || loading) return; setLoading(true);
    try {
      const activeSchema = getActiveSchema();
      const sanitizedFormData = sanitizeFormDataForSchema(activeSchema, formData, {
        posNumber: 4,
        kategoriUsia: pasienAktif.kategori_usia_satusehat || '-'
      });
      await updateVisit(pasienAktif.id, { status: VISIT_STATUS.POS4_COMPLETE, status_antrian: STATUS_MAPPING.POS5, petugas_pos4: user?.nama || 'Sistem', pos4: sanitizedFormData, pos4_question_map: buildQuestionMap(activeSchema), petugas_aktif: null });
      await auditQueueTransition({
        visit: pasienAktif,
        module: 'Pos 4',
        action: 'Simpan Pos 4 dan lanjut ke Pos 5',
        toStatus: STATUS_MAPPING.POS5,
        extra: { status: VISIT_STATUS.POS4_COMPLETE, petugas_pos4: user?.nama || 'Sistem' }
      });
      setTimeout(() => setPasienAktif(null), 1000); 
    } catch (error) { console.error("Gagal menyimpan data Pos 4:", error); alert("Gagal menyimpan data!"); } finally { setLoading(false); }
  };

  const handleBatal = async () => {
    if (pasienAktif?.id) {
      try { await updateVisit(pasienAktif.id, { petugas_aktif: null }); }
      catch (error) { console.error("Gagal melepas pasien:", error); }
    }
    setPasienAktif(null);
  };

  const handleKembaliPosSebelumnya = async () => {
    if (!pasienAktif?.id || loading) return;
    const lanjut = window.confirm('Kembalikan pasien ke Pos 3? Perubahan yang belum disimpan di Pos 4 tidak akan dicatat.');
    if (!lanjut) return;
    setLoading(true);
    try {
      await updateVisit(pasienAktif.id, {
        status_antrian: STATUS_MAPPING.POS3,
        petugas_aktif: null
      });
      await auditQueueTransition({
        visit: pasienAktif,
        module: 'Pos 4',
        action: 'Kembalikan pasien dari Pos 4 ke Pos 3',
        toStatus: STATUS_MAPPING.POS3
      });
      setPasienAktif(null);
    } catch (error) {
      console.error("Gagal mengembalikan pasien ke Pos 3:", error);
      alert("Gagal mengembalikan pasien ke Pos 3.");
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
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">POS 4: LABORATORIUM & INFEKSI ({antrian.length})</h3>
            {antrian.length === 0 ? (
              <QueueEmptyState accentClass="text-[#2563eb]" />
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {antrian.map((item) => (
                <button type="button" key={item.id} onClick={() => handlePanggil(item)} disabled={Boolean(callingVisitId)} className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-[#2563eb] group shadow-sm disabled:cursor-wait disabled:opacity-60">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-[#2563eb]">Antrian</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-3 group-hover:text-[#2563eb]">{item.nomor_antrian}</h3>
                    <div className="bg-slate-100 text-slate-600 text-[8px] font-black px-3 py-1 rounded uppercase tracking-widest">{callingVisitId === item.id ? 'Memanggil...' : item.kategori_usia_satusehat}</div>
                </button>
                ))}
            </div>
            )}
        </div>
      ) : (
      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <PatientStickyHeader
          visit={pasienAktif}
          posLabel="Pos 4: Laboratorium & Infeksi"
          accentClass="bg-[#2563eb]"
          onCancel={handleBatal}
        />
        <div className="hidden bg-[#2563eb] p-6 text-white flex justify-between items-center">
            <h2 className="text-4xl font-black">{pasienAktif.nomor_antrian}</h2>
            <button type="button" onClick={handleBatal} className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs">✕ Batal</button>
        </div>
        <form onSubmit={handleSimpanData} className="p-4 md:p-6 bg-[#f8fafc] mobile-safe-page">
            <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-lg">{pasienAktif.pasien_snapshot?.nama || "Tanpa Nama"}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{umurPasien} THN • {kategoriPasien}</p>
            </div>
            
            <DynamicFormRenderer schema={getActiveSchema()} formData={formData} fullData={pasienAktif} onChange={(id, val) => setFormData(prev => ({ ...prev, [id]: val }))} posNumber={4} primaryColor="blue" kategoriUsia={pasienAktif.kategori_usia_satusehat || '-'} />
            
            <PosBottomActionBar
              backLabel="Kembali ke Pos 3"
              primaryLabel="Simpan & Lanjut Pos 5"
              loading={loading}
              onBack={handleKembaliPosSebelumnya}
              primaryColorClass="bg-[#2563eb] hover:bg-blue-700"
            />
        </form>
      </div>
      )}
    </div>
  );
}
export default Pos4;
