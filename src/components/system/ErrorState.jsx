export default function ErrorState({ title = 'Terjadi kendala', description = 'Silakan coba beberapa saat lagi.', action = null, className = '' }) {
  return (
    <div className={`flex min-h-[50vh] flex-col items-center justify-center bg-rose-50 px-6 text-center ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-white text-3xl text-rose-500 shadow-sm">
        !
      </div>
      <p className="mt-4 text-base font-black text-rose-800">{title}</p>
      <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-rose-700/80">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
