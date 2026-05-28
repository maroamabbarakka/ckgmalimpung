import { useEffect, useState } from 'react';

export default function ConnectionStatus({ className = '' }) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setReconnecting(true);
      window.setTimeout(() => setReconnecting(false), 2000);
    };
    const handleOffline = () => {
      setOnline(false);
      setReconnecting(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const label = reconnecting
    ? 'Menyambungkan ulang'
    : online
      ? 'Online'
      : 'Offline - data akan sinkron saat internet kembali';

  const tone = reconnecting
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : online
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black shadow-sm ${tone} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-rose-500'} ${reconnecting ? 'animate-pulse bg-amber-500' : ''}`} />
      {label}
    </div>
  );
}
