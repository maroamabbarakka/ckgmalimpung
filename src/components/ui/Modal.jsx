import { useEffect } from 'react';
import { Button } from './Button';

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  closeLabel = 'Tutup',
  size = 'md',
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm md:items-center">
      <div className={`w-full ${sizeClass[size] || sizeClass.md} overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl`}>
        <header className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">{title}</h2>
              {description && <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-500 hover:bg-slate-50"
              aria-label={closeLabel}
            >
              x
            </button>
          </div>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          {footer || (
            <Button type="button" variant="secondary" onClick={onClose}>
              {closeLabel}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
