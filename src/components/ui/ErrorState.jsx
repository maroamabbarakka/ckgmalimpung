export function ErrorState({ title = 'Data gagal dimuat', description, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
      <h3 className="font-black text-red-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-red-700">{description}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
          Coba Lagi
        </button>
      )}
    </div>
  );
}
