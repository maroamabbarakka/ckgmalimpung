export default function EmptyState({ icon = '□', title = 'Tidak ada data', description = '', action = null, className = '' }) {
  return (
    <div className={`flex min-h-[50vh] flex-col items-center justify-center bg-slate-50 px-6 text-center ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-3xl text-slate-400 shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-base font-black text-slate-800">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
