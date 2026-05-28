import { describe, expect, it } from 'vitest';
import { calculateDataQualitySummary, evaluateVisitDataQuality } from './dataQualityRules';

describe('dataQualityRules', () => {
  it('detects missing and invalid identity fields with patient snapshot fallback', () => {
    const result = evaluateVisitDataQuality({
      id: 'visit-1',
      patientNIK: '123',
      pasien_snapshot: {
        tgl_lahir: '2026-02-30',
        j_kelamin: 'X'
      },
      status: 'REGISTERED'
    });

    expect(result.issues.map((issue) => issue.code)).toEqual([
      'INVALID_NIK',
      'INVALID_BIRTH_DATE',
      'INVALID_GENDER',
      'MISSING_VILLAGE'
    ]);
  });

  it('accepts generated NONIK identities for children without patient NIK', () => {
    const result = evaluateVisitDataQuality({
      patientNIK: 'NONIK-7312000000000001-2026-01-01-anak',
      pasien_snapshot: {
        tgl_lahir: '2026-01-01',
        j_kelamin: 'P',
        desa: 'Desa Malimpung'
      },
      status: 'REGISTERED'
    });

    expect(result.isComplete).toBe(true);
  });

  it('summarizes duplicate identity in the same visit year', () => {
    const summary = calculateDataQualitySummary([
      {
        id: 'a',
        patientNIK: '7312000000000001',
        tanggal_kunjungan: '2026-01-01',
        pasien_snapshot: { tgl_lahir: '1990-01-01', j_kelamin: 'L', desa: 'Desa Malimpung' },
        status: 'FINALIZED',
        pos7: { validasiDokter: true }
      },
      {
        id: 'b',
        patientNIK: '7312000000000001',
        tanggal_kunjungan: '2026-05-01',
        pasien_snapshot: { tgl_lahir: '1990-01-01', j_kelamin: 'L', desa: 'Desa Malimpung' },
        status: 'FINALIZED',
        pos7: { validasiDokter: true }
      }
    ]);

    expect(summary.duplicateIdentityYear).toBe(2);
    expect(summary.issueRows).toHaveLength(0);
  });
});
