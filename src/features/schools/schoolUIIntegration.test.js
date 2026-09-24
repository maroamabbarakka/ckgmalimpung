import { describe, it, expect } from 'vitest';
import {
  getCkgTargetSchools,
  isSchoolCompatibleWithAgeCategory
} from './schoolScope';
import { buildSchoolRowAnalytics, calculateAggregateSummary } from './schoolAnalytics';

describe('Sarana Binaan & Pos 1 UI Integration Logic', () => {
  const sampleFirestoreSchools = [
    {
      id: 'doc_121',
      npsn: '40304322',
      name: 'UPT SD NEGERI 121 PINRANG',
      level: 'SD',
      desa: 'Desa Malimpung',
      studentSnapshots: {
        '2026/2027': { totalStudents: 153, source: 'Kemendikdasmen Residu' }
      }
    },
    {
      id: 'doc_121_dup',
      npsn: '40304322',
      name: 'SDN 121 Pinrang (Duplikat Lama)',
      level: 'SD',
      desa: 'Desa Malimpung'
    },
    {
      id: 'doc_ra_palita',
      npsn: '69886044',
      name: 'RA DDI AL-MUNAWARAH PALITA',
      level: 'TK/PAUD',
      desa: 'Desa Padangloang',
      studentSnapshots: {
        '2026/2027': { totalStudents: 0, source: 'Kemendikdasmen Residu' }
      }
    },
    {
      id: 'doc_smp4',
      npsn: '40305095',
      name: 'UPT SMP NEGERI 4 PATAMPANUA',
      level: 'SMP',
      desa: 'Desa Malimpung',
      totalStudents: 100
    },
    {
      id: 'doc_outofscope',
      npsn: '40305298',
      name: 'UPT SD NEGERI 218 PINRANG',
      level: 'SD',
      desa: 'Sipatuo'
    }
  ];

  it('memastikan 16 target sekolah terbentuk dan sekolah out-of-scope disaring dari tampilan sasaran', () => {
    const targetSchools = getCkgTargetSchools(sampleFirestoreSchools);
    expect(targetSchools).toHaveLength(16);
    const npsns = targetSchools.map((s) => s.npsn);
    expect(npsns).toContain('40304322'); // SDN 121
    expect(npsns).toContain('69886044'); // RA Palita
    expect(npsns).not.toContain('40305298'); // SDN 218 Sipatuo tidak masuk scope
  });

  it('memastikan duplikasi dokumen lama disatukan ke aliasIds tanpa menghapus data Firestore', () => {
    const targetSchools = getCkgTargetSchools(sampleFirestoreSchools);
    const sdn121 = targetSchools.find((s) => s.npsn === '40304322');
    expect(sdn121).toBeDefined();
    expect(sdn121.aliasIds).toContain('doc_121');
    expect(sdn121.aliasIds).toContain('doc_121_dup');
  });

  it('memastikan sekolah dengan 0 siswa menampilkan Siswa: 0 dan Cakupan: —', () => {
    const targetSchools = getCkgTargetSchools(sampleFirestoreSchools);
    const raPalita = targetSchools.find((s) => s.npsn === '69886044');
    
    const visits = [
      { id: 'v1', patient_identity_key: 'nik_111', schoolId: 'doc_ra_palita', status_antrian: 'Selesai' }
    ];

    const row = buildSchoolRowAnalytics(raPalita, visits);
    expect(row.studentCount).toBe(0);
    expect(row.examinedCount).toBe(1);
    expect(row.coveragePct).toBeNull();
    expect(row.coverageDisplay).toBe('—');
  });

  it('memastikan capaian > 100% (misal 107 anak dari 100 siswa) tidak dipotong Math.min(100) pada teks', () => {
    const targetSchools = getCkgTargetSchools(sampleFirestoreSchools);
    const smp4 = targetSchools.find((s) => s.npsn === '40305095');

    // 107 kunjungan anak unik selesai CKG
    const visits = Array.from({ length: 107 }, (_, i) => ({
      id: `v_${i}`,
      patient_identity_key: `nik_smp_${i}`,
      schoolId: 'doc_smp4',
      status_antrian: 'Selesai'
    }));

    const row = buildSchoolRowAnalytics(smp4, visits);
    expect(row.studentCount).toBe(100);
    expect(row.examinedCount).toBe(107);
    expect(row.coveragePct).toBe(107);
    expect(row.coverageDisplay).toBe('107.0%');
    expect(row.visualWidth).toBe(100); // Visual progress bar aman dari overflow layout
    expect(row.isOverTarget).toBe(true);
  });

  it('memastikan agregasi total rasio mengabaikan sekolah dengan denominator 0 dari denominator cakupan', () => {
    const targetSchools = getCkgTargetSchools(sampleFirestoreSchools);
    const rows = targetSchools.map((s) => buildSchoolRowAnalytics(s, []));
    const summary = calculateAggregateSummary(rows);

    expect(summary.totalSchools).toBe(16);
    expect(summary.aggregateCoverageDisplay).toBe('0.0%');
  });

  it('memastikan dropdown Pos 1 menyaring jenjang yang kompatibel dengan kategori usia pasien', () => {
    const targetSchools = getCkgTargetSchools(sampleFirestoreSchools);

    // Kategori SD di Pos 1 -> SD & MI
    const forSD = targetSchools.filter((s) => isSchoolCompatibleWithAgeCategory(s.level, 'SD'));
    expect(forSD.every((s) => ['SD', 'MI'].includes(s.level))).toBe(true);
    expect(forSD.some((s) => s.level === 'SD')).toBe(true);
    expect(forSD.some((s) => s.level === 'MI')).toBe(true);
    expect(forSD.some((s) => s.level === 'SMP')).toBe(false);

    // Kategori SMP di Pos 1 -> SMP & MTs
    const forSMP = targetSchools.filter((s) => isSchoolCompatibleWithAgeCategory(s.level, 'SMP'));
    expect(forSMP.every((s) => ['SMP', 'MTs'].includes(s.level))).toBe(true);
    expect(forSMP.some((s) => s.level === 'SMP')).toBe(true);
    expect(forSMP.some((s) => s.level === 'MTs')).toBe(true);
    expect(forSMP.some((s) => s.level === 'SD')).toBe(false);
  });
});
