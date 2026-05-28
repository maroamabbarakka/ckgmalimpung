export default function AppSection({ title, description, children, className = '' }) {
  return (
    <section className={`rounded-[2rem] border border-slate-200 bg-slate-50/90 p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-black text-slate-900">{title}</h2>}
          {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
