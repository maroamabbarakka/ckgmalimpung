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
import QueueCallList from './components/patient/QueueCallList';

function Pos6() {
  const { user } = useAuth();
  const antrian = useQueue('POS6');
  const [pasienAktif, setPasienAktif] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false); 
  const [callingVisitId, setCallingVisitId] = useState(null);
  const [pesan, setPesan] = useState('');

  const umurPasien = pasienAktif?.umur_saat_periksa || 0;

  const handlePanggil = async (item) => {
    if (callingVisitId || pasienAktif) return;
    setCallingVisitId(item.id);
    try {
      const activeVisit = await claimVisitForStaff({
        visitId: item.id,
        staffName: user?.nama || 'Petugas',
        isAdmin: user?.roles?.includes('admin'),
        actor: user,
        module: 'POS6',
        workflowStatus: VISIT_STATUS.POS6_IN_PROGRESS
      });
      const activeSchema = getSchemaForVisit(activeVisit);
      setPasienAktif(activeVisit); setPesan(''); setFormData(sanitizeFormDataForSchema(activeSchema, activeVisit.pos6 || {})); window.scrollTo({ top: 0, behavior: 'smooth' });
      try { await createTvQueueCall({ pos: "POS 6", queueNumber: activeVisit.nomor_antrian, speechText: buildQueueSpeech(activeVisit.nomor_antrian, 'Silakan menuju meja Pos Enam.') }); } catch (e) { console.warn("Gagal membuat panggilan TV Pos 6:", e); }
    } catch (e) {
      alert("⚠️ " + e.message);
    } finally {
      setCallingVisitId(null);
    }
  };

  const handleSimpanData = async (e) => {
    e.preventDefault(); if (!pasienAktif || loading) return; setLoading(true); setPesan('');
    try {
      // 🚀 Setelah POS 6 selesai, pasien dikirim ke POS 7 (Review Dokter & Rapor)
      const activeSchema = getActiveSchema();
      const sanitizedFormData = sanitizeFormDataForSchema(activeSchema, formData, {
        posNumber: 6,
        kategoriUsia: pasienAktif.kategori_usia_satusehat || '-'
      });
      await updateVisit(pasienAktif.id, {
          status: VISIT_STATUS.POS6_COMPLETE,
          status_antrian: STATUS_MAPPING.POS7,
          petugas_pos6: user?.nama || 'Sistem',
          pos6: sanitizedFormData,
          pos6_question_map: buildQuestionMap(activeSchema),
          petugas_aktif: null
      });
      await auditQueueTransition({
        visit: pasienAktif,
        module: 'Pos 6',
        action: 'Simpan Pos 6 dan lanjut ke Pos 7',
        toStatus: STATUS_MAPPING.POS7,
        extra: { status: VISIT_STATUS.POS6_COMPLETE, petugas_pos6: user?.nama || 'Sistem' }
      });
      setPesan(`✅ Data terekam.`); setTimeout(() => setPasienAktif(null), 1000); 
    } catch (error) { setPesan("❌ Gagal menyimpan data: " + error.message); } finally { setLoading(false); }
  };

  const handleBatal = async () => {
    if (pasienAktif?.id) {
      try {
        await updateVisit(pasienAktif.id, { petugas_aktif: null });
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
      await updateVisit(pasienAktif.id, {
        status_antrian: STATUS_MAPPING.POS5,
        petugas_aktif: null
      });
      await auditQueueTransition({
        visit: pasienAktif,
        module: 'Pos 6',
        action: 'Kembalikan pasien dari Pos 6 ke Pos 5',
        toStatus: STATUS_MAPPING.POS5
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
    <div className="pos-page-container space-y-6 max-w-5xl mx-auto mobile-safe-page px-2 md:px-0 font-sans">
      {!pasienAktif ? (
        <>
        <QueueCallList
          queue={antrian}
          onCall={handlePanggil}
          callingVisitId={callingVisitId}
        />
        </>
      ) : (
      <div className="pos-main-card bg-slate-50 rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <PatientStickyHeader
          visit={pasienAktif}
          posLabel="Pos 6: Diagnosis"
          accentClass="bg-[#10b981]"
          onCancel={handleBatal}
          queueCount={antrian.length}
        />
        <div className="hidden bg-[#10b981] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚕️</span>
              <h2 className="text-4xl font-black">{pasienAktif.nomor_antrian}</h2>
            </div>
            <button type="button" onClick={handleBatal} className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-white/30 transition-all">✕ Batal</button>
        </div>
        <form onSubmit={handleSimpanData} className="pos-form-surface p-4 md:p-6 bg-[#f8fafc] mobile-safe-page">
            {pesan && <div className={`p-4 rounded-xl font-bold text-xs shadow-sm mb-6 ${pesan.includes('❌') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{pesan}</div>}
            
            <div className="patient-summary-card bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-lg">{pasienAktif.pasien_snapshot?.nama || "Tanpa Nama"}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{umurPasien} THN • {pasienAktif.kategori_usia_satusehat}</p>
            </div>

            <DynamicFormRenderer schema={getActiveSchema()} formData={formData} fullData={pasienAktif} onChange={(id, val) => setFormData(prev => ({ ...prev, [id]: val }))} posNumber={6} primaryColor="emerald" kategoriUsia={pasienAktif.kategori_usia_satusehat || '-'} />            
            <PosBottomActionBar
              backLabel="Kembali ke Pos 5"
              primaryLabel="Simpan & Lanjut Pos 7"
              loading={loading}
              onBack={handleKembaliPosSebelumnya}
            />
        </form>
      </div>
      )}
    </div>
  );
}
export default Pos6;
