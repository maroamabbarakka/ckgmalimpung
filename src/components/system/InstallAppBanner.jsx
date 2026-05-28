import { useEffect, useState } from 'react';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const isIosSafari = () => {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
};

export default function InstallAppBanner() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwaInstallDismissed') === '1');
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissed) return undefined;

    if (isIosSafari()) {
      setShowIosHelp(true);
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setDismissed(true);
      localStorage.setItem('pwaInstallDismissed', '1');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [dismissed]);

  if (dismissed || isStandalone() || (!installPrompt && !showIosHelp)) return null;

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwaInstallDismissed', '1');
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-teal-200 bg-white p-3 shadow-xl shadow-slate-900/10 md:left-auto md:right-5 md:bottom-5 md:w-96">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg font-black text-teal-700">+</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900">Install Aplikasi</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
            {showIosHelp
              ? 'Di Safari iPhone, tekan tombol Bagikan lalu pilih Tambahkan ke Layar Utama.'
              : 'Pasang TERSANJUNG agar lebih cepat dibuka di perangkat layanan.'}
          </p>
          <div className="mt-3 flex gap-2">
            {!showIosHelp && (
              <button type="button" onClick={install} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-black text-white hover:bg-teal-700">
                Install Aplikasi
              </button>
            )}
            <button type="button" onClick={dismiss} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200">
              Nanti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
