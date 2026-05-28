import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listDrafts, removeDraftByKey } from '../../utils/draftStorage';

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

export default function RecoveryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const drafts = useMemo(() => listDrafts().sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0)), [refreshKey]);

  const handleDelete = (key) => {
    const confirmDelete = window.confirm('Hapus draft lokal ini? Data draft tidak bisa dipulihkan setelah dihapus.');
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
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">{draft.moduleName || 'Modul tidak dikenal'}</p>
                  <h2 className="mt-1 text-lg font-black text-slate-900">Visit: {draft.visitId || '-'}</h2>
                  <p className="mt-1 text-xs font-bold text-slate-500">Disimpan: {formatSavedAt(draft.savedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draft.moduleName === 'pos2' && (
                    <Link to="/pos2" className="inline-flex min-h-11 items-center rounded-2xl bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700">
                      Buka Pos 2
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

