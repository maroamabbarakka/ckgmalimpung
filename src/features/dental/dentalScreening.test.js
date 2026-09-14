import { describe, expect, it } from 'vitest';
import {
  DENTAL_STATUS,
  calculateDentalScreeningSummary,
  getDentalScreeningStatus
} from './dentalScreening';

describe('getDentalScreeningStatus', () => {
  it('recognizes a completed Door-to-Door adult screening', () => {
    const visit = {
      kategori_usia_satusehat: 'Dewasa',
      visit_source: 'door_to_door',
      pos2: { skrining_gigi: { goyang: 'Tidak', lubang: 'Tidak', hilang: 'Tidak', periodontal: 'Tidak' } }
    };
    expect(getDentalScreeningStatus(visit).status).toBe(DENTAL_STATUS.EXAMINED);
  });

  it('recognizes a completed normal Pos 3 screening from its question map', () => {
    const visit = {
      kategori_usia_satusehat: 'SD',
      pos3: { SKL_SD_070: 'Tidak', SKL_SD_079: 'Baik' },
      pos3_question_map: {
        SKL_SD_070: 'Pemeriksaan karies gigi',
        SKL_SD_079: 'Hasil Pemeriksaan Gigi'
      }
    };
    expect(getDentalScreeningStatus(visit).status).toBe(DENTAL_STATUS.EXAMINED);
  });

  it('marks an applicable incomplete screening as not examined', () => {
    const evaluation = getDentalScreeningStatus({
      kategori_usia_satusehat: 'Lansia',
      visit_source: 'door_to_door',
      pos2: { skrining_gigi: { goyang: 'Tidak', lubang: '' } }
    });
    expect(evaluation).toMatchObject({ status: DENTAL_STATUS.NOT_EXAMINED, answered: 1, expected: 4 });
  });

  it('treats zero caries as a valid Balita answer', () => {
    expect(getDentalScreeningStatus({
      kategori_usia_satusehat: 'Balita',
      pos2: { skrining_gigi: { karies: 0 } }
    }).status).toBe(DENTAL_STATUS.EXAMINED);
  });

  it('marks Bayi as not applicable', () => {
    expect(getDentalScreeningStatus({ kategori_usia_satusehat: 'Bayi' }).status)
      .toBe(DENTAL_STATUS.NOT_APPLICABLE);
  });

  it('does not infer examination completeness from a final queue status', () => {
    expect(getDentalScreeningStatus({
      kategori_usia_satusehat: 'Dewasa',
      status_antrian: 'Selesai'
    }).status).toBe(DENTAL_STATUS.LEGACY_REVIEW);
  });

  it('does not crash on an unknown legacy record', () => {
    expect(getDentalScreeningStatus({ status_antrian: 'Selesai' }).status)
      .toBe(DENTAL_STATUS.LEGACY_REVIEW);
  });

  it('treats explicit unexamined answers as incomplete', () => {
    const visit = {
      kategori_usia_satusehat: 'SMP',
      pos3: { A: 'Belum diperiksa' },
      pos3_question_map: { A: 'Hasil pemeriksaan gigi' }
    };
    expect(getDentalScreeningStatus(visit).status).toBe(DENTAL_STATUS.NOT_EXAMINED);
  });
});

describe('calculateDentalScreeningSummary', () => {
  it('keeps the four states separate and exposes only repair candidates', () => {
    const summary = calculateDentalScreeningSummary([
      { id: 'done', kategori_usia_satusehat: 'Balita', pos2: { skrining_gigi: { karies: '0' } } },
      { id: 'missing', kategori_usia_satusehat: 'Dewasa', status_antrian: 'Pos 2' },
      { id: 'na', kategori_usia_satusehat: 'Bayi' },
      { id: 'legacy', kategori_usia_satusehat: 'Dewasa', status_antrian: 'Selesai' }
    ]);
    expect(summary).toMatchObject({ examined: 1, notExamined: 1, notApplicable: 1, legacyReview: 1, needsAttention: 2 });
    expect(summary.rows.map(({ visit }) => visit.id)).toEqual(['missing', 'legacy']);
  });
});
