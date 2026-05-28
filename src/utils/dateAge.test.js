import { describe, expect, it } from 'vitest';
import { calculateAge, isValidIsoDate } from './dateAge';

const referenceDate = new Date(2026, 4, 22);

describe('dateAge', () => {
  it('detects bayi', () => {
    expect(calculateAge('2026-01-22', referenceDate).kategori).toBe('Bayi');
  });

  it('detects balita', () => {
    expect(calculateAge('2023-05-22', referenceDate).kategori).toBe('Balita');
  });

  it('detects anak', () => {
    expect(calculateAge('2016-05-22', referenceDate).kategori).toBe('Anak');
  });

  it('detects dewasa', () => {
    expect(calculateAge('1996-05-22', referenceDate).kategori).toBe('Dewasa');
  });

  it('detects lansia', () => {
    expect(calculateAge('1960-05-22', referenceDate).kategori).toBe('Lansia');
  });

  it('rejects impossible dates', () => {
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(calculateAge('2026-02-30', referenceDate).kategori).toBe('-');
  });
});
