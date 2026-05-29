import { resolveWilayahKerja } from './wilayahMalimpung.js';

const KTP_LABELS = [
  'PROVINSI', 'KABUPATEN', 'KOTA', 'NIK', 'NAMA', 'TEMPAT', 'TGL', 'LAHIR',
  'JENIS', 'KELAMIN', 'ALAMAT', 'RT', 'RW', 'KEL', 'DESA', 'KECAMATAN',
  'AGAMA', 'STATUS', 'PERKAWINAN', 'PEKERJAAN', 'KEWARGANEGARAAN', 'BERLAKU'
];

/**
 * Koreksi dan ambil angka saja untuk NIK
 */
export function cleanNik(nik) {
  if (!nik) return '';
  return String(nik)
    .replace(/[OoQD]/g, '0')
    .replace(/[IilL|]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Aa]/g, '4')
    .replace(/[Ss]/g, '5')
    .replace(/[Gg]/g, '6')
    .replace(/[Bb]/g, '8')
    .replace(/\D/g, ''); // Ambil hanya angka
}

/**
 * Koreksi Nama: hilangkan gelar akademis/medis, ubah ke kapital, buang karakter aneh
 */
export function cleanNama(nama) {
  if (!nama) return '';
  return String(nama)
    .replace(/[0-9]/g, '') // Hapus angka
    .replace(/[^a-zA-Z\s.,']/g, '') // Hanya huruf dan tanda baca dasar
    .replace(/\b(?:DRG|DR|SKEP|AMDBEK|SH|SE|MM|SPD|ST|NAMA|AMA|NMA|NAM)\b/gi, '') // Hapus gelar umum & label 'nama'
    .replace(/\s{2,}/g, ' ') // Hapus spasi ganda
    .trim()
    .toUpperCase();
}

/**
 * Validasi apakah format tanggal YYYY-MM-DD valid
 */
function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  if (year < 1850 || year > new Date().getFullYear() + 2) return false;
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day;
}

/**
 * Mengubah format tanggal berantakan menjadi YYYY-MM-DD
 */
export function parseDateToIso(rawDate) {
  if (!rawDate) return '';
  
  // Jika sudah berformat YYYY-MM-DD, cek validitasnya
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate) && isValidDate(rawDate)) {
    return rawDate;
  }

  const clean = String(rawDate).replace(/[^0-9/-]/g, '').trim();
  
  // Deteksi DD-MM-YYYY atau DD/MM/YYYY
  const matchDmy = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (matchDmy) {
    const day = matchDmy[1].padStart(2, '0');
    const month = matchDmy[2].padStart(2, '0');
    const year = matchDmy[3];
    const iso = `${year}-${month}-${day}`;
    if (isValidDate(iso)) return iso;
  }

  // Deteksi YYYY-MM-DD yang tidak teratur
  const matchYmd = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (matchYmd) {
    const year = matchYmd[1];
    const month = matchYmd[2].padStart(2, '0');
    const day = matchYmd[3].padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    if (isValidDate(iso)) return iso;
  }

  return '';
}

/**
 * Normalisasi Jenis Kelamin
 */
export function normalizeGender(gender) {
  if (!gender) return '';
  const val = String(gender).toUpperCase().trim();
  if (['L', 'LK', 'LAKI', 'LAKI-LAKI', 'PRIA', 'MALE'].some(x => val.includes(x))) {
    return 'LAKI-LAKI';
  }
  if (['P', 'PR', 'PEREMPUAN', 'WANITA', 'FEMALE'].some(x => val.includes(x))) {
    return 'PEREMPUAN';
  }
  return '';
}

/**
 * Normalisasi Alamat Dusun
 */
export function normalizeAlamatDusun(alamat) {
  if (!alamat) return '';
  
  let val = String(alamat).toUpperCase().replace(/\s+/g, ' ').trim();
  const matchDusun = val.match(/DUSUN\s+([A-Z0-9\s]+)/);
  if (matchDusun) {
    return `DUSUN ${matchDusun[1].trim()}`;
  }
  
  return val;
}

// ==================== TESSERACT RAW TEXT PARSER (LOKAL) ====================

const normalizeText = (value) => String(value || '')
  .replace(/\r/g, '\n')
  .replace(/[|]/g, 'I')
  .replace(/[;=]/g, ':')
  .toUpperCase();

const scoreNik = (nik) => {
  if (!/^\d{16}$/.test(nik)) return -10;
  let score = 0;
  const province = parseInt(nik.slice(0, 2), 10);
  const day = parseInt(nik.slice(6, 8), 10);
  const month = parseInt(nik.slice(8, 10), 10);
  if (province >= 11 && province <= 94) score += 2;
  if ((day >= 1 && day <= 31) || (day >= 41 && day <= 71)) score += 2;
  if (month >= 1 && month <= 12) score += 2;
  if (nik.startsWith('73')) score += 1;
  return score;
};

const findBestNik = (text) => {
  const compact = normalizeText(text).replace(/\s/g, '');
  const matches = compact.match(/[0-9OoQDIilL|ZzAaSsGgBb]{16,24}/g) || [];
  return matches
    .map(candidate => cleanNik(candidate).slice(0, 16))
    .filter(candidate => candidate.length === 16)
    .sort((a, b) => scoreNik(b) - scoreNik(a))[0] || '';
};

const findDate = (text) => {
  const normalized = normalizeText(text);
  const dateMatch = normalized.match(/\b([0-3]?\d)[\s/.-]([01]?\d)[\s/.-]((?:19|20)?\d{2})\b/);
  if (!dateMatch) return '';

  const day = dateMatch[1].padStart(2, '0');
  const month = dateMatch[2].padStart(2, '0');
  let year = dateMatch[3];
  if (year.length === 2) year = `${parseInt(year, 10) > 30 ? '19' : '20'}${year}`;

  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  if (d < 1 || d > 31 || m < 1 || m > 12) return '';
  return `${year}-${month}-${day}`;
};

const findName = (text) => {
  const lines = normalizeText(text)
    .split('\n')
    .map(line => line.replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/(^|\s)(NAMA|NMA|NAM|AMA)(\s|:)/.test(line)) continue;
    const inline = cleanNama(line.replace(/^.*?(?:NAMA|NMA|NAM|AMA)\s*:?/, ''));
    if (inline.length >= 3 && !KTP_LABELS.some(label => inline === label)) return inline;

    const next = cleanNama(lines[i + 1] || '');
    if (next.length >= 3 && !KTP_LABELS.some(label => next.includes(label))) return next;
  }

  return '';
};

const detectGender = (text) => {
  const compact = normalizeText(text).replace(/\s/g, '');
  if (/LAKI.?LAKI|LAKILAKI|LKI|LKILKI/.test(compact)) return 'LAKI-LAKI';
  if (/PEREMPUAN|PEREMP|PRMP|PR/.test(compact)) return 'PEREMPUAN';
  return '';
};

const detectDesa = (text) => {
  const normalized = normalizeText(text);
  if (normalized.includes('MALIMPUNG')) return 'MALIMPUNG';
  if (normalized.includes('PADANG') && normalized.includes('LOANG')) return 'PADANG LOANG';
  if (normalized.includes('MACCIRINNA') || normalized.includes('MACCIRINA')) return 'MACCIRINNA';
  return '';
};

const detectDocumentType = (text) => {
  const compact = normalizeText(text).replace(/\s/g, '');
  if (/KARTUKELUARGA|NOKK|NO\.?KK/.test(compact)) return 'KK';
  if (/BPJS|JKN|KIS|KARTUINDONESIASEHAT|ASKES|JAMINANKESEHATAN/.test(compact)) return 'BPJS';
  if (/REPUBLIKINDONESIA|NIK|PROVINSI|KABUPATEN|TEMPAT\/TGL/.test(compact)) return 'KTP';
  return 'LAINNYA';
};

const detectAlamatDusun = (text) => {
  const lines = normalizeText(text).split('\n');
  for (const line of lines) {
    if (line.includes('ALAMAT') || line.includes('DUSUN')) {
      const cleaned = line.replace(/^.*?(?:ALAMAT|DUSUN)\s*:?/, '').trim();
      if (cleaned.length > 5) return cleaned;
    }
  }
  return '';
};

/**
 * Parsing teks mentah dari Tesseract.js menjadi format mentah sebelum dinormalisasi
 */
export function parseTesseractText(text, confidenceScore = 0) {
  const documentType = detectDocumentType(text);
  
  return {
    documentType,
    nik: findBestNik(text),
    nama: findName(text),
    jenisKelamin: detectGender(text),
    tanggalLahir: findDate(text),
    alamatDusun: detectAlamatDusun(text),
    desaKelurahan: detectDesa(text),
    confidence: confidenceScore,
    warnings: []
  };
}

// ==================== MAIN NORMALIZER ====================

/**
 * Normalisasi hasil pemindaian dokumen dari raw engine ke format data terpadu CKG
 * @param {object} raw Data mentah hasil OCR (dari Gemini maupun Tesseract)
 * @param {string} engine Mesin OCR yang digunakan ('gemini' | 'tesseract')
 * @returns {object} Hasil normalisasi terpadu
 */
export function normalizeSmartScanResult(raw, engine = 'gemini') {
  const warnings = [];

  // 1. NIK
  let nikRaw = raw.nik || '';
  let nik = cleanNik(nikRaw);
  if (nik.length > 0 && nik.length !== 16) {
    warnings.push('NIK tidak valid (harus 16 digit).');
    nik = '';
  } else if (!nik) {
    warnings.push('NIK tidak terbaca.');
  }

  // 2. Nama
  let nama = cleanNama(raw.nama || raw.name || '');
  if (!nama || nama.length < 3) {
    warnings.push('Nama tidak terbaca dengan jelas (min. 3 karakter).');
    nama = nama || '';
  }

  // 3. Jenis Kelamin
  let jenisKelamin = normalizeGender(raw.jenisKelamin || raw.jenis_kelamin || raw.j_kelamin || raw.gender || '');
  if (!jenisKelamin) {
    warnings.push('Jenis kelamin tidak terbaca.');
  }

  // 4. Tanggal Lahir
  let tanggalLahir = parseDateToIso(raw.tanggalLahir || raw.tanggal_lahir || raw.tgl_lahir || raw.birthDate || '');
  if (!tanggalLahir) {
    warnings.push('Tanggal lahir tidak valid atau tidak terbaca.');
    tanggalLahir = '';
  }

  // 5. Alamat/Dusun
  let alamatDusun = normalizeAlamatDusun(raw.alamatDusun || raw.alamat_dusun || raw.alamat || raw.dusun || '');

  // 6. Desa/Kelurahan & Status Wilayah
  const rawDesa = raw.desaKelurahan || raw.desa_kelurahan || raw.desa || raw.kelurahan || '';
  const resolvedWilayah = resolveWilayahKerja(rawDesa);
  
  let desaKelurahan = resolvedWilayah.desaKelurahan;
  let statusWilayah = resolvedWilayah.statusWilayah;
  
  if (statusWilayah === 'perlu_konfirmasi') {
    warnings.push('Desa/Kelurahan tidak terbaca. Harap konfirmasi manual.');
  } else if (statusWilayah === 'luar_wilayah') {
    warnings.push('Desa/Kelurahan di luar wilayah kerja Puskesmas Malimpung.');
  }

  // Gabungkan warnings dari raw jika ada
  if (raw.warnings && Array.isArray(raw.warnings)) {
    raw.warnings.forEach(w => {
      if (w && !warnings.includes(w)) warnings.push(w);
    });
  }

  // Hitung confidence score default jika tidak disuplai
  let confidence = Number(raw.confidence || 0.0);
  if (confidence > 1.0) {
    confidence = confidence / 100.0;
  }

  return {
    engine,
    documentType: raw.documentType || raw.document_type || 'TIDAK_TERBACA',
    confidence: parseFloat(confidence.toFixed(2)),
    data: {
      nik,
      nama,
      jenisKelamin,
      tanggalLahir,
      alamatDusun,
      desaKelurahan,
      statusWilayah
    },
    warnings
  };
}
