const toneClass = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
};

export function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${toneClass[tone] || toneClass.neutral} ${className}`}>
      {children}
    </span>
  );
}
