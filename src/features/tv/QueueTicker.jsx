import { sanitizePublicQueueItem } from './tvService';

export function QueueTicker({ visits = [], limit = 8 }) {
  const items = visits.slice(0, limit).map(sanitizePublicQueueItem);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 xl:text-xs">Antrean Berikutnya</p>
      <div className="mt-3 grid min-h-0 flex-1 content-start gap-2 overflow-hidden xl:mt-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={`${item.nomorAntrian}-${item.posTujuan}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-lg font-black text-slate-800 xl:text-xl">
              <span>{item.nomorAntrian}</span>
              <span className="text-teal-700">{item.posTujuan}</span>
            </div>
          ))
        ) : (
          <div className="flex h-full min-h-16 items-center justify-center rounded-2xl bg-slate-50 px-3 text-center text-xs font-black uppercase tracking-widest text-slate-400 xl:min-h-28 xl:text-sm">
            Belum ada antrean
          </div>
        )}
      </div>
    </section>
  );
}
