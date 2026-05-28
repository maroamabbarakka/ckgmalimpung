import Tesseract from 'tesseract.js';

const DEFAULT_BACKEND_URL = import.meta.env?.VITE_KTP_OCR_BACKEND || 'http://localhost:8000';

const KTP_LABELS = [
  'PROVINSI', 'KABUPATEN', 'KOTA', 'NIK', 'NAMA', 'TEMPAT', 'TGL', 'LAHIR',
  'JENIS', 'KELAMIN', 'ALAMAT', 'RT', 'RW', 'KEL', 'DESA', 'KECAMATAN',
  'AGAMA', 'STATUS', 'PERKAWINAN', 'PEKERJAAN', 'KEWARGANEGARAAN', 'BERLAKU'
];

const KTP_TYPE = 'KTP';
const KK_TYPE = 'Kartu Keluarga';
const BPJS_TYPE = 'BPJS/KIS/JKN';
const UNKNOWN_TYPE = 'Dokumen Identitas';

export const koreksiNIK = (teks) => teks
  ? String(teks)
      .replace(/[OoQD]/g, '0')
      .replace(/[IilL|]/g, '1')
      .replace(/[Zz]/g, '2')
      .replace(/[Aa]/g, '4')
      .replace(/[Ss]/g, '5')
      .replace(/[Gg]/g, '6')
      .replace(/[Bb]/g, '8')
      .replace(/[^0-9]/g, '')
  : '';

export const koreksiNama = (teks) => teks
  ? String(teks)
      .replace(/[0-9]/g, '')
      .replace(/[^A-Z\s.,']/ig, '')
      .replace(/\b(?:NAMA|AMA|NMA|NAM)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .toUpperCase()
  : '';

const normalizeText = (value) => String(value || '')
  .replace(/\r/g, '\n')
  .replace(/[|]/g, 'I')
  .replace(/[;=]/g, ':')
  .toUpperCase();

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const loadImage = (dataUrl) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = dataUrl;
});

const clamp = (value) => Math.max(0, Math.min(255, value));

const sharpen = (data, width, height) => {
  const copy = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const weight = kernel[(ky + 1) * 3 + (kx + 1)];
          r += copy[idx] * weight;
          g += copy[idx + 1] * weight;
          b += copy[idx + 2] * weight;
        }
      }
      const idx = (y * width + x) * 4;
      data[idx] = clamp(r);
      data[idx + 1] = clamp(g);
      data[idx + 2] = clamp(b);
    }
  }
};

export const enhanceKtpImage = async (file, { threshold = false } = {}) => {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);
  const scale = Math.max(1, Math.min(2.4, 2200 / Math.max(img.width, img.height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const contrast = 1.35;
  const brightness = 8;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let value = clamp((gray - 128) * contrast + 128 + brightness);
    if (threshold) value = value > 145 ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  if (!threshold) sharpen(data, canvas.width, canvas.height);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.96);
};

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
    .map(candidate => koreksiNIK(candidate).slice(0, 16))
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
    const inline = koreksiNama(line.replace(/^.*?(?:NAMA|NMA|NAM|AMA)\s*:?/, ''));
    if (inline.length >= 3 && !KTP_LABELS.some(label => inline === label)) return inline;

    const next = koreksiNama(lines[i + 1] || '');
    if (next.length >= 3 && !KTP_LABELS.some(label => next.includes(label))) return next;
  }

  return '';
};

const detectGender = (text) => {
  const compact = normalizeText(text).replace(/\s/g, '');
  if (/LAKI.?LAKI|LAKILAKI|LKI|LKILKI/.test(compact)) return 'L';
  if (/PEREMPUAN|PEREMP|PRMP|PR/.test(compact)) return 'P';
  return '';
};

const detectMaritalStatus = (text) => {
  const compact = normalizeText(text).replace(/\s/g, '');
  if (compact.includes('BELUMKAWIN')) return 'Belum Kawin';
  if (compact.includes('CERAIHIDUP')) return 'Cerai Hidup';
  if (compact.includes('CERAIMATI')) return 'Cerai Mati';
  if (compact.includes('KAWIN')) return 'Kawin';
  return '';
};

const detectDesa = (text) => {
  const normalized = normalizeText(text);
  if (normalized.includes('MALIMPUNG')) return 'Desa Malimpung';
  if (normalized.includes('PADANG') && normalized.includes('LOANG')) return 'Desa Padang Loang';
  if (normalized.includes('MACCIRINNA') || normalized.includes('MACCIRINA')) return 'Kelurahan Maccirinna';
  return '';
};

const detectDocumentType = (text) => {
  const compact = normalizeText(text).replace(/\s/g, '');
  if (/KARTUKELUARGA|NOKK|NO\.?KK/.test(compact)) return KK_TYPE;
  if (/BPJS|JKN|KIS|KARTUINDONESIASEHAT|ASKES|JAMINANKESEHATAN/.test(compact)) return BPJS_TYPE;
  if (/REPUBLIKINDONESIA|NIK|PROVINSI|KABUPATEN|TEMPAT\/TGL/.test(compact)) return KTP_TYPE;
  return UNKNOWN_TYPE;
};

const findAllNiks = (text) => {
  const compact = normalizeText(text).replace(/\s/g, '');
  const matches = compact.match(/[0-9OoQDIilL|ZzAaSsGgBb]{16,24}/g) || [];
  return [...new Set(
    matches
      .map(candidate => koreksiNIK(candidate).slice(0, 16))
      .filter(candidate => candidate.length === 16 && scoreNik(candidate) >= 3)
  )];
};

const normalizeDateToIso = (day, month, year) => {
  const d = String(day || '').padStart(2, '0');
  const m = String(month || '').padStart(2, '0');
  let y = String(year || '');
  if (y.length === 2) y = `${parseInt(y, 10) > 30 ? '19' : '20'}${y}`;
  const di = parseInt(d, 10);
  const mi = parseInt(m, 10);
  if (di < 1 || di > 31 || mi < 1 || mi > 12 || !/^(19|20)\d{2}$/.test(y)) return '';
  return `${y}-${m}-${d}`;
};

const findDates = (text) => {
  const normalized = normalizeText(text);
  const matches = [...normalized.matchAll(/\b([0-3]?\d)[\s/.-]([01]?\d)[\s/.-]((?:19|20)?\d{2})\b/g)];
  return matches
    .map(match => normalizeDateToIso(match[1], match[2], match[3]))
    .filter(Boolean);
};

const candidateNameFromLine = (line) => {
  const cleaned = koreksiNama(line)
    .replace(/\b(?:KEPALA|KELUARGA|AYAH|IBU|ANAK|SUAMI|ISTRI|STATUS|HUBUNGAN|KELAMIN|LAHIR|NIK)\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (cleaned.length < 3) return '';
  if (KTP_LABELS.some(label => cleaned === label || cleaned.includes(`${label} `))) return '';
  return cleaned;
};

const parseBPJSText = (text, sourceConfidence = 0) => {
  const lines = normalizeText(text).split('\n').map(line => line.trim()).filter(Boolean);
  const niks = findAllNiks(text);
  const dates = findDates(text);
  const labelName = findName(text);
  const fallbackName = lines
    .map(candidateNameFromLine)
    .find(name => name && !/BPJS|JKN|KIS|SEHAT|PESERTA|NOMOR|KARTU/.test(name)) || '';

  const data = {
    nik: niks[0] || '',
    nama: labelName || fallbackName,
    tgl_lahir: dates[0] || '',
    j_kelamin: detectGender(text),
    desa: detectDesa(text),
    status_perkawinan: '',
    raw_text: text || '',
    document_type: BPJS_TYPE,
    candidates: []
  };
  data.confidence = calculateConfidence(data, sourceConfidence);
  return data;
};

const parseKKText = (text, sourceConfidence = 0) => {
  const normalized = normalizeText(text);
  const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean);
  const niks = findAllNiks(text);
  const dates = findDates(text);
  const candidates = [];

  const kkLine = lines.find(line => /(NO\.?\s*KK|NO\s*KARTU\s*KELUARGA|KARTU\s*KELUARGA)/.test(line));
  const kkNumber = kkLine ? (findAllNiks(kkLine)[0] || '') : '';
  const memberNiks = kkNumber ? niks.filter(nik => nik !== kkNumber) : niks;

  memberNiks.forEach((nik, index) => {
    const lineIndex = lines.findIndex(line => koreksiNIK(line).includes(nik));
    const nearby = lines.slice(Math.max(0, lineIndex - 2), Math.min(lines.length, lineIndex + 3));
    const name = nearby.map(candidateNameFromLine).find(Boolean) || '';
    const genderText = nearby.join(' ');
    candidates.push({
      nik,
      nama: name,
      tgl_lahir: dates[index] || '',
      j_kelamin: detectGender(genderText),
      status_perkawinan: detectMaritalStatus(genderText),
      desa: detectDesa(text),
      document_type: KK_TYPE,
      kk: kkNumber
    });
  });

  if (candidates.length === 0 && niks[0]) {
    candidates.push({
      nik: niks[0],
      nama: findName(text),
      tgl_lahir: dates[0] || '',
      j_kelamin: detectGender(text),
      status_perkawinan: detectMaritalStatus(text),
      desa: detectDesa(text),
      document_type: KK_TYPE,
      kk: kkNumber
    });
  }

  const primary = candidates[0] || {};
  const data = {
    nik: primary.nik || '',
    nama: primary.nama || findName(text),
    tgl_lahir: primary.tgl_lahir || dates[0] || '',
    j_kelamin: primary.j_kelamin || detectGender(text),
    desa: primary.desa || detectDesa(text),
    status_perkawinan: primary.status_perkawinan || detectMaritalStatus(text),
    raw_text: text || '',
    document_type: KK_TYPE,
    kk: kkNumber,
    candidates
  };
  data.confidence = calculateConfidence(data, sourceConfidence) - (candidates.length > 1 ? 0.1 : 0);
  return data;
};

const calculateConfidence = (data, sourceConfidence = 0) => {
  let score = sourceConfidence || 0;
  if (data.nik && scoreNik(data.nik) >= 4) score += 0.35;
  if (data.nama) score += 0.2;
  if (data.tgl_lahir) score += 0.15;
  if (data.j_kelamin) score += 0.1;
  if (data.desa) score += 0.05;
  return Math.min(0.98, Math.max(0.2, score));
};

export const parseKTPText = (text, sourceConfidence = 0) => {
  const documentType = detectDocumentType(text);
  if (documentType === KK_TYPE) return parseKKText(text, sourceConfidence);
  if (documentType === BPJS_TYPE) return parseBPJSText(text, sourceConfidence);

  const data = {
    nik: findBestNik(text),
    nama: findName(text),
    tgl_lahir: findDate(text),
    j_kelamin: detectGender(text),
    desa: detectDesa(text),
    status_perkawinan: detectMaritalStatus(text),
    raw_text: text || '',
    document_type: documentType === UNKNOWN_TYPE ? KTP_TYPE : documentType,
    candidates: []
  };

  data.confidence = calculateConfidence(data, sourceConfidence);
  return data;
};

const postToGemini = async (file, apiKey) => {
  const dataUrl = await fileToDataUrl(file);
  const base64Data = String(dataUrl).split(',')[1] || '';
  const mimeType = file.type || 'image/jpeg';

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "Lakukan OCR dan analisis dokumen identitas Indonesia ini (KTP, Kartu Keluarga, atau Kartu BPJS/KIS/JKN). Ekstrak informasi berikut dengan akurat:\n" +
                    "1. document_type: Tentukan jenis dokumen ('KTP', 'Kartu Keluarga', atau 'BPJS/KIS/JKN'). Jika dokumen tidak dikenali, gunakan 'KTP' sebagai default.\n" +
                    "2. nik: Nomor Induk Kependudukan (16 digit angka). Jika dokumen berupa Kartu Keluarga, ekstrak NIK dari anggota keluarga pertama/kepala keluarga atau NIK yang paling dominan/jelas.\n" +
                    "3. nama: Nama lengkap sesuai dokumen, hilangkan gelar akademis/medis jika ada (misal: 'drg.', 'dr.', 'S.Kep', 'A.Md.Keb' dll), gunakan huruf kapital.\n" +
                    "4. tgl_lahir: Tanggal lahir dalam format YYYY-MM-DD. Pastikan tahun lahir 4 digit (misal: '1995-08-24'). Jika tidak ada, kosongkan.\n" +
                    "5. j_kelamin: Jenis kelamin, harus berupa 'L' untuk Laki-laki atau 'P' untuk Perempuan. Jika tidak terdeteksi di dokumen, analisis dari nama atau kosongkan.\n" +
                    "6. desa: Nama Desa atau Kelurahan, pilih dari daftar berikut yang paling cocok jika ada di dokumen: 'Desa Malimpung', 'Desa Padang Loang', atau 'Kelurahan Maccirinna'. Jika tidak ada yang cocok atau tidak terbaca, kosongkan.\n" +
                    "7. status_perkawinan: Status pernikahan (misal: 'Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'). Jika tidak ada, kosongkan.\n" +
                    "8. kk: Nomor Kartu Keluarga (16 digit angka), hanya diisi jika document_type adalah 'Kartu Keluarga', jika tidak kosongkan.\n\n" +
                    "Harap kembalikan data dalam format JSON murni yang sesuai dengan skema."
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            document_type: {
              type: "STRING",
              enum: ["KTP", "Kartu Keluarga", "BPJS/KIS/JKN", "Dokumen Identitas"]
            },
            nik: {
              type: "STRING",
              description: "16-digit NIK"
            },
            nama: {
              type: "STRING",
              description: "Full name in uppercase without academic/medical titles"
            },
            tgl_lahir: {
              type: "STRING",
              description: "Format YYYY-MM-DD"
            },
            j_kelamin: {
              type: "STRING",
              description: "L or P"
            },
            desa: {
              type: "STRING",
              description: "Desa Malimpung, Desa Padang Loang, or Kelurahan Maccirinna"
            },
            status_perkawinan: {
              type: "STRING",
              description: "Belum Kawin, Kawin, Cerai Hidup, or Cerai Mati"
            },
            kk: {
              type: "STRING",
              description: "16-digit KK number"
            }
          },
          required: ["document_type", "nik", "nama"]
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP Error ${response.status}`);
  }

  const result = await response.json();
  const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('Respons Gemini kosong');
  }

  const parsedJson = JSON.parse(textResponse);
  const data = {
    nik: koreksiNIK(parsedJson.nik || '').slice(0, 16),
    nama: koreksiNama(parsedJson.nama || ''),
    tgl_lahir: parsedJson.tgl_lahir || '',
    j_kelamin: parsedJson.j_kelamin || '',
    desa: parsedJson.desa || '',
    status_perkawinan: parsedJson.status_perkawinan || '',
    document_type: parsedJson.document_type || KTP_TYPE,
    kk: koreksiNIK(parsedJson.kk || '').slice(0, 16),
    raw_text: textResponse,
    candidates: []
  };

  data.confidence = calculateConfidence(data, 0.85);
  return { success: true, data, source: 'Google Gemini 2.5 Flash' };
};

const postToBackend = async (file, backendUrl = DEFAULT_BACKEND_URL) => {
  const dataUrl = await fileToDataUrl(file);
  const base64_image = String(dataUrl).split(',')[1] || '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${backendUrl}/ocr/ktp/base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64_image }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Backend OCR ${response.status}`);
    const payload = await response.json();
    if (!payload?.success) throw new Error(payload?.error || 'Backend OCR gagal');

    const backendData = payload.data || {};
    const rawText = backendData.raw_text || payload.raw_text || '';
    const parsed = rawText ? parseKTPText(rawText, 0.3) : {};
    const data = {
      ...parsed,
      ...backendData,
      nik: koreksiNIK(backendData.nik || parsed.nik || '').slice(0, 16),
      nama: koreksiNama(backendData.nama || parsed.nama || ''),
      tgl_lahir: backendData.tgl_lahir || backendData.tanggal_lahir || parsed.tgl_lahir || '',
      j_kelamin: backendData.j_kelamin || backendData.jenis_kelamin || parsed.j_kelamin || '',
      desa: backendData.desa || parsed.desa || '',
      status_perkawinan: backendData.status_perkawinan || parsed.status_perkawinan || '',
      raw_text: rawText
    };
    data.confidence = calculateConfidence(data, Number(backendData.confidence || payload.confidence || 0.35));
    return { success: true, data, source: 'PaddleOCR Backend' };
  } finally {
    clearTimeout(timeout);
  }
};

const recognizeWithTesseract = async (image, onProgress, progressBase, progressSpan) => {
  const result = await Tesseract.recognize(image, 'ind', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.min(99, Math.round(progressBase + (m.progress * progressSpan))));
      }
    }
  });
  return {
    text: result.data.text || '',
    confidence: Number(result.data.confidence || 0) / 100
  };
};

export const runKtpOcr = async (file, {
  onProgress,
  onMode,
  backendUrl = DEFAULT_BACKEND_URL,
  preferBackend = true,
  geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || ''
} = {}) => {
  if (geminiApiKey) {
    try {
      onMode?.('Membaca dokumen via Gemini AI...');
      onProgress?.(15);
      const geminiResult = await postToGemini(file, geminiApiKey);
      if (geminiResult?.data?.nik || geminiResult?.data?.nama) {
        onProgress?.(100);
        return geminiResult;
      }
    } catch (error) {
      console.warn('Gemini OCR gagal, dialihkan ke backend/lokal:', error.message);
    }
  }

  if (preferBackend) {
    try {
      onMode?.('Mencoba PaddleOCR lokal...');
      onProgress?.(5);
      const backendResult = await postToBackend(file, backendUrl);
      if (backendResult?.data?.nik || backendResult?.data?.nama) {
        onProgress?.(100);
        return backendResult;
      }
    } catch (error) {
      console.info('Backend OCR tidak tersedia, lanjut Tesseract lokal:', error.message);
    }
  }

  onMode?.('Meningkatkan kualitas foto...');
  onProgress?.(10);
  const enhanced = await enhanceKtpImage(file);

  onMode?.('Membaca KTP via Tesseract lokal...');
  const firstPass = await recognizeWithTesseract(enhanced, onProgress, 20, 55);
  let parsed = parseKTPText(firstPass.text, firstPass.confidence);

  if (!parsed.nik || !parsed.nama) {
    onMode?.('Membaca ulang dengan kontras tinggi...');
    const threshold = await enhanceKtpImage(file, { threshold: true });
    const secondPass = await recognizeWithTesseract(threshold, onProgress, 75, 20);
    const secondParsed = parseKTPText(secondPass.text, secondPass.confidence);
    parsed = {
      nik: parsed.nik || secondParsed.nik,
      nama: parsed.nama || secondParsed.nama,
      tgl_lahir: parsed.tgl_lahir || secondParsed.tgl_lahir,
      j_kelamin: parsed.j_kelamin || secondParsed.j_kelamin,
      desa: parsed.desa || secondParsed.desa,
      status_perkawinan: parsed.status_perkawinan || secondParsed.status_perkawinan,
      document_type: parsed.document_type || secondParsed.document_type,
      candidates: parsed.candidates?.length ? parsed.candidates : (secondParsed.candidates || []),
      raw_text: [firstPass.text, secondPass.text].filter(Boolean).join('\n--- PASS 2 ---\n')
    };
    parsed.confidence = calculateConfidence(parsed, Math.max(firstPass.confidence, secondPass.confidence));
  }

  onProgress?.(100);
  return {
    success: Boolean(parsed.nik || parsed.nama),
    data: parsed,
    source: 'Tesseract.js Lokal'
  };
};
