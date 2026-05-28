import { runKtpOcr } from '../../utils/ktpOcr';

export const OCR_DOCUMENT_TYPES = {
  KTP: 'KTP',
  KK: 'KK',
  BPJS: 'BPJS',
  UNKNOWN: 'UNKNOWN',
};

export const OCR_CONFIG = {
  backendUrl: import.meta.env?.VITE_OCR_BACKEND_URL || import.meta.env?.VITE_KTP_OCR_BACKEND || '',
  useBackendFirst: true,
  fallbackToTesseract: true,
  maxImageSize: 1600,
};

export function classifyConfidence(score = 0) {
  const normalized = score <= 1 ? score * 100 : score;
  if (normalized >= 85) return 'HIGH';
  if (normalized >= 65) return 'MEDIUM';
  return 'LOW';
}

function normalizeDocumentType(value = '') {
  const text = String(value).toUpperCase();
  if (text.includes('KELUARGA') || text === 'KK') return OCR_DOCUMENT_TYPES.KK;
  if (text.includes('BPJS') || text.includes('KIS') || text.includes('JKN')) return OCR_DOCUMENT_TYPES.BPJS;
  if (text.includes('KTP')) return OCR_DOCUMENT_TYPES.KTP;
  return OCR_DOCUMENT_TYPES.UNKNOWN;
}

export function buildOcrWarnings(result = {}) {
  const warnings = [];
  if (!/^\d{16}$/.test(result.nik || '')) warnings.push('NIK tidak terbaca sebagai 16 digit.');
  if (!result.tanggalLahir) warnings.push('Tanggal lahir belum terbaca jelas.');
  if (!result.nama || result.nama.length < 3) warnings.push('Nama belum terbaca jelas.');
  if (!result.jenisKelamin) warnings.push('Jenis kelamin belum terbaca jelas.');
  if (!result.desa && !result.alamat) warnings.push('Alamat/desa belum terbaca jelas.');
  if (result.documentType === OCR_DOCUMENT_TYPES.UNKNOWN) warnings.push('Jenis dokumen belum dikenali.');
  if (classifyConfidence(result.confidence) === 'LOW') warnings.push('Confidence OCR rendah, wajib periksa manual.');
  return warnings;
}

export function normalizeOcrResult(data = {}, source = 'unknown') {
  const normalized = {
    documentType: normalizeDocumentType(data.documentType || data.document_type),
    nik: data.nik || '',
    noKk: data.noKk || data.kk || '',
    nama: data.nama || '',
    tanggalLahir: data.tanggalLahir || data.tgl_lahir || data.tanggal_lahir || '',
    jenisKelamin: data.jenisKelamin || data.j_kelamin || data.jenis_kelamin || '',
    alamat: data.alamat || '',
    desa: data.desa || '',
    dusun: data.dusun || '',
    confidence: Math.round(Number(data.confidence || 0) * (Number(data.confidence || 0) <= 1 ? 100 : 1)),
    candidates: (data.candidates || []).map((candidate) => ({
      documentType: normalizeDocumentType(candidate.document_type || data.document_type),
      nik: candidate.nik || '',
      noKk: candidate.kk || data.kk || '',
      nama: candidate.nama || '',
      tanggalLahir: candidate.tanggalLahir || candidate.tgl_lahir || '',
      jenisKelamin: candidate.jenisKelamin || candidate.j_kelamin || '',
      desa: candidate.desa || data.desa || '',
      confidence: Math.round(Number(candidate.confidence || data.confidence || 0) * (Number(candidate.confidence || data.confidence || 0) <= 1 ? 100 : 1)),
    })),
    rawText: data.rawText || data.raw_text || '',
    source,
    warnings: [],
  };

  normalized.warnings = buildOcrWarnings(normalized);
  return normalized;
}

export function toLegacyOcrFormData(result = {}) {
  const confidence = Number(result.confidence || 0);
  const legacy = {
    ...result,
    document_type: result.document_type || result.documentType,
    tgl_lahir: result.tgl_lahir || result.tanggalLahir,
    j_kelamin: result.j_kelamin || result.jenisKelamin,
    confidence: confidence > 1 ? confidence / 100 : confidence,
    candidates: (result.candidates || []).map((candidate) => toLegacyOcrFormData({
      ...candidate,
      documentType: candidate.documentType || result.documentType,
      source: candidate.source || result.source,
    })),
  };

  return legacy;
}

export async function runIdentityOcr(file, options = {}) {
  const result = await runKtpOcr(file, {
    ...options,
    backendUrl: options.backendUrl || OCR_CONFIG.backendUrl,
    preferBackend: options.preferBackend ?? OCR_CONFIG.useBackendFirst,
  });

  return {
    success: result.success,
    data: normalizeOcrResult(result.data, result.source),
    source: result.source,
  };
}
