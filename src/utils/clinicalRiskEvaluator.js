const extractValue = (posData, keywords = [], questionMap = {}) => {
  if (!posData || typeof posData !== 'object') return null;
  const key = Object.keys(posData).find((k) => {
    const keyText = String(k).toLowerCase();
    const questionText = String(questionMap[k] || '').toLowerCase();
    return keywords.some((kw) => keyText.includes(kw) || questionText.includes(kw));
  });
  return key !== undefined ? posData[key] : null;
};

const extractFirstValue = (posData, keywordGroups = [], questionMap = {}) => {
  for (const keywords of keywordGroups) {
    const value = extractValue(posData, keywords, questionMap);
    if (value !== null && value !== undefined && String(value).trim() !== '') return value;
  }
  return null;
};

export const getVisitBloodPressure = (visit = {}) => {
  const p2 = visit.pos2 || {};
  const qMap = visit.pos2_question_map || {};
  const td = String(p2.td || extractValue(p2, ['tekanan darah'], qMap) || '');
  const sys = extractValue(p2, ['sistolik'], qMap) || (td.includes('/') ? td.split('/')[0] : td);
  const dia = extractValue(p2, ['diastolik'], qMap) || (td.includes('/') ? td.split('/')[1] : '');
  const sysNum = parseInt(sys, 10);
  const diaNum = parseInt(dia, 10);

  return {
    sys: Number.isNaN(sysNum) ? null : sysNum,
    dia: Number.isNaN(diaNum) ? null : diaNum,
    label: sys ? `${sys}/${dia || '-'}` : '-'
  };
};

export const getVisitGlucose = (visit = {}) => {
  const p2 = visit.pos2 || {};
  const p4 = visit.pos4 || {};
  const qMap2 = visit.pos2_question_map || {};
  const qMap4 = visit.pos4_question_map || {};

  const gdsRaw = extractFirstValue(p2, [['gula darah sewaktu'], ['gds']], qMap2) ||
                 extractFirstValue(p4, [['gula darah sewaktu'], ['gds']], qMap4) ||
                 p4.gds || p2.gds;
  const gdpRaw = extractFirstValue(p2, [['gula darah puasa'], ['gdp']], qMap2) ||
                 extractFirstValue(p4, [['gula darah puasa'], ['gdp']], qMap4) ||
                 p4.gdp || p2.gdp;

  const gds = parseInt(gdsRaw, 10);
  const gdp = parseInt(gdpRaw, 10);

  return {
    gds: Number.isNaN(gds) ? null : gds,
    gdp: Number.isNaN(gdp) ? null : gdp,
    label: gdsRaw || gdpRaw || '-'
  };
};

export const getVisitBodyMassIndex = (visit = {}) => {
  const p2 = visit.pos2 || {};
  const qMap2 = visit.pos2_question_map || {};
  const savedImt = extractFirstValue(p2, [['index massa tubuh'], ['indeks massa tubuh'], ['imt/u'], ['imt']], qMap2) || p2.imt;
  const tbRaw = extractFirstValue(p2, [['tinggi badan'], ['pengukuran tinggi badan'], ['panjang badan']], qMap2) || p2.tb;
  const bbRaw = extractFirstValue(p2, [['berat badan']], qMap2) || p2.bb;

  const tb = parseFloat(tbRaw);
  const bb = parseFloat(bbRaw);
  const calculated = tb > 0 && bb > 0 ? bb / Math.pow(tb / 100, 2) : null;
  const numeric = Number.isFinite(parseFloat(savedImt)) ? parseFloat(savedImt) : calculated;

  return {
    value: Number.isFinite(numeric) ? numeric : null,
    label: Number.isFinite(numeric) ? numeric.toFixed(1) : '-',
    saved: savedImt || ''
  };
};

export const isHipertensiRisk = (visit = {}) => {
  const bp = getVisitBloodPressure(visit);
  return (bp.sys !== null && bp.sys >= 140) || (bp.dia !== null && bp.dia >= 90);
};

export const isDiabetesRisk = (visit = {}) => {
  const glucose = getVisitGlucose(visit);
  return (glucose.gds !== null && glucose.gds >= 200) || (glucose.gdp !== null && glucose.gdp >= 126);
};

export const isObesitasRisk = (visit = {}) => {
  const kat = visit.kategori_usia_satusehat || '';
  if (['Bayi', 'Balita', 'BBL'].includes(kat)) return false;
  const bmi = getVisitBodyMassIndex(visit);
  return bmi.value !== null && bmi.value >= 25.0;
};

export const isParuRisk = (visit = {}) => {
  const p4 = visit.pos4 || {};
  const p5 = visit.pos5 || {};
  const qMap4 = visit.pos4_question_map || {};
  const qMap5 = visit.pos5_question_map || {};

  // Struktur Objek Legacy & Pos 4
  if (p4.ppok?.nafas_pendek === 'Ya' || p4.merokok?.batuk_lama === 'Ya' || p4.resiko_ca_paru?.riw_merokok === 'Ya' || p4.resiko_tb?.batuk_lama === '>2Mg') {
    return true;
  }

  // Struktur Pos 5
  if (p5.ppok?.nafas_pendek === 'Ya' || p5.merokok?.batuk_lama === 'Ya' || p5.resiko_tb?.batuk === 'Ya' || p5.resiko_tb?.batuk_lama === '>2Mg') {
    return true;
  }

  // Dynamic Form Keyword Search pada Pos 4 dan Pos 5
  const batukPos5 = extractValue(p5, ['batuk'], qMap5);
  if (batukPos5 && (String(batukPos5).toLowerCase() === 'ya' || String(batukPos5) === '>2Mg')) return true;

  const tbPos5 = extractValue(p5, ['tb', 'tuberkulosis', 'tbc'], qMap5);
  if (tbPos5 && (String(tbPos5).toLowerCase().includes('ya') || String(tbPos5).toLowerCase().includes('beresiko') || String(tbPos5).toLowerCase().includes('positif'))) return true;

  const rokokPos5 = extractValue(p5, ['merokok', 'rokok', 'puma'], qMap5);
  if (rokokPos5 && (String(rokokPos5).toLowerCase() === 'ya' || String(rokokPos5).toLowerCase().includes('perokok') || String(rokokPos5).toLowerCase().includes('tinggi'))) return true;

  const rokokPos4 = extractValue(p4, ['merokok', 'rokok', 'puma'], qMap4);
  if (rokokPos4 && (String(rokokPos4).toLowerCase() === 'ya' || String(rokokPos4).toLowerCase().includes('perokok'))) return true;

  return false;
};

export const isMentalRisk = (visit = {}) => {
  const p3 = visit.pos3 || {};
  const p6 = visit.pos6 || {};
  const qMap6 = visit.pos6_question_map || {};
  const skilas = p3.skilas || p6.skilas || {};

  // SRQ-20
  const srqPositiveP3 = Object.values(p3.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '');
  const srqPositiveP6 = Object.values(p6.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '');
  if (srqPositiveP3 || srqPositiveP6) return true;

  // SDQ
  const sdqPositiveP3 = Object.values(p3.jiwa_sdq || {}).some(val => String(val) === 'Ya');
  const sdqPositiveP6 = Object.values(p6.jiwa_sdq || {}).some(val => String(val) === 'Ya');
  if (sdqPositiveP3 || sdqPositiveP6) return true;

  // Skilas / Depresi
  if (skilas.dep_sedih === 'Ya' || skilas.dep_minat_turun === 'Ya' || skilas.depl_tak_berdaya === 'Ya') return true;

  // Pos 6 dynamic form keywords
  const depresiDynamic = extractValue(p6, ['depresi', 'cemas', 'khawatir', 'srq', 'sdq', 'emosi', 'sedih', 'murung'], qMap6);
  if (depresiDynamic && (String(depresiDynamic).toLowerCase() === 'ya' || String(depresiDynamic).toLowerCase().includes('gejala') || String(depresiDynamic).toLowerCase().includes('beresiko'))) {
    return true;
  }

  return false;
};

export const isInderaRisk = (visit = {}) => {
  const p3 = visit.pos3 || {};
  const qMap3 = visit.pos3_question_map || {};

  const visusStr = String(p3.mata?.visus || extractValue(p3, ['visus', 'snellen', 'tumbling', 'mata', 'penglihatan'], qMap3) || '').toLowerCase();
  if (visusStr && !['6/6', 'normal', 'tidak', 'tdk'].includes(visusStr) && (visusStr.includes('/') || visusStr.includes('gangguan') || visusStr.includes('kabur') || visusStr.includes('buram'))) {
    return true;
  }

  if (p3.telinga?.gg_pendengaran === 'Ya' || p3.telinga?.infeksi === 'Ya') return true;

  const dengar = extractValue(p3, ['pendengaran', 'telinga', 'serumen', 'bisik'], qMap3);
  if (dengar && (String(dengar).toLowerCase() === 'ya' || String(dengar).toLowerCase().includes('gangguan'))) return true;

  return false;
};

const inderaSidePatterns = Object.freeze({
  mata_kiri: /(mata|penglihatan|visus).*(kiri)|(kiri).*(mata|penglihatan|visus)/i,
  mata_kanan: /(mata|penglihatan|visus).*(kanan)|(kanan).*(mata|penglihatan|visus)/i,
  telinga_kiri: /(telinga|pendengaran|serumen|infeksi).*(kiri)|(kiri).*(telinga|pendengaran|serumen|infeksi)/i,
  telinga_kanan: /(telinga|pendengaran|serumen|infeksi).*(kanan)|(kanan).*(telinga|pendengaran|serumen|infeksi)/i
});

const isPositiveFinding = (value) => {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text || ['normal', 'tidak', 'tdk', 'tidak ada', 'baik', '6/6', '6/9', '6/12'].includes(text)) return false;
  return /gangguan|indikasi|kelainan|infeksi|serumen|buram|kabur|positif|ya|<|tidak normal/.test(text);
};

export const getInderaBreakdown = (visit = {}) => {
  const result = { mata_kiri: false, mata_kanan: false, telinga_kiri: false, telinga_kanan: false };
  const p3 = visit.pos3 || {};
  const questionMap = { ...(visit.pos3_question_map || {}), ...(p3.question_map || {}) };
  const answers = { ...p3, ...(p3.answers || {}), ...(p3.jawaban || {}) };
  Object.entries(answers).forEach(([key, value]) => {
    const label = `${key} ${questionMap[key] || ''}`;
    Object.entries(inderaSidePatterns).forEach(([side, pattern]) => {
      if (pattern.test(label) && isPositiveFinding(value)) result[side] = true;
    });
  });
  return result;
};

export const evaluateAllClinicalRisks = (visit = {}) => ({
  hipertensi: isHipertensiRisk(visit),
  diabetes: isDiabetesRisk(visit),
  obesitas: isObesitasRisk(visit),
  paru_ppok: isParuRisk(visit),
  mental: isMentalRisk(visit),
  indera: isInderaRisk(visit)
});

export const getClinicalRiskBadges = (visit = {}, type = '') => {
  const badges = [];
  const p2 = visit.pos2 || {};
  const p3 = visit.pos3 || {};
  const p4 = visit.pos4 || {};
  const p5 = visit.pos5 || {};
  const p6 = visit.pos6 || {};
  const qMap5 = visit.pos5_question_map || {};
  const qMap6 = visit.pos6_question_map || {};

  if (type === 'hipertensi') {
    const bp = getVisitBloodPressure(visit);
    badges.push(`🩺 TD: ${bp.label} mmHg`);
  } else if (type === 'diabetes') {
    const g = getVisitGlucose(visit);
    badges.push(`🩸 Gula: ${g.label} mg/dL`);
  } else if (type === 'obesitas') {
    const bmi = getVisitBodyMassIndex(visit);
    badges.push(`⚖️ IMT: ${bmi.label}`);
  } else if (type === 'paru_ppok') {
    if (p4.resiko_tb?.batuk_lama === '>2Mg' || p5.resiko_tb?.batuk === 'Ya' || extractValue(p5, ['batuk'], qMap5) === 'Ya') {
      badges.push('🫁 Batuk Lama / Gejala TB');
    }
    if (p4.ppok?.nafas_pendek === 'Ya' || p5.ppok?.nafas_pendek === 'Ya') {
      badges.push('🫁 Gejala PPOK / Napas Pendek');
    }
    if (p4.resiko_ca_paru?.riw_merokok === 'Ya' || p4.merokok?.batuk_lama === 'Ya' || p5.merokok?.batuk_lama === 'Ya' || extractValue(p5, ['merokok'], qMap5) === 'Ya') {
      badges.push('🚬 Riwayat Merokok / PUMA');
    }
    if (badges.length === 0) {
      badges.push('🫁 Skrining Paru / TB Positif');
    }
  } else if (type === 'mental') {
    const p3Srq = Object.values(p3.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '');
    const p6Srq = Object.values(p6.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '');
    if (p3Srq || p6Srq) badges.push('🧠 Skrining SRQ-20 Positif');

    const p3Sdq = Object.values(p3.jiwa_sdq || {}).some(val => String(val) === 'Ya');
    const p6Sdq = Object.values(p6.jiwa_sdq || {}).some(val => String(val) === 'Ya');
    if (p3Sdq || p6Sdq) badges.push('🧠 Skrining SDQ Positif');

    const skilas = p3.skilas || p6.skilas || {};
    if (skilas.dep_sedih === 'Ya' || skilas.dep_minat_turun === 'Ya' || skilas.depl_tak_berdaya === 'Ya') {
      badges.push('🧠 Indikasi Gejala Depresi / Emosional');
    }
    if (badges.length === 0) {
      badges.push('🧠 Skrining Jiwa / Emosi Positif');
    }
  } else if (type === 'indera') {
    const visusStr = String(p3.mata?.visus || '').toLowerCase();
    if (visusStr && !['6/6', 'normal'].includes(visusStr)) {
      badges.push(`👁️ Visus: ${p3.mata?.visus}`);
    }
    if (p3.telinga?.gg_pendengaran === 'Ya' || p3.telinga?.infeksi === 'Ya') {
      badges.push('👂 Gangguan Telinga / Pendengaran');
    }
    if (badges.length === 0) {
      badges.push('👁️ Skrining Indera Berisiko');
    }
  }

  return badges;
};
