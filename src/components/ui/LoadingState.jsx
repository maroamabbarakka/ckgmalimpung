export function LoadingState({ label = 'Memuat data...' }) {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-3 h-8 w-full rounded bg-slate-100" />
      <p className="mt-3 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}
