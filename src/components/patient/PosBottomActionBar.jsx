function PosBottomActionBar({
  backLabel,
  primaryLabel,
  loadingLabel = 'Menyimpan...',
  loading = false,
  onBack,
  primaryColorClass = 'bg-teal-700 hover:bg-teal-800',
  secondaryAction = null,
}) {
  const gridClass = secondaryAction ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className={`sticky mobile-safe-submit z-40 mt-6 grid grid-cols-1 gap-3 ${gridClass}`}>
      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="w-full min-h-[60px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black uppercase text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
      >
        {backLabel}
      </button>
      {secondaryAction}
      <button
        type="submit"
        disabled={loading}
        className={`w-full min-h-[60px] rounded-2xl px-4 text-sm font-black uppercase text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${primaryColorClass}`}
      >
        {loading ? loadingLabel : primaryLabel}
      </button>
    </div>
  );
}

export default PosBottomActionBar;
