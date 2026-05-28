import { describe, expect, it, vi } from 'vitest';

const firestoreState = vi.hoisted(() => ({ docs: [] }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, name) => ({ db, name })),
  where: vi.fn((field, op, value) => ({ field, op, value })),
  query: vi.fn((...parts) => parts),
  getDocs: vi.fn(async () => ({
    forEach: (callback) => {
      firestoreState.docs.forEach((entry) => {
        callback({
          id: entry.id,
          data: () => entry.data
        });
      });
    }
  }))
}));

const {
  buildChildIdentityKey,
  buildStableNonNik,
  findCkgVisitByIdentityKeyInYear,
  findCkgVisitInYear,
  getVisitYear
} = await import('./ckgValidation');

describe('ckgValidation', () => {
  it('builds stable identity keys for patients without NIK', () => {
    expect(buildChildIdentityKey({
      patientName: 'Budi Anak',
      birthDate: '2020-01-01',
      waliNik: '7312000000000001'
    })).toBe('child:budi-anak:2020-01-01:7312000000000001');

    expect(buildStableNonNik({
      patientName: 'Budi Anak',
      birthDate: '2020-01-01',
      waliNik: '7312000000000001'
    })).toBe('NONIK-7312000000000001-2020-01-01-budi-anak');
  });

  it('reads visit year from tanggal_kunjungan string', () => {
    expect(getVisitYear({ tanggal_kunjungan: '2026-05-22' })).toBe(2026);
  });

  it('finds duplicate CKG visit in the same year by NIK', async () => {
    firestoreState.docs = [
      { id: 'old', data: { patientNIK: '7312000000000001', tanggal_kunjungan: '2025-01-01' } },
      { id: 'same-year', data: { patientNIK: '7312000000000001', tanggal_kunjungan: '2026-03-01' } }
    ];

    const duplicate = await findCkgVisitInYear({}, '7312000000000001', { year: 2026 });
    expect(duplicate.id).toBe('same-year');
  });

  it('skips NONIK duplicate search by generated patientNIK', async () => {
    firestoreState.docs = [
      { id: 'same-year', data: { patientNIK: 'NONIK-1', tanggal_kunjungan: '2026-03-01' } }
    ];

    await expect(findCkgVisitInYear({}, 'NONIK-1', { year: 2026 })).resolves.toBeNull();
  });

  it('finds duplicate CKG visit by stable identity key', async () => {
    firestoreState.docs = [
      {
        id: 'child-visit',
        data: {
          patient_identity_key: 'child:budi:2020-01-01:7312000000000001',
          tanggal_kunjungan: '2026-03-01'
        }
      }
    ];

    const duplicate = await findCkgVisitByIdentityKeyInYear(
      {},
      'child:budi:2020-01-01:7312000000000001',
      { year: 2026 }
    );

    expect(duplicate.id).toBe('child-visit');
  });
});
