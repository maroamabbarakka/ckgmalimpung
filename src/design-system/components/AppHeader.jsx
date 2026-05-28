export default function AppHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <header className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600">{eyebrow}</p>}
        {title && <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{title}</h1>}
        {description && <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
