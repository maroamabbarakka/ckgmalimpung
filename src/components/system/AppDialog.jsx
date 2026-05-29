import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { DIALOG_EVENT } from '../../utils/appDialog';

const dialogTone = (variant = 'info') => {
  if (variant === 'danger' || variant === 'error') {
    return {
      icon: XCircle,
      iconClass: 'bg-rose-50 text-rose-600',
      confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
    };
  }
  if (variant === 'warning') {
    return {
      icon: AlertTriangle,
      iconClass: 'bg-amber-50 text-amber-600',
      confirmClass: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100'
    };
  }
  if (variant === 'success') {
    return {
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
    };
  }
  return {
    icon: Info,
    iconClass: 'bg-teal-50 text-teal-600',
    confirmClass: 'bg-teal-600 hover:bg-teal-700 shadow-teal-100'
  };
};

function AppDialogProvider() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const handleDialog = (event) => setDialog(event.detail);
    window.addEventListener(DIALOG_EVENT, handleDialog);
    return () => window.removeEventListener(DIALOG_EVENT, handleDialog);
  }, []);

  const closeDialog = (value) => {
    dialog?.resolve?.(value);
    setDialog(null);
  };

  if (!dialog) return null;

  const isConfirm = dialog.type === 'confirm';
  const tone = dialogTone(dialog.variant);
  const Icon = tone.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm print:hidden">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25">
        <div className="flex items-start gap-4 border-b border-slate-100 p-6">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.iconClass}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-teal-600">TERSANJUNG</p>
            <h3 className="mt-2 text-lg font-black leading-snug text-slate-950">{dialog.title || (isConfirm ? 'Konfirmasi' : 'Informasi')}</h3>
            {dialog.message && <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{dialog.message}</p>}
          </div>
          <button type="button" onClick={() => closeDialog(isConfirm ? false : undefined)} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700" aria-label="Tutup popup">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 bg-slate-50 p-4 sm:flex-row sm:justify-end">
          {isConfirm && (
            <button type="button" onClick={() => closeDialog(false)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-600 shadow-sm transition hover:bg-slate-100">
              {dialog.cancelLabel || 'Batal'}
            </button>
          )}
          <button type="button" onClick={() => closeDialog(isConfirm ? true : undefined)} className={`rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition ${tone.confirmClass}`}>
            {dialog.confirmLabel || (isConfirm ? 'Lanjutkan' : 'Mengerti')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppDialogProvider;
