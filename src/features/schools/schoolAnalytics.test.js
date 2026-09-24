import { describe, it, expect } from 'vitest';
import {
  getLatestStudentData,
  buildSchoolRowAnalytics,
  calculateAggregateSummary
} from './schoolAnalytics';

describe('schoolAnalytics', () => {
  it('harus mempertahankan nilai 0 sebagai data valid (bukan dianggap null atau kosong)', () => {
    const schoolWithZero = {
      id: 'sch_1',
      studentSnapshots: {
        '2026/2027': {
          totalStudents: 0,
          source: 'Kemendikdasmen Residu'
        }
      }
    };

    const data = getLatestStudentData(schoolWithZero);
    expect(data.count).toBe(0);
    expect(data.source).toBe('Kemendikdasmen Residu');
  });

  it('null/undefined atau error tidak dianggap 0', () => {
    const schoolWithoutData = {
      id: 'sch_empty',
      studentSnapshots: {}
    };

    const data = getLatestStudentData(schoolWithoutData);
    expect(data.count).toBeNull();
  });

  it('107 anak diperiksa dari 100 murid menghasilkan cakupan 107.0% tanpa batasan Math.min(100)', () => {
    const school = {
      id: 'sch_100',
      totalStudents: 100
    };

    // Buat 107 anak unik yang selesai periksa
    const visits = Array.from({ length: 107 }, (_, i) => ({
      id: `visit_${i}`,
      patient_identity_key: `patient_key_${i}`,
      schoolId: 'sch_100',
      status_antrian: 'Selesai'
    }));

    const result = buildSchoolRowAnalytics(school, visits);
    expect(result.examinedCount).toBe(107);
    expect(result.coveragePct).toBe(107);
    expect(result.coverageDisplay).toBe('107.0%');
    // Visual progress width dibatasi max 100 agar UI layout tidak rusak
    expect(result.visualWidth).toBe(100);
    expect(result.isOverTarget).toBe(true);
  });

  it('denominator 0 menghasilkan cakupan null dan tampilan "—"', () => {
    const school = {
      id: 'sch_zero',
      totalStudents: 0
    };

    const visits = [
      { id: 'v1', patient_identity_key: 'p1', schoolId: 'sch_zero', status_antrian: 'Selesai' }
    ];

    const result = buildSchoolRowAnalytics(school, visits);
    expect(result.examinedCount).toBe(1);
    expect(result.studentCount).toBe(0);
    expect(result.coveragePct).toBeNull();
    expect(result.coverageDisplay).toBe('—');
  });

  it('anak unik tidak dihitung ganda jika memiliki multiple visits', () => {
    const school = {
      id: 'sch_unique',
      totalStudents: 50
    };

    // 1 anak yang sama datang 3 kali
    const visits = [
      { id: 'v1', patient_identity_key: 'NIK_7315001', schoolId: 'sch_unique', status_antrian: 'Selesai' },
      { id: 'v2', patient_identity_key: 'NIK_7315001', schoolId: 'sch_unique', status_antrian: 'Selesai' },
      { id: 'v3', patientNIK: '7315001', schoolId: 'sch_unique', status_antrian: 'Selesai' },
      // 1 anak berbeda yang belum selesai
      { id: 'v4', patient_identity_key: 'NIK_7315002', schoolId: 'sch_unique', status_antrian: 'Pos 1' }
    ];

    const result = buildSchoolRowAnalytics(school, visits);
    // Hanya 1 anak unik yang statusnya selesai
    expect(result.examinedCount).toBe(1);
    expect(result.coveragePct).toBe(2);
    expect(result.coverageDisplay).toBe('2.0%');
  });

  it('calculateAggregateSummary menghitung agregasi total numerator / total denominator', () => {
    const rows = [
      { examinedCount: 80, studentCount: 100 },
      { examinedCount: 40, studentCount: 100 },
      { examinedCount: 5, studentCount: 0 } // Denominator 0 tidak masuk denominator cakupan terukur
    ];

    const summary = calculateAggregateSummary(rows);
    expect(summary.totalExamined).toBe(125);
    expect(summary.totalStudents).toBe(200);
    expect(summary.eligibleDenominatorTotal).toBe(200);
    expect(summary.eligibleExaminedTotal).toBe(120);
    // (120 / 200) * 100 = 60.0%
    expect(summary.aggregateCoveragePct).toBe(60);
    expect(summary.aggregateCoverageDisplay).toBe('60.0%');
  });
});
