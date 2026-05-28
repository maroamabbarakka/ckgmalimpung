export function FormField({ label, required = false, error = '', hint = '', children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
    </label>
  );
}
