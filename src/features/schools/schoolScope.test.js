import { describe, it, expect } from 'vitest';
import {
  CKG_TARGET_SCHOOLS_SCOPE,
  getCkgTargetSchools,
  isSchoolCompatibleWithAgeCategory,
  visitMatchesSchool
} from './schoolScope';

describe('schoolScope', () => {
  it('harus mendefinisikan tepat 16 sekolah target pada scope resmi 3 wilayah', () => {
    expect(CKG_TARGET_SCHOOLS_SCOPE).toHaveLength(16);
    const npsnSet = new Set(CKG_TARGET_SCHOOLS_SCOPE.map((s) => s.npsn));
    expect(npsnSet.size).toBe(16);
  });

  it('getCkgTargetSchools hanya mengembalikan 16 target dan tidak memasukkan out-of-scope', () => {
    const rawSchools = [
      { id: 'doc1', npsn: '40304322', name: 'UPT SD NEGERI 121 PINRANG' },
      { id: 'doc2', npsn: '40305298', name: 'UPT SD NEGERI 218 PINRANG' }, // Out of scope (Sipatuo)
      { id: 'doc3', npsn: '69886048', name: 'RA DDI DARABATU' } // Out of scope (Benteng)
    ];

    const scoped = getCkgTargetSchools(rawSchools);
    // Harus mengembalikan 16 target resmi
    expect(scoped).toHaveLength(16);
    const npsns = scoped.map((s) => s.npsn);
    expect(npsns).toContain('40304322');
    expect(npsns).not.toContain('40305298');
    expect(npsns).not.toContain('69886048');
  });

  it('getCkgTargetSchools menduplikasi dokumen ber-NPSN ganda ke aliasIds tanpa menghapus data', () => {
    const rawSchools = [
      { id: 'doc_old', npsn: '40304322', name: 'SDN 121 Pinrang', lastUpdated: '2025-01-01' },
      { id: 'doc_canonical', npsn: '40304322', name: 'UPT SD NEGERI 121 PINRANG', lastUpdated: '2026-02-01' }
    ];

    const scoped = getCkgTargetSchools(rawSchools);
    const sdn121 = scoped.find((s) => s.npsn === '40304322');
    expect(sdn121).toBeDefined();
    expect(sdn121.id).toBe('doc_canonical');
    expect(sdn121.aliasIds).toContain('doc_old');
    expect(sdn121.aliasIds).toContain('doc_canonical');
  });

  it('visitMatchesSchool mengenali exact schoolId dan aliasIds', () => {
    const school = {
      id: 'canonical_121',
      npsn: '40304322',
      name: 'UPT SD NEGERI 121 PINRANG',
      aliasIds: ['old_doc_121', 'canonical_121']
    };

    // 1. Exact match
    expect(visitMatchesSchool({ schoolId: 'canonical_121' }, school)).toBe(true);

    // 2. Alias match
    expect(visitMatchesSchool({ schoolId: 'old_doc_121' }, school)).toBe(true);

    // 3. Pasien snapshot schoolId
    expect(visitMatchesSchool({ pasien_snapshot: { schoolId: 'old_doc_121' } }, school)).toBe(true);

    // 4. Beda schoolId
    expect(visitMatchesSchool({ schoolId: 'another_school' }, school)).toBe(false);
  });

  it('visitMatchesSchool mendukung fallback legacy name bila belum ada schoolId', () => {
    const school = {
      id: 'canonical_121',
      npsn: '40304322',
      name: 'UPT SD NEGERI 121 PINRANG'
    };

    const legacyVisit = {
      klaster: 'Klaster Anak/Siswa',
      schoolNameSnapshot: 'UPT SD NEGERI 121 PINRANG'
    };

    expect(visitMatchesSchool(legacyVisit, school)).toBe(true);
  });

  it('isSchoolCompatibleWithAgeCategory memfilter jenjang dengan tepat untuk Pos 1', () => {
    // SD kompatibel dengan SD dan MI
    expect(isSchoolCompatibleWithAgeCategory('SD', 'SD')).toBe(true);
    expect(isSchoolCompatibleWithAgeCategory('MI', 'SD')).toBe(true);
    expect(isSchoolCompatibleWithAgeCategory('SMP', 'SD')).toBe(false);

    // SMP kompatibel dengan SMP dan MTs
    expect(isSchoolCompatibleWithAgeCategory('SMP', 'SMP')).toBe(true);
    expect(isSchoolCompatibleWithAgeCategory('MTs', 'SMP')).toBe(true);
    expect(isSchoolCompatibleWithAgeCategory('SD', 'SMP')).toBe(false);

    // SMA kompatibel dengan SMA, SMK, MA
    expect(isSchoolCompatibleWithAgeCategory('SMA', 'SMA')).toBe(true);
    expect(isSchoolCompatibleWithAgeCategory('SMK', 'SMA')).toBe(true);
    expect(isSchoolCompatibleWithAgeCategory('MA', 'SMA')).toBe(true);
    expect(isSchoolCompatibleWithAgeCategory('SMP', 'SMA')).toBe(false);
  });
});
