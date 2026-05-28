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

function Pos3() {
  const { user } = useAuth();
  const antrian = useQueue('POS3');
  const [pasienAktif, setPasienAktif] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false); 
  const [callingVisitId, setCallingVisitId] = useState(null);

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
        module: 'POS3',
        workflowStatus: VISIT_STATUS.POS3_IN_PROGRESS
      });
      const activeSchema = getSchemaForVisit(activeVisit);
      setPasienAktif(activeVisit); setFormData(sanitizeFormDataForSchema(activeSchema, activeVisit.pos3 || {})); window.scrollTo({ top: 0, behavior: 'smooth' });
      try { await createTvQueueCall({ pos: "POS 3", queueNumber: activeVisit.nomor_antrian, speechText: buildQueueSpeech(activeVisit.nomor_antrian, 'Silakan menuju Pos Tiga.') }); } catch (e) { console.warn("Gagal membuat panggilan TV Pos 3:", e); }
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
        posNumber: 3,
        kategoriUsia: pasienAktif.kategori_usia_satusehat || '-'
      });
      await updateVisit(pasienAktif.id, { status: VISIT_STATUS.POS3_COMPLETE, status_antrian: STATUS_MAPPING.POS4, petugas_pos3: user?.nama || 'Sistem', pos3: sanitizedFormData, pos3_question_map: buildQuestionMap(activeSchema), petugas_aktif: null });
      await auditQueueTransition({
        visit: pasienAktif,
        module: 'Pos 3',
        action: 'Simpan Pos 3 dan lanjut ke Pos 4',
        toStatus: STATUS_MAPPING.POS4,
        extra: { status: VISIT_STATUS.POS3_COMPLETE, petugas_pos3: user?.nama || 'Sistem' }
      });
      setTimeout(() => setPasienAktif(null), 1000); 
    } catch (error) { console.error("Gagal menyimpan data Pos 3:", error); alert("Gagal menyimpan data!"); } finally { setLoading(false); }
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
    const lanjut = window.confirm('Kembalikan pasien ke Pos 2? Perubahan yang belum disimpan di Pos 3 tidak akan dicatat.');
    if (!lanjut) return;
    setLoading(true);
    try {
      await updateVisit(pasienAktif.id, {
        status_antrian: STATUS_MAPPING.POS2,
        petugas_aktif: null
      });
      await auditQueueTransition({
        visit: pasienAktif,
        module: 'Pos 3',
        action: 'Kembalikan pasien dari Pos 3 ke Pos 2',
        toStatus: STATUS_MAPPING.POS2
      });
      setPasienAktif(null);
    } catch (error) {
      console.error("Gagal mengembalikan pasien ke Pos 2:", error);
      alert("Gagal mengembalikan pasien ke Pos 2.");
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
      <div className="pos-main-card bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <PatientStickyHeader
          visit={pasienAktif}
          posLabel="Pos 3: Pemeriksaan Fisik"
          accentClass="bg-[#e11d48]"
          onCancel={handleBatal}
          queueCount={antrian.length}
        />
        <div className="hidden bg-[#e11d48] p-6 text-white flex justify-between items-center">
            <h2 className="text-4xl font-black">{pasienAktif.nomor_antrian}</h2>
            <button type="button" onClick={handleBatal} className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs">✕ Batal</button>
        </div>
        <form onSubmit={handleSimpanData} className="pos-form-surface p-4 md:p-6 bg-[#f8fafc] mobile-safe-page">
            <div className="patient-summary-card bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-lg">{pasienAktif.pasien_snapshot?.nama || "Tanpa Nama"}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{umurPasien} THN • {kategoriPasien}</p>
            </div>
            
            <DynamicFormRenderer schema={getActiveSchema()} formData={formData} fullData={pasienAktif} onChange={(id, val) => setFormData(prev => ({ ...prev, [id]: val }))} posNumber={3} kategoriUsia={pasienAktif.kategori_usia_satusehat || '-'} />
            
            <PosBottomActionBar
              backLabel="Kembali ke Pos 2"
              primaryLabel="Simpan & Lanjut Pos 4"
              loading={loading}
              onBack={handleKembaliPosSebelumnya}
            />
        </form>
      </div>
      )}
    </div>
  );
}
export default Pos3;
