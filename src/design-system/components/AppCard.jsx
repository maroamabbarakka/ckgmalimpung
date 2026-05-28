export default function AppCard({ children, className = '', accent = false }) {
  return (
    <div className={`rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm ${accent ? 'shadow-lg shadow-slate-200/80' : ''} ${className}`}>
      {children}
    </div>
  );
}
