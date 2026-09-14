import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setDoc: vi.fn(),
  upsertPublicQueueFromVisit: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: mocks.setDoc,
  updateDoc: vi.fn(),
  where: vi.fn()
}));

vi.mock('../firebase', () => ({ db: {} }));
vi.mock('./publicQueueService', () => ({
  upsertPublicQueueFromVisit: mocks.upsertPublicQueueFromVisit
}));

import { createVisitWithRef } from './visitService';

describe('createVisitWithRef', () => {
  beforeEach(() => {
    mocks.setDoc.mockReset();
    mocks.upsertPublicQueueFromVisit.mockReset();
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.upsertPublicQueueFromVisit.mockResolvedValue(undefined);
  });

  it('keeps public queue synchronization enabled by default', async () => {
    const visitRef = { id: 'normal-visit' };
    const payload = { status_antrian: 'Pos 1' };
    await createVisitWithRef(visitRef, payload);
    expect(mocks.setDoc).toHaveBeenCalledWith(visitRef, payload);
    expect(mocks.upsertPublicQueueFromVisit).toHaveBeenCalledWith('normal-visit', payload);
  });

  it('skips public queue synchronization only when explicitly disabled', async () => {
    const visitRef = { id: 'dtd-visit' };
    const payload = { status_antrian: 'Selesai', visit_source: 'door_to_door' };
    await createVisitWithRef(visitRef, payload, { syncPublicQueue: false });
    expect(mocks.setDoc).toHaveBeenCalledWith(visitRef, payload);
    expect(mocks.upsertPublicQueueFromVisit).not.toHaveBeenCalled();
  });
});
