import { describe, it, expect } from 'vitest';
import {
  getVisitBloodPressure,
  getVisitGlucose,
  getVisitBodyMassIndex,
  isHipertensiRisk,
  isDiabetesRisk,
  isObesitasRisk,
  isParuRisk,
  isMentalRisk,
  isInderaRisk,
  getClinicalRiskBadges
} from './clinicalRiskEvaluator';

describe('clinicalRiskEvaluator', () => {
  it('mengevaluasi risiko hipertensi dengan benar', () => {
    expect(isHipertensiRisk({ pos2: { td: '140/90' } })).toBe(true);
    expect(isHipertensiRisk({ pos2: { td: '130/85' } })).toBe(false);
    expect(isHipertensiRisk({ pos2: { sistolik: '150', diastolik: '95' } })).toBe(true);
  });

  it('mengevaluasi risiko diabetes dengan benar', () => {
    expect(isDiabetesRisk({ pos2: { gds: '210' } })).toBe(true);
    expect(isDiabetesRisk({ pos4: { gdp: '130' } })).toBe(true);
    expect(isDiabetesRisk({ pos2: { gds: '110' } })).toBe(false);
  });

  it('mengevaluasi risiko obesitas dengan benar dan mengabaikan bayi/balita', () => {
    expect(isObesitasRisk({ kategori_usia_satusehat: 'Dewasa', pos2: { bb: '80', tb: '160' } })).toBe(true);
    expect(isObesitasRisk({ kategori_usia_satusehat: 'Balita', pos2: { bb: '80', tb: '160' } })).toBe(false);
  });

  it('mengevaluasi risiko paru dari pos 4 dan pos 5 (termasuk dynamic form)', () => {
    // Pos 4 legacy
    expect(isParuRisk({ pos4: { ppok: { nafas_pendek: 'Ya' } } })).toBe(true);
    // Pos 5 legacy
    expect(isParuRisk({ pos5: { resiko_tb: { batuk: 'Ya' } } })).toBe(true);
    // Pos 5 dynamic map
    expect(isParuRisk({
      pos5: { Q_BATUK: 'Ya' },
      pos5_question_map: { Q_BATUK: 'Apakah Anda mengalami batuk lebih dari 2 minggu?' }
    })).toBe(true);
    expect(isParuRisk({ pos5: { resiko_tb: { batuk: 'Tidak' } } })).toBe(false);
  });

  it('mengevaluasi risiko mental dari pos 3 dan pos 6 (termasuk SRQ, SDQ, Skilas)', () => {
    // Pos 6 SRQ
    expect(isMentalRisk({ pos6: { jiwa_srq20: { p1: 'Ya' } } })).toBe(true);
    // Pos 6 SDQ
    expect(isMentalRisk({ pos6: { jiwa_sdq: { p1: 'Ya' } } })).toBe(true);
    // Pos 3 Skilas
    expect(isMentalRisk({ pos3: { skilas: { dep_minat_turun: 'Ya' } } })).toBe(true);
    // Normal
    expect(isMentalRisk({ pos6: { jiwa_srq20: { p1: 'Tidak', p2: 'Tdk' } } })).toBe(false);
  });

  it('mengevaluasi risiko indera dari pos 3', () => {
    expect(isInderaRisk({ pos3: { mata: { visus: '6/18' } } })).toBe(true);
    expect(isInderaRisk({ pos3: { mata: { visus: '6/6' } } })).toBe(false);
    expect(isInderaRisk({ pos3: { telinga: { gg_pendengaran: 'Ya' } } })).toBe(true);
  });

  it('menghasilkan badge temuan klinis yang informatif', () => {
    const paruVisit = { pos5: { resiko_tb: { batuk: 'Ya' }, merokok: { batuk_lama: 'Ya' } } };
    const badgesParu = getClinicalRiskBadges(paruVisit, 'paru_ppok');
    expect(badgesParu.length).toBeGreaterThan(0);
    expect(badgesParu.some(b => b.includes('Batuk') || b.includes('Merokok'))).toBe(true);

    const mentalVisit = { pos6: { jiwa_srq20: { p1: 'Ya' } } };
    const badgesMental = getClinicalRiskBadges(mentalVisit, 'mental');
    expect(badgesMental.length).toBeGreaterThan(0);
    expect(badgesMental.some(b => b.includes('SRQ-20'))).toBe(true);
  });
});
