import { describe, expect, it } from 'vitest';
import { classifyConfidence, normalizeOcrResult, toLegacyOcrFormData } from './ocrPipeline';

describe('ocrPipeline', () => {
  it('classifies confidence levels', () => {
    expect(classifyConfidence(0.9)).toBe('HIGH');
    expect(classifyConfidence(70)).toBe('MEDIUM');
    expect(classifyConfidence(40)).toBe('LOW');
  });

  it('normalizes OCR result and warnings', () => {
    const result = normalizeOcrResult({
      document_type: 'Kartu Keluarga',
      nik: '123',
      nama: 'AI',
      confidence: 0.4,
      candidates: [{ nik: '7315123456789012', nama: 'NAMA ANAK' }],
    }, 'test');

    expect(result.documentType).toBe('KK');
    expect(result.confidence).toBe(40);
    expect(result.candidates[0].nik).toBe('7315123456789012');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('adapts normalized OCR result for existing form components', () => {
    const result = toLegacyOcrFormData({
      documentType: 'KTP',
      tanggalLahir: '1990-01-02',
      jenisKelamin: 'L',
      confidence: 88,
      candidates: [{ tanggalLahir: '2010-02-03', jenisKelamin: 'P', confidence: 70 }],
    });

    expect(result.document_type).toBe('KTP');
    expect(result.tgl_lahir).toBe('1990-01-02');
    expect(result.j_kelamin).toBe('L');
    expect(result.confidence).toBe(0.88);
    expect(result.candidates[0].tgl_lahir).toBe('2010-02-03');
  });
});
