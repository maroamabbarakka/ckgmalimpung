export default function AppStatCard({ label, value, description, tone = 'info', icon, className = '' }) {
  const toneClasses = {
    info: 'bg-sky-600 text-white',
    success: 'bg-emerald-600 text-white',
    warning: 'bg-amber-500 text-slate-900',
    danger: 'bg-rose-600 text-white',
    neutral: 'bg-slate-900 text-white'
  };

  return (
    <div className={`rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value ?? 0}</h3>
        </div>
        {icon && <div className={`flex h-12 w-12 items-center justify-center rounded-3xl ${toneClasses[tone]}`}>{icon}</div>}
      </div>
      {description && <p className="mt-4 text-sm text-slate-500">{description}</p>}
    </div>
  );
}
