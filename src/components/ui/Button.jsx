const variantClass = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
};

const sizeClass = {
  sm: 'min-h-9 px-3 py-2 text-xs',
  md: 'min-h-11 px-4 py-3 text-sm',
  lg: 'min-h-12 px-5 py-3 text-base',
};

export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-2xl font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant] || variantClass.primary,
        sizeClass[size] || sizeClass.md,
        className,
      ].join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
