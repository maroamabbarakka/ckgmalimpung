import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft, listDrafts, loadDraft, removeDraftByKey, saveDraft } from './draftStorage';

describe('draftStorage', () => {
  const store = new Map();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key) => store.get(key) || null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
      key: (index) => Array.from(store.keys())[index] || null,
      get length() {
        return store.size;
      },
    });
    localStorage.clear();
  });

  it('saves, loads, lists, and clears drafts', () => {
    saveDraft('pos2', 'visit-1', { berat: 50 });

    expect(loadDraft('pos2', 'visit-1')?.data).toEqual({ berat: 50 });
    expect(listDrafts()).toHaveLength(1);

    clearDraft('pos2', 'visit-1');
    expect(listDrafts()).toHaveLength(0);
  });

  it('removes draft by storage key', () => {
    saveDraft('pos2', 'visit-2', { tinggi: 160 });
    const [draft] = listDrafts();

    removeDraftByKey(draft.key);
    expect(loadDraft('pos2', 'visit-2')).toBeNull();
  });
});
