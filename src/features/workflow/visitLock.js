export const LOCK_DURATION_MS = 10 * 60 * 1000;

export function buildVisitLock({ staffId = null, username = '', nama = '', role = [], module = '', now = new Date() } = {}) {
  const lockedAt = now.toISOString();
  return {
    byStaffId: staffId,
    byUsername: username,
    byName: nama || username || 'Petugas',
    role,
    module,
    lockedAt,
    expiresAt: new Date(now.getTime() + LOCK_DURATION_MS).toISOString(),
  };
}

export function isVisitLockActive(lock, now = new Date()) {
  if (!lock?.expiresAt) return false;
  const expiresAt = new Date(lock.expiresAt).getTime();
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt > now.getTime();
}

export function canClaimVisit({ currentLock, currentStaffName, nextStaffName, isAdmin = false, now = new Date() }) {
  if (isAdmin) return true;
  if (currentLock && isVisitLockActive(currentLock, now)) {
    return currentLock.byName === nextStaffName || currentLock.byUsername === nextStaffName;
  }
  return !currentStaffName || currentStaffName === nextStaffName;
}
