import { useEffect, useState } from 'react';
import ConnectionStatus from './ConnectionStatus';
import { listPendingSyncs, PENDING_SYNC_CHANGED_EVENT } from '../../utils/syncQueueStorage';

export default function SyncStatusBanner({ className = '' }) {
  const [pendingSyncs, setPendingSyncs] = useState([]);

  useEffect(() => {
    const updatePendingSyncs = () => setPendingSyncs(listPendingSyncs());
    updatePendingSyncs();
    window.addEventListener('storage', updatePendingSyncs);
    window.addEventListener('focus', updatePendingSyncs);
    window.addEventListener(PENDING_SYNC_CHANGED_EVENT, updatePendingSyncs);
    return () => {
      window.removeEventListener('storage', updatePendingSyncs);
      window.removeEventListener('focus', updatePendingSyncs);
      window.removeEventListener(PENDING_SYNC_CHANGED_EVENT, updatePendingSyncs);
    };
  }, []);

  if (pendingSyncs.length === 0) return <ConnectionStatus className={className} />;

  const summary = pendingSyncs
    .map((item) => `${item.moduleName?.toUpperCase() || 'POS'} ${item.patientName ? `- ${item.patientName}` : ''}`)
    .join(' • ');

  return (
    <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <ConnectionStatus />
      <div title={summary} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800 shadow-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        {pendingSyncs.length} data menunggu sinkron
      </div>
    </div>
  );
}
