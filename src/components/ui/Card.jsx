const variantClass = {
  default: 'border border-slate-200 bg-white shadow-sm',
  elevated: 'border border-white bg-white shadow-xl shadow-slate-200/70',
  compact: 'border border-slate-200 bg-white shadow-sm',
};

const paddingClass = {
  default: 'p-4 md:p-5',
  elevated: 'p-4 md:p-5',
  compact: 'p-3',
};

export function Card({ children, variant = 'default', className = '' }) {
  return (
    <section className={`rounded-3xl ${variantClass[variant] || variantClass.default} ${paddingClass[variant] || paddingClass.default} ${className}`}>
      {children}
    </section>
  );
}
