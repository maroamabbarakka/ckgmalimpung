const PREFIX = 'ckg_pending_sync';
export const PENDING_SYNC_CHANGED_EVENT = 'ckg:pending-sync-changed';

function pendingSyncKey(moduleName, visitId) {
  return `${PREFIX}:${moduleName}:${visitId}`;
}

function notifyPendingSyncChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PENDING_SYNC_CHANGED_EVENT));
}

export function recordPendingSync(moduleName, visitId, data = {}) {
  if (!moduleName || !visitId || typeof localStorage === 'undefined') return;
  localStorage.setItem(
    pendingSyncKey(moduleName, visitId),
    JSON.stringify({
      moduleName,
      visitId,
      patientName: data.patientName || '',
      action: data.action || 'Simpan data',
      createdAt: data.createdAt || new Date().toISOString(),
    })
  );
  notifyPendingSyncChanged();
}

export function clearPendingSync(moduleName, visitId) {
  if (!moduleName || !visitId || typeof localStorage === 'undefined') return;
  localStorage.removeItem(pendingSyncKey(moduleName, visitId));
  notifyPendingSyncChanged();
}

export function clearAllPendingSyncs() {
  if (typeof localStorage === 'undefined') return;
  const keys = Array.from({ length: localStorage.length || 0 }, (_, index) => localStorage.key(index))
    .filter((key) => key?.startsWith(`${PREFIX}:`));
  keys.forEach((key) => localStorage.removeItem(key));
  notifyPendingSyncChanged();
}

export function listPendingSyncs() {
  if (typeof localStorage === 'undefined') return [];
  const keys = Array.from({ length: localStorage.length || 0 }, (_, index) => localStorage.key(index))
    .filter(Boolean);
  const fallbackKeys = Object.keys(localStorage);

  return [...new Set([...keys, ...fallbackKeys])]
    .filter((key) => key.startsWith(`${PREFIX}:`))
    .map((key) => {
      try {
        return { key, ...JSON.parse(localStorage.getItem(key)) };
      } catch {
        return { key, broken: true };
      }
    });
}

export function isBrowserOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
