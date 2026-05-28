import { describe, expect, it } from 'vitest';
import { buildVisitLock, canClaimVisit, isVisitLockActive } from './visitLock';

describe('visitLock', () => {
  it('builds a 10 minute lock', () => {
    const lock = buildVisitLock({ nama: 'Petugas A', module: 'POS2', now: new Date('2026-05-27T00:00:00.000Z') });
    expect(lock.byName).toBe('Petugas A');
    expect(lock.module).toBe('POS2');
    expect(lock.expiresAt).toBe('2026-05-27T00:10:00.000Z');
  });

  it('detects active and expired locks', () => {
    const lock = { expiresAt: '2026-05-27T00:10:00.000Z' };
    expect(isVisitLockActive(lock, new Date('2026-05-27T00:09:00.000Z'))).toBe(true);
    expect(isVisitLockActive(lock, new Date('2026-05-27T00:11:00.000Z'))).toBe(false);
  });

  it('prevents non-admin takeover while lock is active', () => {
    const currentLock = { byName: 'Petugas A', expiresAt: '2026-05-27T00:10:00.000Z' };
    const now = new Date('2026-05-27T00:05:00.000Z');
    expect(canClaimVisit({ currentLock, nextStaffName: 'Petugas B', now })).toBe(false);
    expect(canClaimVisit({ currentLock, nextStaffName: 'Petugas B', isAdmin: true, now })).toBe(true);
  });
});
