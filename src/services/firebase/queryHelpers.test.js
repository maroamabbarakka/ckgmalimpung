import { describe, expect, it } from 'vitest';
import { mapSnapshotWithId, sortByFirestoreDate } from './queryHelpers';

describe('queryHelpers', () => {
  it('maps snapshot documents with id', () => {
    const snapshot = {
      forEach(callback) {
        callback({ id: 'a', data: () => ({ nama: 'A' }) });
      },
    };

    expect(mapSnapshotWithId(snapshot)).toEqual([{ id: 'a', nama: 'A' }]);
  });

  it('sorts by Firestore-like timestamp', () => {
    const rows = [
      { id: 'b', waktu: { toMillis: () => 2 } },
      { id: 'a', waktu: { toMillis: () => 1 } },
    ];

    expect([...rows].sort(sortByFirestoreDate('waktu')).map((row) => row.id)).toEqual(['a', 'b']);
    expect([...rows].sort(sortByFirestoreDate('waktu', 'desc')).map((row) => row.id)).toEqual(['b', 'a']);
  });
});
