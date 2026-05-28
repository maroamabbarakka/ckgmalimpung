export default function AppButton({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variantClasses = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-4 focus-visible:ring-teal-200',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-4 focus-visible:ring-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-4 focus-visible:ring-rose-200',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-4 focus-visible:ring-emerald-200',
    warning: 'bg-amber-500 text-slate-950 hover:bg-amber-600 focus-visible:ring-4 focus-visible:ring-amber-200',
    ghost: 'bg-transparent text-slate-800 hover:bg-slate-100 focus-visible:ring-4 focus-visible:ring-slate-200'
  };

  const sizeClasses = {
    sm: 'min-h-10 px-3 py-2 text-sm',
    md: 'min-h-11 px-4 py-3 text-sm',
    lg: 'min-h-12 px-5 py-3 text-base',
    xl: 'min-h-14 px-6 py-4 text-lg'
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
