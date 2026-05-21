export const buildQuestionMap = (schema) => {
  if (!schema?.questions) return {};
  return Object.fromEntries(schema.questions.map(q => [q.id, q.question_text]));
};

const REGISTRY = {
  BLOCKED: ['nama faskes', 'nik', 'nisn', 'nama lengkap', 'tanggal lahir', 'jenis kelamin', 'status perkawinan', 'apabila belum menikah', 'tanggal pemeriksaan', 'kelas', 'nama sekolah', 'jenis sekolah', 'alamat'],
  POS2: ['berat badan', 'tinggi badan', 'panjang badan', 'lingkar kepala', 'lingkar betis', 'imt', 'index massa tubuh', 'tekanan darah', 'sistolik', 'diastolik', 'lingkar perut', 'lila', 'suhu', 'nadi', 'napas', 'gula darah', 'gds', 'gdp', 'hba1c', 'hb1ac', 'diabetes', 'dm', 'bb/u', 'pb/u', 'tb/u', 'bb/pb', 'bb/tb'],
  POS3: ['mata', 'visus', 'pupil', 'pinhole', 'kacamata', 'juling', 'penglihatan', 'daya lihat', 'e-tumbling', 'snellen', 'telinga', 'pendengaran', 'serumen', 'berbisik', 'dengar', 'otoskop', 'penala', 'gigi', 'karies', 'periodontal', 'goyang', 'mulut', 'jantung bawaan', 'empedu', 'ikterus', 'tinja'],
  POS4: ['kolesterol', 'ldl', 'hdl', 'trigliserida', 'asam urat', 'dislipidemia', 'hepatitis', 'hcv', 'hbsag', 'hiv', 'sifilis', 'malaria', 'transfusi', 'cuci darah', 'hemodialisa', 'kencing nanah', 'gonore', 'talasemia', 'hemoglobin', 'mcv', 'mch', 'eritrosit', 'rbc', 'rdw', 'shk', 'g6pd', 'hipotiroid', 'adrenal kongenital'],
  POS6: ['minicog', 'mini-cog', 'menggambar jam', 'depresi', 'sdq', 'srq', 'emosi', 'khawatir', 'cemas', 'adl', 'ad-8', 'ad8', 'sppb', 'spbb', 'risiko jatuh', 'mna', 'mnasf', 'skilas', 'kognitif', 'kpsp', 'autisme', 'm-chat', 'kmpe', 'gpph', 'tantrum', 'impulsif', 'perilaku', 'mengingat', 'berkurang >3 kg', 'penurunan berat badan', 'berapa nilai imt', 'gangguan memori', 'klien/pasien lansia', 'membersihkan diri', 'keputusan', 'hobi', 'lupa nama bulan', 'mengatur keuangan', 'mengingat janji', 'nafsu makan', 'mobilitas', 'neuropsikologis', 'psikologis', 'berdiri dari kursi', 'keseimbangan', 'tandem', 'kecepatan berjalan', 'buang air besar', 'berkemih', 'jamban', 'makan dan minum', 'berbaring ke duduk', 'memakai baju', 'naik turun tangga', 'mandi', 'sedih', 'minat', 'kesenangan', 'puas dengan kehidupan', 'bosan', 'tidak berdaya', 'tidak berharga', 'kurang berminat', 'bersemangat', 'murung', 'gugup', 'mengendalikan kekhawatiran', 'mengulang-ngulang', 'berpindah/berjalan'],
  POS5_SPECIFIC: ['batuk', 'tbc', 'tuberkulosis', 'keringat malam', 'demam', 'lesu', 'dahak', 'mantoux', 'indurasi', 'pembesaran kelenjar', 'pembengkakan tulang', 'spirometri', 'puma', 'tcm', 'bta', 'skoring tb', 'sadanis', 'inspekulo', 'iva', 'dna hpv', 'ekg', 'bercak', 'putih mati rasa', 'kudis', 'skabies', 'koreng', 'gatal', 'kusta', 'frambusia', 'olahraga', 'merokok', 'alkohol', 'sayur', 'buah', 'narkoba', 'hubungan seksual', 'hubungan intim', 'aktif', 'terbangun', 'napas pendek']
};

const isSchoolAgeCategory = (value) => ['sd', 'smp', 'sma', 'anak/siswa'].includes(String(value || '').trim().toLowerCase());
const isEarlyChildCategory = (value) => ['bayi', 'balita'].includes(String(value || '').trim().toLowerCase());
const isHakScreeningText = (text) => /\bhak\b/.test(text) || text.includes('hiperplasia adrenal kongenital') || text.includes('adrenal kongenital');
const getText = (question) => String(question?.question_text || '').toLowerCase();
const getValue = (formData, id) => (id ? formData[id] || '' : '');
const isFilled = (formData, id) => Boolean(String(getValue(formData, id)).trim());
const isYesValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'ya' || normalized === 'yes' || normalized.includes('positif') || normalized.includes('reaktif');
};
const isNoValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'tidak' || normalized === 'tdk' || normalized === 'no' || normalized.includes('negatif') || normalized.includes('non reaktif');
};

export const getQuestionsForPos = (schema, posNumber, kategoriUsia = '-') => {
  if (!schema?.questions) return [];

  return [...schema.questions].sort((a, b) => a.column - b.column).filter((q) => {
    const txt = getText(q);
    if (REGISTRY.BLOCKED.some(kw => txt.includes(kw))) return false;

    const isEarlyChild = isEarlyChildCategory(kategoriUsia);
    const isBalitaDmFlow = isEarlyChild && [
      'sering lapar',
      'banyak makan',
      'sering haus',
      'banyak minum',
      'sering pipis',
      'sering mengompol',
      'riwayat penyakit diabetes',
      'keluhan & gejala dm'
    ].some(kw => txt.includes(kw));
    const isBalitaTbFlow = isEarlyChild && [
      'batuk yang tidak sembuh',
      'tanpa alasan yang jelas',
      'berat badan anak anda tidak naik',
      'berkurang nafsu makan',
      'tuberkulosis',
      'risiko tuberkulosis anak',
      'demam yang tidak diketahui',
      'pembesaran kelenjar',
      'pembengkakan tulang',
      'mantoux',
      'skoring tb'
    ].some(kw => txt.includes(kw));
    const isBalitaDevelopmentFlow = isEarlyChild && [
      'sering tantrum',
      'tidak bisa duduk tenang',
      'm-chat',
      'kmpe',
      'gpph'
    ].some(kw => txt.includes(kw));

    let isP2 = REGISTRY.POS2.some(kw => txt.includes(kw));
    let isP3 = REGISTRY.POS3.some(kw => txt.includes(kw));
    let isP4 = REGISTRY.POS4.some(kw => txt.includes(kw));
    const isP6 = REGISTRY.POS6.some(kw => txt.includes(kw));
    let isP5Specific = REGISTRY.POS5_SPECIFIC.some(kw => txt.includes(kw));

    if (isHakScreeningText(txt)) isP4 = true;
    if (['nafsu makan', 'kesulitan makan', 'asupan makanan', 'mna'].some(kw => txt.includes(kw))) isP5Specific = false;
    if (isBalitaTbFlow) isP2 = false;
    if (txt.includes('napas pendek')) isP2 = false;
    if (txt.includes('berkurang >3 kg') || txt.includes('penurunan berat badan') || txt.includes('berapa nilai imt')) isP2 = false;
    if (txt.includes('gangguan memori') || txt.includes('kunci kendaraan') || txt.includes('membersihkan diri')) isP3 = false;
    if (txt.includes('klien/pasien lansia') || txt.includes('mengingat tiga kata') || txt.includes('mendengarkan dengan cermat')) {
      isP2 = false;
      isP3 = false;
      isP4 = false;
    }
    if (isBalitaDmFlow) isP2 = true;

    if (posNumber === 2) return isP2;
    if (posNumber === 3) return isP3 && !isP2;
    if (posNumber === 4) return isP4 && !isP3 && !isP2;
    if (posNumber === 6) return (isP6 || isBalitaDevelopmentFlow) && !isP4 && !isP3 && !isP2 && !isBalitaTbFlow;
    if (posNumber === 5) return isBalitaTbFlow || isP5Specific || (!isP2 && !isP3 && !isP4 && !isP6 && !isBalitaDevelopmentFlow);
    return false;
  });
};

export const getVisibleQuestionIdsForSchema = (schema, formData = {}, options = {}) => {
  const { posNumber, kategoriUsia = '-' } = options;
  const questions = getQuestionsForPos(schema, posNumber, kategoriUsia);
  const findQ = (keywords) => questions.find(q => keywords.some(kw => getText(q).includes(kw)));
  const visibleIds = new Set();

  const isVisible = (q) => {
    const t = getText(q);
    const isPuasa = formData.VIRTUAL_PUASA === 'Ya';
    const isTidakPuasa = formData.VIRTUAL_PUASA === 'Tidak' || !formData.VIRTUAL_PUASA;

    if (t.includes('gula darah sewaktu') && isPuasa) return false;
    if ((t.includes('gula darah puasa') || t.includes('2 jam pp')) && isTidakPuasa) return false;

    if (t.includes('lingkar betis')) {
      const qIMT = findQ(['index massa tubuh', 'imt']);
      const imt = getValue(formData, qIMT?.id);
      if (imt && !imt.startsWith('0.0') && !imt.includes('NaN')) return false;
    }

    const qMerokokSetahun = findQ(['merokok dalam setahun terakhir']);
    const qPernahMerokok = findQ(['pernah merokok sebelumnya']);
    const qPumaMerokok = findQ(['sedang/mempunyai riwayat merokok']);
    const isPerokokAktif = isYesValue(getValue(formData, qMerokokSetahun?.id));
    const isBukanPerokokAktif = isNoValue(getValue(formData, qMerokokSetahun?.id));
    const isMantanPerokok = isYesValue(getValue(formData, qPernahMerokok?.id));

    if (qMerokokSetahun) {
      if (t.includes('jika perokok') || t.includes('sudah berapa tahun anda merokok') || t.includes('batang rokok')) return isPerokokAktif;
      if (t.includes('pernah merokok sebelumnya')) return isBukanPerokokAktif;
      if (t.includes('berapa lama') && t.includes('merokok sebelumnya')) return isBukanPerokokAktif && isMantanPerokok;
      if (t.includes('kapan anda berhenti merokok')) return isBukanPerokokAktif && isMantanPerokok;
      if (t.includes('derajat merokok')) return isPerokokAktif;
      if (t.includes('sedang/mempunyai riwayat merokok')) return false;
      if (t.includes('bungkus per tahun')) return isPerokokAktif || isYesValue(getValue(formData, qPumaMerokok?.id));
      if (t.includes('riwayat merokok - apcs') || t.includes('riwayat merokok/paparan asap rokok')) {
        const qAsap = findQ(['terpapar asap rokok']);
        return isFilled(formData, qMerokokSetahun.id) || isFilled(formData, qPernahMerokok?.id) || isYesValue(getValue(formData, qAsap?.id));
      }
    }

    if (t.includes('snellen chart') && !isSchoolAgeCategory(kategoriUsia)) {
      const tumb = t.includes('kiri') ? findQ(['e-tumbling', 'kiri']) : findQ(['e-tumbling', 'kanan']);
      if (tumb && (!getValue(formData, tumb.id) || getValue(formData, tumb.id).toLowerCase().includes('normal'))) return false;
    }

    if (schema?.sheet_name === 'BBL') {
      const isPositive = (item) => String(getValue(formData, item?.id)).toLowerCase().includes('positif');
      const isYes = (item) => String(getValue(formData, item?.id)).toLowerCase() === 'ya';
      const qShkLab = findQ(['hipotiroid kongenital']);
      const qG6pdLab = findQ(['laboratorium g6pd', 'g6pd']);
      const qHakLab = findQ(['hiperplasia adrenal kongenital']);
      const qShkAsk = findQ(['konfrimasi shk', 'konfirmasi shk']);
      const qG6pdAsk = findQ(['konfirmasi defisiensi g6pd']);
      const qHakAsk = findQ(['konfirmasi skrining hak']);

      if (t.includes('apakah dilakukan tes') && t.includes('shk') && !isPositive(qShkLab)) return false;
      if (t.includes('konfirmasi defisiensi g6pd') && t.includes('apakah') && !isPositive(qG6pdLab)) return false;
      if (t.includes('konfirmasi skrining hak') && !isPositive(qHakLab)) return false;
      if (t.includes('tes konfirmasi shk') && !t.includes('apakah') && !isYes(qShkAsk)) return false;
      if (t.includes('hasil tes konfirmasi defisiensi g6pd') && !isYes(qG6pdAsk)) return false;
      if (q.id === 'BBL_026' && !isYes(qHakAsk)) return false;
    }

    if (isEarlyChildCategory(kategoriUsia)) {
      const isYes = (item) => item && String(getValue(formData, item.id)).toLowerCase() === 'ya';
      if (t.includes('m-chat')) {
        const autismSignal = findQ(['masalah interaksi', 'bahasa dan bicara', 'perilaku berulang']);
        if (autismSignal && !isYes(autismSignal)) return false;
      }
      if (t.includes('kmpe')) {
        const emotionSignal = findQ(['sering tantrum', 'perubahan emosi']);
        if (emotionSignal && !isYes(emotionSignal)) return false;
      }
      if (t.includes('gpph')) {
        const hyperSignal = findQ(['tidak bisa duduk tenang', 'emosi meledak']);
        if (hyperSignal && !isYes(hyperSignal)) return false;
      }

      const tbSignals = [
        findQ(['batuk yang tidak sembuh']),
        findQ(['berat badan anak anda turun']),
        findQ(['berat badan anak anda tidak naik']),
        findQ(['berkurang nafsu makan']),
        findQ(['serumah atau sering bertemu dengan orang yang menderita tuberkulosis'])
      ];
      const tbRiskValue = String(getValue(formData, findQ(['risiko tuberkulosis anak'])?.id)).toLowerCase();
      const hasTbRisk = tbSignals.some(isYes) || (tbRiskValue.includes('beresiko') && !tbRiskValue.includes('tidak'));
      const hasTbContact = [
        findQ(['serumah atau sering bertemu dengan orang yang menderita tuberkulosis']),
        findQ(['kontak serumah'])
      ].some(isYes);
      const isTbFollowUp = [
        'demam yang tidak diketahui',
        'pembesaran kelenjar',
        'pembengkakan tulang',
        'indurasi tes mantoux',
        'hasil tes mantoux',
        'hasil skoring tb'
      ].some(kw => t.includes(kw));
      if (t.includes('hasil skoring tb anak') && t.includes('dengan kontak') && !hasTbContact) return false;
      if (isTbFollowUp && !hasTbRisk) return false;

      const dmSignals = [
        findQ(['sering lapar', 'banyak makan']),
        findQ(['sering haus', 'banyak minum']),
        findQ(['sering pipis']),
        findQ(['sering mengompol']),
        findQ(['turun secara drastis']),
        findQ(['riwayat penyakit diabetes'])
      ];
      const hasDmRisk = dmSignals.some(isYes) || String(getValue(formData, findQ(['keluhan & gejala dm'])?.id)).toLowerCase().includes('ada keluhan');
      if (t.includes('pemeriksaan gula darah sewaktu') && !hasDmRisk) return false;

      const thalRisk = String(getValue(formData, findQ(['faktor risiko talasemia'])?.id)).toLowerCase().includes('ada faktor');
      const isThalLab = ['hemoglobin', 'mcv', 'mch', 'eritrosit', 'rbc count', 'rdw'].some(kw => t.includes(kw));
      if (isThalLab && findQ(['faktor risiko talasemia']) && !thalRisk) return false;
    }

    if (!isSchoolAgeCategory(kategoriUsia) && (t.includes('berapa kali') || t.includes('berapa menit')) && t.includes('olahraga')) {
      const routine = findQ(['rutin', 'olahraga']);
      if (routine && String(getValue(formData, routine.id)).toLowerCase() !== 'ya') return false;
    }

    const logic = q.conditional_logic;
    if (logic?.type === 'dependent' && logic.visible_always === false && logic.depends_on) {
      const triggered = questions.some((candidate) => {
        const candidateLogic = candidate.conditional_logic;
        return candidateLogic?.type === 'trigger' &&
          candidateLogic.category === logic.depends_on &&
          isFilled(formData, candidate.id);
      });
      if (!triggered) return false;
    }

    return true;
  };

  questions.forEach((q) => {
    if (isVisible(q)) visibleIds.add(q.id);
  });

  return visibleIds;
};

export const sanitizeFormDataForSchema = (schema, formData = {}, options = {}) => {
  if (!schema?.questions) return {};
  const allowedIds = options.posNumber
    ? getVisibleQuestionIdsForSchema(schema, formData, options)
    : new Set(schema.questions.map(q => q.id));
  return Object.fromEntries(
    Object.entries(formData).filter(([key]) => allowedIds.has(key))
  );
};
