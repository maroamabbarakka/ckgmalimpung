export default function LoadingState({ title = 'Memuat data...', description = '', className = '' }) {
  return (
    <div className={`flex min-h-[50vh] flex-col items-center justify-center bg-slate-50 px-6 text-center ${className}`}>
      <div className="h-11 w-11 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
      <p className="mt-4 text-sm font-black uppercase tracking-widest text-teal-700">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-slate-500">{description}</p>}
    </div>
  );
}
