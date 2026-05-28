import { useState } from 'react';
import { X } from 'lucide-react';
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
import { useAutosaveDraft } from './hooks/useAutosaveDraft';
import { clearDraft, loadDraft } from './utils/draftStorage';
import { MobileQueueDrawer } from './features/pos/shared/MobileQueueDrawer';
import PosBottomActionBar from './components/patient/PosBottomActionBar';
import WorkflowStepper from './components/patient/WorkflowStepper';
import QueueStatusBadge from './design-system/components/QueueStatusBadge';
import { maskNik } from './utils/privacy';
import QueueCallList from './components/patient/QueueCallList';

function Pos2() {
  const { user } = useAuth();
  const antrian = useQueue('POS2');
  const [pasienAktif, setPasienAktif] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false); 
  const [callingVisitId, setCallingVisitId] = useState(null);
  const [draftSavedAt, setDraftSavedAt] = useState('');
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);

  useAutosaveDraft({
    moduleName: 'pos2',
    visitId: pasienAktif?.id,
    data: formData,
    enabled: Boolean(pasienAktif?.id && Object.keys(formData).length),
    onSaved: () => setDraftSavedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
  });

  // 🛡️ PENGAMAN VARIABEL YANG HILANG
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
        module: 'POS2',
        workflowStatus: VISIT_STATUS.POS2_IN_PROGRESS
      });
      const activeSchema = getSchemaForVisit(activeVisit);
      const serverFormData = sanitizeFormDataForSchema(activeSchema, activeVisit.pos2 || {});
      const draft = loadDraft('pos2', activeVisit.id);
      const shouldRestoreDraft = draft?.data && window.confirm(`Ada draft Pos 2 tersimpan pada ${draft.savedAt}. Pulihkan draft ini?`);
      setPasienAktif(activeVisit);
      setDraftSavedAt(draft?.savedAt ? new Date(draft.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '');
      setFormData(shouldRestoreDraft ? draft.data : serverFormData);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try { await createTvQueueCall({ pos: "POS 2", queueNumber: activeVisit.nomor_antrian, speechText: buildQueueSpeech(activeVisit.nomor_antrian, 'Silakan menuju Pos Dua.') }); } catch (e) { console.warn("Gagal membuat panggilan TV Pos 2:", e); }
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
        posNumber: 2,
        kategoriUsia: pasienAktif.kategori_usia_satusehat || '-'
      });
      await updateVisit(pasienAktif.id, { status: VISIT_STATUS.POS2_COMPLETE, status_antrian: STATUS_MAPPING.POS3, petugas_pos2: user?.nama || 'Sistem', pos2: sanitizedFormData, pos2_question_map: buildQuestionMap(activeSchema), petugas_aktif: null });
      clearDraft('pos2', pasienAktif.id);
      setDraftSavedAt('');
      await auditQueueTransition({
        visit: pasienAktif,
        module: 'Pos 2',
        action: 'Simpan Pos 2 dan lanjut ke Pos 3',
        toStatus: STATUS_MAPPING.POS3,
        extra: { status: VISIT_STATUS.POS2_COMPLETE, petugas_pos2: user?.nama || 'Sistem' }
      });
      setTimeout(() => setPasienAktif(null), 1000); 
    } catch (error) { console.error("Gagal menyimpan data Pos 2:", error); alert("Gagal menyimpan data!"); } finally { setLoading(false); }
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
    const lanjut = window.confirm('Kembalikan pasien ke Pos 1? Perubahan yang belum disimpan di Pos 2 tidak akan dicatat.');
    if (!lanjut) return;
    setLoading(true);
    try {
      await updateVisit(pasienAktif.id, {
        status_antrian: STATUS_MAPPING.POS1,
        petugas_aktif: null
      });
      await auditQueueTransition({
        visit: pasienAktif,
        module: 'Pos 2',
        action: 'Kembalikan pasien dari Pos 2 ke Pos 1',
        toStatus: STATUS_MAPPING.POS1
      });
      setPasienAktif(null);
    } catch (error) {
      console.error("Gagal mengembalikan pasien ke Pos 1:", error);
      alert("Gagal mengembalikan pasien ke Pos 1.");
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
    <div className="pos2-page pos-page-container space-y-6 max-w-5xl mx-auto mobile-safe-page px-2 md:px-0 font-sans">
      {!pasienAktif ? (
        <>
        <QueueCallList
          queue={antrian}
          onCall={handlePanggil}
          callingVisitId={callingVisitId}
        />
        </>
      ) : (
      <div className="pos-main-card pos2-workflow bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="pos-header pos-workflow-header">
          <div className="pos-stepper">
            <WorkflowStepper activeKey="pos2" />
          </div>
          <div className="mobile-status-summary md:hidden">Status: Siap diperiksa</div>

          <div className="pos-header-main pos2-header-main">
            <div className="pos2-patient-block">
              <div className="queue-code queue-number">{pasienAktif.nomor_antrian || '-'}</div>
              <div className="min-w-0">
                <p className="pos-type-label pos-label">P2 · Antropometri, Tensi & Gula Darah</p>
                <h2 className="patient-name">{pasienAktif.pasien_snapshot?.nama || "Tanpa Nama"}</h2>
                <p className="patient-meta">{umurPasien} THN · {kategoriPasien} <span className="patient-nik">· NIK {maskNik(pasienAktif?.patientNIK)}</span></p>
              </div>
            </div>

            <div className="header-actions header-action-row">
              <QueueStatusBadge status={pasienAktif?.status_antrian} className="header-status-chip bg-white/15 text-white border-white/20" />
              <button type="button" onClick={() => setQueueDrawerOpen(true)} className="header-queue-btn header-action-primary">
                Antri Pos 2 ({antrian.length})
              </button>
              <button type="button" onClick={handleBatal} className="header-cancel-btn header-action-secondary" aria-label="Batalkan pasien aktif" title="Batal">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="status-chip-row header-status-row">
            <span>OK Identitas Lengkap</span>
            <span>OK Antrean Aktif</span>
            <span>{draftSavedAt ? `Draft tersimpan ${draftSavedAt}` : 'Draft lokal aktif'}</span>
          </div>
        </div>
        <div className="hidden bg-[#4f46e5] p-6 text-white flex justify-between items-center">
            <h2 className="text-4xl font-black">{pasienAktif.nomor_antrian}</h2>
            <button type="button" onClick={handleBatal} className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs">✕ Batal</button>
        </div>
        <form onSubmit={handleSimpanData} className="pos2-form p-4 md:p-6 bg-[#f8fafc] mobile-safe-page">
            <div className="mobile-section-tabs md:hidden" aria-label="Navigasi bagian pemeriksaan Pos 2">
              <a href="#pos2-antropometri">Antropometri</a>
              <a href="#pos2-tensi">Tensi</a>
              <a href="#pos2-gula">Gula Darah</a>
            </div>
            <div className="queue-list-button mb-3 md:hidden">
              <button
                type="button"
                onClick={() => setQueueDrawerOpen(true)}
                className="min-h-12 w-full rounded-2xl border border-[#4f46e5]/20 bg-white px-4 text-sm font-black uppercase text-[#4f46e5] shadow-sm"
              >
                Lihat Antrean ({antrian.length})
              </button>
            </div>
            <div className="patient-summary-card bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-lg">{pasienAktif.pasien_snapshot?.nama || "Tanpa Nama"}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{umurPasien} THN • {kategoriPasien}</p>
                <p className="autosave-status mt-2 text-[10px] font-bold uppercase text-emerald-600">
                  {draftSavedAt ? `Draft lokal tersimpan ${draftSavedAt}` : 'Draft lokal aktif'}
                </p>
            </div>
            
            <DynamicFormRenderer schema={getActiveSchema()} formData={formData} fullData={pasienAktif} onChange={(id, val) => setFormData(prev => ({ ...prev, [id]: val }))} posNumber={2} kategoriUsia={pasienAktif.kategori_usia_satusehat || '-'} />
            
            <PosBottomActionBar
              backLabel="Kembali ke Pos 1"
              primaryLabel="Simpan & Lanjut Pos 3"
              loading={loading}
              onBack={handleKembaliPosSebelumnya}
            />
        </form>
      </div>
      )}
      <MobileQueueDrawer
        open={queueDrawerOpen}
        onClose={() => setQueueDrawerOpen(false)}
        queue={antrian}
        activeVisitId={pasienAktif?.id}
        onSelect={handlePanggil}
        callingVisitId={callingVisitId}
        title="Antrean Pos 2"
      />
    </div>
  );
}
export default Pos2;
