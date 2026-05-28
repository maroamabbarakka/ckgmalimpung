export default function AppBadge({ children, tone = 'info', className = '' }) {
  const toneClasses = {
    info: 'bg-sky-100 text-sky-700 border border-sky-200',
    success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    danger: 'bg-rose-100 text-rose-700 border border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    queue: 'bg-teal-100 text-teal-700 border border-teal-200'
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone] || toneClasses.info} ${className}`}>
      {children}
    </span>
  );
}
