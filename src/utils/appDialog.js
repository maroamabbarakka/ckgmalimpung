export const DIALOG_EVENT = 'tersanjung:dialog';

const emitDialog = (payload) => new Promise((resolve) => {
  if (typeof window === 'undefined') {
    resolve(payload.type === 'confirm' ? false : undefined);
    return;
  }

  window.dispatchEvent(new CustomEvent(DIALOG_EVENT, {
    detail: { ...payload, resolve }
  }));
});

export const confirmDialog = (options) => emitDialog({
  type: 'confirm',
  variant: 'warning',
  confirmLabel: 'Lanjutkan',
  cancelLabel: 'Batal',
  ...(typeof options === 'string' ? { title: 'Konfirmasi', message: options } : options)
});

export const alertDialog = (options) => emitDialog({
  type: 'alert',
  variant: 'info',
  confirmLabel: 'Mengerti',
  ...(typeof options === 'string' ? { title: 'Informasi', message: options } : options)
});
