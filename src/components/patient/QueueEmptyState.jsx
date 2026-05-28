export default function QueueEmptyState({
  title = 'Tidak ada antrean',
  description = 'Pasien yang masuk ke pos ini akan tampil otomatis saat status antreannya sesuai.',
  accentClass = 'text-teal-700'
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-400 shadow-sm">
        0
      </div>
      <p className={`mt-4 text-sm font-black uppercase tracking-widest ${accentClass}`}>{title}</p>
      <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
