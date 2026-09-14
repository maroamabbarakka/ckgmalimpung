import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listDrafts, removeDraftByKey } from '../../utils/draftStorage';
import { listPendingSyncs } from '../../utils/syncQueueStorage';
import { confirmDialog } from '../../utils/appDialog';

function formatSavedAt(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDraftPatientName(draft) {
  return draft.data?.formData?.nama || draft.data?.nama || draft.data?.pasien_snapshot?.nama || '';
}

function getDraftModuleLabel(moduleName) {
  const labels = {
    pos1: 'Pos 1 - Registrasi',
    pos2: 'Pos 2 - Pemeriksaan Awal',
    pos3: 'Pos 3 - Pemeriksaan Fisik',
    pos4: 'Pos 4 - PTM',
    pos5: 'Pos 5 - Pemeriksaan Khusus',
    pos6: 'Pos 6 - Diagnosis'
  };
  return labels[moduleName] || moduleName || 'Modul tidak dikenal';
}

export default function RecoveryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const drafts = useMemo(() => listDrafts().sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0)), [refreshKey]);
  const pendingSyncs = useMemo(() => listPendingSyncs().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [refreshKey]);

  const handleDelete = async (key) => {
    const confirmDelete = await confirmDialog({
      title: 'Hapus draft lokal?',
      message: 'Data draft tidak bisa dipulihkan setelah dihapus.',
      confirmLabel: 'Hapus Draft',
      variant: 'danger'
    });
    if (!confirmDelete) return;
    removeDraftByKey(key);
    setRefreshKey((value) => value + 1);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-4">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-teal-600">Pemulihan Data</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">Draft Lokal Tersimpan</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
          Draft disimpan di perangkat ini saat form belum selesai dikirim. Buka modul terkait untuk memulihkan draft, atau hapus draft yang tidak diperlukan.
        </p>
      </header>

      {pendingSyncs.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">Menunggu Sinkron</p>
          <h2 className="mt-1 text-lg font-black text-amber-950">{pendingSyncs.length} data disimpan saat offline</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-800">
            Data ini sudah dicatat di perangkat dan akan dikirim oleh Firestore saat jaringan kembali. Setelah online beberapa detik, status ini akan hilang otomatis.
          </p>
          <div className="mt-4 grid gap-2">
            {pendingSyncs.map((item) => (
              <div key={item.key} className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3">
                <p className="text-sm font-black text-amber-950">{item.patientName || item.visitId || 'Pasien'}</p>
                <p className="mt-1 text-xs font-bold text-amber-700">
                  {getDraftModuleLabel(item.moduleName)} • {item.action || 'Simpan data'} • {formatSavedAt(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {drafts.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h2 className="text-lg font-black text-slate-800">Belum ada draft tersimpan</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Form pos yang memakai autosave akan muncul di sini.</p>
        </section>
      ) : (
        <section className="grid gap-3">
          {drafts.map((draft) => (
            <article key={draft.key} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">{getDraftModuleLabel(draft.moduleName)}</p>
                  <h2 className="mt-1 text-lg font-black text-slate-900">{getDraftPatientName(draft) || `Visit: ${draft.visitId || '-'}`}</h2>
                  {getDraftPatientName(draft) && <p className="mt-1 text-xs font-bold text-slate-400">Visit: {draft.visitId || '-'}</p>}
                  <p className="mt-1 text-xs font-bold text-slate-500">Disimpan: {formatSavedAt(draft.savedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draft.moduleName === 'pos1' && (
                    <Link to="/pos1" className="inline-flex min-h-11 items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700">
                      Buka Pos 1
                    </Link>
                  )}
                  {draft.moduleName === 'pos2' && (
                    <Link to="/pos2" className="inline-flex min-h-11 items-center rounded-2xl bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700">
                      Buka Pos 2
                    </Link>
                  )}
                  {draft.moduleName === 'pos3' && (
                    <Link to="/pos3" className="inline-flex min-h-11 items-center rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700">
                      Buka Pos 3
                    </Link>
                  )}
                  {draft.moduleName === 'pos4' && (
                    <Link to="/pos4" className="inline-flex min-h-11 items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700">
                      Buka Pos 4
                    </Link>
                  )}
                  {draft.moduleName === 'pos5' && (
                    <Link to="/pos5" className="inline-flex min-h-11 items-center rounded-2xl bg-fuchsia-600 px-4 py-2 text-sm font-black text-white hover:bg-fuchsia-700">
                      Buka Pos 5
                    </Link>
                  )}
                  {draft.moduleName === 'pos6' && (
                    <Link to="/pos6" className="inline-flex min-h-11 items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700">
                      Buka Pos 6
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(draft.key)}
                    className="inline-flex min-h-11 items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-100"
                  >
                    Hapus Draft
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
