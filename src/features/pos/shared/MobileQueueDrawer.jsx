import { useMemo, useState } from 'react';

export function MobileQueueDrawer({
  open,
  onClose,
  queue = [],
  activeVisitId = '',
  onSelect,
  callingVisitId = '',
  title = 'Antrean',
}) {
  const [search, setSearch] = useState('');
  const filteredQueue = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return queue;
    return queue.filter((item) => {
      const patient = item.pasien_snapshot || {};
      return [item.nomor_antrian, patient.nama, item.kategori_usia_satusehat, item.status_antrian]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [queue, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/45 backdrop-blur-sm md:hidden">
      <section className="max-h-[82vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl">
        <header className="border-b border-slate-100 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-teal-600">{title}</p>
              <h2 className="text-xl font-black text-slate-900">{queue.length} pasien</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black uppercase text-slate-600"
            >
              Tutup
            </button>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nomor atau nama..."
            className="mt-4 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </header>
        <div className="max-h-[58vh] space-y-3 overflow-y-auto p-4">
          {filteredQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
              Tidak ada antrean sesuai pencarian.
            </div>
          ) : (
            filteredQueue.map((item) => {
              const patient = item.pasien_snapshot || {};
              const active = activeVisitId === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    onSelect?.(item);
                    onClose?.();
                  }}
                  disabled={Boolean(callingVisitId) || active}
                  className={`w-full rounded-2xl border p-4 text-left shadow-sm disabled:cursor-wait disabled:opacity-60 ${
                    active ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-2xl font-black text-slate-900">{item.nomor_antrian || '-'}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-500">
                      {callingVisitId === item.id ? 'Memanggil' : item.kategori_usia_satusehat || '-'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-black text-slate-800">{patient.nama || 'Tanpa nama'}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.status_antrian || '-'}</p>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
