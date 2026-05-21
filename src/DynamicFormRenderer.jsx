yimport { useState, useMemo, useEffect, useCallback, useRef } from 'react';

// ==========================================
// 🚀 THE MASTER ENGINE V22.2 (TENSI & MNA FIX)
// ==========================================

const SNELLEN_OPTIONS = [
  "Normal (visus 6/6 - 6/12)",
  "Gangguan penglihatan ringan (visus <6/12 - 6/18)",
  "Gangguan penglihatan sedang (visus <6/18 - 6/60)",
  "Gangguan penglihatan berat (visus <6/60 - 3/60)",
  "Buta (visus <3/60)"
];

const REGISTRY = {
  BLOCKED: ['nama faskes', 'nik', 'nisn', 'nama lengkap', 'tanggal lahir', 'jenis kelamin', 'status perkawinan', 'apabila belum menikah', 'tanggal pemeriksaan', 'kelas', 'nama sekolah', 'jenis sekolah', 'alamat'],
  POS2: ['berat badan', 'tinggi badan', 'panjang badan', 'lingkar kepala', 'lingkar betis', 'imt', 'index massa tubuh', 'tekanan darah', 'sistolik', 'diastolik', 'lingkar perut', 'lila', 'suhu', 'nadi', 'napas', 'gula darah', 'gds', 'gdp', 'hba1c', 'hb1ac', 'diabetes', 'dm', 'bb/u', 'pb/u', 'tb/u', 'bb/pb', 'bb/tb'],
  POS3: ['mata', 'visus', 'pupil', 'pinhole', 'kacamata', 'juling', 'penglihatan', 'daya lihat', 'e-tumbling', 'snellen', 'telinga', 'pendengaran', 'serumen', 'berbisik', 'dengar', 'otoskop', 'penala', 'gigi', 'karies', 'periodontal', 'goyang', 'mulut', 'jantung bawaan', 'empedu', 'ikterus', 'tinja'],
  POS4: ['kolesterol', 'ldl', 'hdl', 'trigliserida', 'asam urat', 'dislipidemia', 'hepatitis', 'hcv', 'hbsag', 'hiv', 'sifilis', 'malaria', 'transfusi', 'cuci darah', 'hemodialisa', 'kencing nanah', 'gonore', 'talasemia', 'hemoglobin', 'mcv', 'mch', 'eritrosit', 'rbc', 'rdw', 'shk', 'g6pd', 'hak', 'hipotiroid', 'adrenal kongenital'],
  POS6: ['minicog', 'mini-cog', 'menggambar jam', 'depresi', 'sdq', 'srq', 'emosi', 'khawatir', 'cemas', 'adl', 'ad-8', 'ad8', 'sppb', 'spbb', 'risiko jatuh', 'mna', 'mnasf', 'skilas', 'kognitif', 'kpsp', 'autisme', 'm-chat', 'kmpe', 'gpph', 'tantrum', 'impulsif', 'perilaku', 'mengingat', 'berkurang >3 kg', 'penurunan berat badan', 'berapa nilai imt', 'gangguan memori', 'klien/pasien lansia', 'membersihkan diri', 'keputusan', 'hobi', 'lupa nama bulan', 'mengatur keuangan', 'mengingat janji', 'nafsu makan', 'mobilitas', 'neuropsikologis', 'psikologis', 'berdiri dari kursi', 'keseimbangan', 'tandem', 'kecepatan berjalan', 'buang air besar', 'berkemih', 'jamban', 'makan dan minum', 'berbaring ke duduk', 'memakai baju', 'naik turun tangga', 'mandi', 'sedih', 'minat', 'kesenangan', 'puas dengan kehidupan', 'bosan', 'tidak berdaya', 'tidak berharga'],
  POS5_SPECIFIC: ['batuk', 'tb', 'tbc', 'tuberkulosis', 'keringat malam', 'demam', 'lesu', 'dahak', 'nafsu makan', 'mantoux', 'indurasi', 'pembesaran kelenjar', 'pembengkakan tulang', 'spirometri', 'puma', 'tcm', 'bta', 'skoring tb', 'sadanis', 'inspekulo', 'iva', 'dna hpv', 'ekg', 'bercak', 'putih mati rasa', 'kudis', 'skabies', 'koreng', 'gatal', 'kusta', 'frambusia', 'olahraga', 'merokok', 'alkohol', 'sayur', 'buah', 'narkoba', 'hubungan seksual', 'hubungan intim', 'aktif', 'terbangun', 'haus', 'lapar', 'mengompol', 'napas pendek']
};

const isSchoolAgeCategory = (value) => ['sd', 'smp', 'sma', 'anak/siswa'].includes(String(value || '').trim().toLowerCase());
const isEarlyChildCategory = (value) => ['bayi', 'balita'].includes(String(value || '').trim().toLowerCase());

const DynamicFormRenderer = ({ schema, formData, fullData, onChange, posNumber, primaryColor = 'indigo', kategoriUsia = '-' }) => {
  const [metodeGula, setMetodeGula] = useState('sewaktu');

  const allValidQuestions = useMemo(() => {
    if (!schema || !schema.questions) return [];
    
    let questionsWithVirtuals = [];
    [...schema.questions].sort((a, b) => a.column - b.column).forEach(q => {
        if (q.question_text.toLowerCase().includes('gula darah sewaktu')) {
            questionsWithVirtuals.push({ id: 'VIRTUAL_PUASA', question_text: 'Apakah Pasien Telah Berpuasa Minimal 8 Jam?', answer_type: 'yes_no', options: ['Ya', 'Tidak'], isVirtual: true });
        }
        questionsWithVirtuals.push(q);
    });

    if (posNumber === 5 && isSchoolAgeCategory(kategoriUsia)) {
        questionsWithVirtuals.push({
            id: 'VIRTUAL_FRAMBUSIA',
            question_text: 'Status skrining Frambusia',
            answer_type: 'select',
            options: ['Suspek', 'Bukan', 'Tidak'],
            isVirtual: true
        });
    }

    return questionsWithVirtuals.filter(q => {
        const txt = q.question_text.toLowerCase();
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
        const isP5Specific = REGISTRY.POS5_SPECIFIC.some(kw => txt.includes(kw));

        if (isBalitaTbFlow) {
          isP2 = false;
        }
        
        if (txt.includes('napas pendek')) isP2 = false;
        if (txt.includes('berkurang >3 kg') || txt.includes('penurunan berat badan') || txt.includes('berapa nilai imt')) isP2 = false;
        if (txt.includes('gangguan memori') || txt.includes('kunci kendaraan') || txt.includes('membersihkan diri')) isP3 = false;
        
        if (txt.includes('klien/pasien lansia') || txt.includes('mengingat tiga kata') || txt.includes('mendengarkan dengan cermat')) {
            isP2 = false;
            isP3 = false;
            isP4 = false;
        }
        
        if (isBalitaDmFlow) {
          isP2 = true;
        }

        if (posNumber === 2) return isP2;
        if (posNumber === 3) return isP3 && !isP2;
        if (posNumber === 4) return isP4 && !isP3 && !isP2;
        if (posNumber === 6) return (isP6 || isBalitaDevelopmentFlow) && !isP4 && !isP3 && !isP2 && !isBalitaTbFlow;
        if (posNumber === 5) return (isBalitaTbFlow || isP5Specific || q.id === 'VIRTUAL_FRAMBUSIA' || (!isP2 && !isP3 && !isP4 && !isP6 && !isBalitaDevelopmentFlow));

        return false;
    });
  }, [schema, posNumber, kategoriUsia]);

  const findQ = useCallback((keywords) => {
    return allValidQuestions.find(q => keywords.some(kw => q.question_text.toLowerCase().includes(kw)));
  }, [allValidQuestions]);

  const findGlobalQ = useCallback((keywords) => {
    if (!schema || !schema.questions) return null;
    return schema.questions.find(q => keywords.some(kw => q.question_text.toLowerCase().includes(kw)));
  }, [schema]);

  const getValue = useCallback((id) => (formData[id] || ''), [formData]);

  const getGlobalValue = useCallback((posKey, id) => {
    if (fullData && fullData[posKey] && fullData[posKey][id]) return fullData[posKey][id];
    return '';
  }, [fullData]);

  // DIAGNOSTIC AUTOMATION LOGIC (e.g. EKG from Pos 2 BP)
  const isHypertensionHistory = useMemo(() => {
    if (posNumber !== 5) return false;
    const sysId = findGlobalQ(['sistolik'])?.id;
    const diaId = findGlobalQ(['diastolik'])?.id;
    const htId = findGlobalQ(['tekanan darah tinggi', 'hipertensi'])?.id;
    
    let isHigh = false;
    if (sysId && diaId) {
       const sys = parseInt(getGlobalValue('pos2', sysId)) || 0;
       const dia = parseInt(getGlobalValue('pos2', diaId)) || 0;
       if (sys >= 140 || dia >= 90) isHigh = true;
    }
    const hasHistory = htId ? getGlobalValue('pos2', htId).toLowerCase() === 'ya' : false;
    return isHigh || hasHistory;
  }, [posNumber, findGlobalQ, getGlobalValue]);

  const qGDS = findQ(['gula darah sewaktu', 'gds']); 
  const qGDP = findQ(['gula darah puasa', 'gdp']);
  
  const qKolesterol = findQ(['kolesterol total']) || findQ(['kolesterol']);
  const qHdl = findQ(['hdl']);
  const qLdl = findQ(['ldl']);
  const qTrigliserida = findQ(['trigliserida']);
  const qAsamUrat = findQ(['asam urat']);
  
  const qIntKolesterol = findQ(['interpretasi kolesterol total']);
  const qIntHdl = findQ(['interpretasi hdl']);
  const qIntLdl = findQ(['interpretasi ldl']);
  const qIntTrigliserida = findQ(['interpretasi trigliserida']);
  const qIntDislipidemia = findQ(['interpretasi dislipidemia']);

  // Variabel untuk Automasi Analisa
  const qSgot = findQ(['nilai sgot']);
  const qTrombosit = findQ(['pemeriksaan trombosit']);
  const qApri = findQ(['hasil apri score']);
  
  const qLamaRokok = findQ(['lama (tahun) anda merokok', 'sudah berapa tahun anda merokok']);
  const qBatangRokok = findQ(['berapa batang rokok yang anda hisap']);
  const qDerajatRokok = findQ(['derajat merokok']);

  const qKreatinin = findQ(['hasil pemeriksaan kreatinin']);
  const qCkd = findQ(['e-lfg']);


  // Otomatisasi Profil Lipid
  useEffect(() => {
    if (qKolesterol && qIntKolesterol) {
      const val = parseInt(getValue(qKolesterol.id));
      if (!isNaN(val)) {
        let interpret = "Normal";
        if (val >= 240) interpret = "Tinggi";
        else if (val >= 200) interpret = "Ambang Batas Tinggi";
        if (getValue(qIntKolesterol.id) !== interpret) onChange(qIntKolesterol.id, interpret);
      } else if (getValue(qIntKolesterol.id)) onChange(qIntKolesterol.id, "");
    }
    if (qHdl && qIntHdl) {
      const val = parseInt(getValue(qHdl.id));
      if (!isNaN(val)) {
        let interpret = "Normal";
        if (val < 40) interpret = "Rendah";
        if (getValue(qIntHdl.id) !== interpret) onChange(qIntHdl.id, interpret);
      } else if (getValue(qIntHdl.id)) onChange(qIntHdl.id, "");
    }
    if (qLdl && qIntLdl) {
      const val = parseInt(getValue(qLdl.id));
      if (!isNaN(val)) {
        let interpret = "Optimal";
        if (val >= 160) interpret = "Tinggi";
        else if (val >= 130) interpret = "Ambang Batas Tinggi";
        else if (val >= 100) interpret = "Mendekati Optimal";
        if (getValue(qIntLdl.id) !== interpret) onChange(qIntLdl.id, interpret);
      } else if (getValue(qIntLdl.id)) onChange(qIntLdl.id, "");
    }
    if (qTrigliserida && qIntTrigliserida) {
      const val = parseInt(getValue(qTrigliserida.id));
      if (!isNaN(val)) {
        let interpret = "Normal";
        if (val >= 200) interpret = "Tinggi";
        else if (val >= 150) interpret = "Ambang Batas Tinggi";
        if (getValue(qIntTrigliserida.id) !== interpret) onChange(qIntTrigliserida.id, interpret);
      } else if (getValue(qIntTrigliserida.id)) onChange(qIntTrigliserida.id, "");
    }
    if (qIntDislipidemia) {
      const valK = parseInt(getValue(qKolesterol?.id));
      const valH = parseInt(getValue(qHdl?.id));
      const valL = parseInt(getValue(qLdl?.id));
      const valT = parseInt(getValue(qTrigliserida?.id));
      const isDislipidemia = valK >= 200 || valH < 40 || valL >= 130 || valT >= 150;
      const interpret = isDislipidemia ? "Dislipidemia" : "Normal";
      if (!isNaN(valK) || !isNaN(valH) || !isNaN(valL) || !isNaN(valT)) {
          if (getValue(qIntDislipidemia.id) !== interpret) onChange(qIntDislipidemia.id, interpret);
      } else if (getValue(qIntDislipidemia.id)) onChange(qIntDislipidemia.id, "");
    }
  }, [formData, qKolesterol, qHdl, qLdl, qTrigliserida, qIntKolesterol, qIntHdl, qIntLdl, qIntTrigliserida, qIntDislipidemia, onChange, getValue]);

  // Otomatisasi Skor APRI & Derajat Merokok
  useEffect(() => {
    // APRI Score
    if (qSgot && qTrombosit && qApri) {
      const sgot = parseFloat(getValue(qSgot.id));
      const tromboRaw = parseFloat(getValue(qTrombosit.id));
      if (!isNaN(sgot) && !isNaN(tromboRaw) && tromboRaw > 0) {
        // Trombosit biasanya 150000 atau 150 (dalam 10^9/L)
        const trombo = tromboRaw > 2000 ? tromboRaw / 1000 : tromboRaw;
        const apriScore = ((sgot / 40) / trombo) * 100;
        const result = apriScore.toFixed(2);
        if (getValue(qApri.id) !== result) onChange(qApri.id, result);
      } else if (getValue(qApri.id)) {
        onChange(qApri.id, '');
      }
    }

    // Derajat Merokok
    if (qLamaRokok && qBatangRokok && qDerajatRokok) {
      const lama = parseInt(getValue(qLamaRokok.id)) || 0;
      const batang = parseInt(getValue(qBatangRokok.id)) || 0;
      if (lama > 0 && batang > 0) {
        const indeks = lama * batang;
        let derajat = 'Ringan';
        if (indeks > 600) derajat = 'Berat';
        else if (indeks >= 200) derajat = 'Sedang';
        if (getValue(qDerajatRokok.id) !== derajat) onChange(qDerajatRokok.id, derajat);
      } else if (getValue(qDerajatRokok.id)) {
        onChange(qDerajatRokok.id, '');
      }
    }

    // e-LFG (CKD-EPI)
    if (qKreatinin && qCkd) {
      const scr = parseFloat(getValue(qKreatinin.id));
      const age = parseInt(fullData?.umur_saat_periksa) || 0;
      const jk = fullData?.pasien_snapshot?.j_kelamin || 'L';
      
      if (!isNaN(scr) && scr > 0 && age > 0) {
        const kappa = jk === 'P' ? 0.7 : 0.9;
        const alpha = jk === 'P' ? -0.241 : -0.302;
        const femaleMult = jk === 'P' ? 1.012 : 1;
        
        const minRatio = Math.min(scr / kappa, 1);
        const maxRatio = Math.max(scr / kappa, 1);
        
        const egfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * femaleMult;
        let ckdInterp;
        if (egfr >= 90) ckdInterp = 'G1 (Normal)';
        else if (egfr >= 60) ckdInterp = 'G2 (Turun Ringan)';
        else if (egfr >= 45) ckdInterp = 'G3a (Ringan-Sedang)';
        else if (egfr >= 30) ckdInterp = 'G3b (Sedang-Berat)';
        else if (egfr >= 15) ckdInterp = 'G4 (Berat)';
        else ckdInterp = 'G5 (Gagal Ginjal)';

        const result = `${egfr.toFixed(1)} ml/min/1.73m² (${ckdInterp})`;
        if (getValue(qCkd.id) !== result) onChange(qCkd.id, result);
      } else if (getValue(qCkd.id)) {
        onChange(qCkd.id, '');
      }
    }
  }, [formData, fullData, qSgot, qTrombosit, qApri, qLamaRokok, qBatangRokok, qDerajatRokok, qKreatinin, qCkd, onChange, getValue]);

  useEffect(() => {
    if (posNumber !== 2) return;
    if (qGDP && getValue(qGDP.id) && (!qGDS || !getValue(qGDS.id))) setMetodeGula('puasa');
    if (qGDS && getValue(qGDS.id)) setMetodeGula('sewaktu');
  }, [posNumber, qGDS, qGDP, getValue]);

  useEffect(() => {
    // A. AUTO IMT
    const qBB = findQ(['berat badan']); const qTB = findQ(['tinggi badan']); const qIMT = findQ(['index massa tubuh', 'imt']);
    if (qBB && qTB && qIMT) {
      const bb = parseFloat(getValue(qBB.id)); const tb = parseFloat(getValue(qTB.id));
      if (bb > 0 && tb > 0) {
        const tbMeter = tb / 100; 
        const imtRawVal = bb / (tbMeter * tbMeter);
        const imtVal = imtRawVal.toFixed(1);
        let status = "NORMAL";
        if (imtRawVal < 18.5) status = "KURUS"; else if (imtRawVal >= 25 && imtRawVal <= 29.9) status = "GEMUK"; else if (imtRawVal >= 30) status = "OBESITAS";
        const finalImtString = `${imtVal} (${status})`;
        if (formData[qIMT.id] !== finalImtString) onChange(qIMT.id, finalImtString);
      }
    }

    // B. AUTO TENSI EVALUATOR (BUG FIXED)
    const qSys = findQ(['sistolik']); const qDia = findQ(['diastolik']); const qBpResult = findQ(['hasil tekanan darah']);
    if (qSys && qDia && qBpResult) {
      const sys = parseInt(getValue(qSys.id)) || 0; const dia = parseInt(getValue(qDia.id)) || 0;
      if (sys > 0 && dia > 0) {
        let res = "";
        if (sys < 120 && dia < 80) res = "Sistol <120 / Diastol <80";
        else if (sys <= 129 && dia <= 84) res = "Sistol 120-129 / Diastol 80-84";
        else if (sys <= 139 && dia <= 89) res = "Sistol 130-139 / Diastol 85-89";
        else if (sys <= 159 && dia <= 99) res = "Sistol 140-159 / Diastol 90-99";
        else if (sys <= 179 && dia <= 109) res = "Sistol 160-179 / Diastol 100-109";
        else if (sys >= 180 || dia >= 110) res = "Sistol >=180 / Diastol >= 110";
        if (res && formData[qBpResult.id] !== res) {
           const optMatch = qBpResult.options.find(o => o.includes(res));
           if (optMatch) onChange(qBpResult.id, optMatch);
        }
      } else {
        if (formData[qBpResult.id] !== '') onChange(qBpResult.id, '');
      }
    }

    // C. LOGIKA BERJENJANG VISUS
    const qTumbKanan = findQ(['e-tumbling', 'mata kanan', 'visus mata kanan']) || findQ(['e-tumbling']);
    const qSnellKanan = findQ(['snellen chart', 'mata kanan', 'snellen']);
    if (qTumbKanan && qSnellKanan && getValue(qTumbKanan.id).toLowerCase().includes('normal')) {
        if (formData[qSnellKanan.id] !== SNELLEN_OPTIONS[0]) onChange(qSnellKanan.id, SNELLEN_OPTIONS[0]);
    }
    const qTumbKiri = findQ(['e-tumbling', 'mata kiri', 'visus mata kiri']);
    const qSnellKiri = findQ(['snellen chart', 'mata kiri']);
    if (qTumbKiri && qSnellKiri && getValue(qTumbKiri.id).toLowerCase().includes('normal')) {
        if (formData[qSnellKiri.id] !== SNELLEN_OPTIONS[0]) onChange(qSnellKiri.id, SNELLEN_OPTIONS[0]);
    }
  }, [formData, findQ, getValue, onChange]);

  useEffect(() => {
    if (!isEarlyChildCategory(kategoriUsia)) return;
    const allQuestions = schema?.questions || [];
    const findAny = (keywords) => allQuestions.find(q => keywords.some(kw => String(q.question_text || '').toLowerCase().includes(kw)));
    const isYes = (q) => q && String(getValue(q.id)).toLowerCase() === 'ya';
    const setIfDifferent = (q, value) => {
      if (q && value && getValue(q.id) !== value) onChange(q.id, value);
    };

    const tbSignals = [
      findAny(['batuk yang tidak sembuh']),
      findAny(['berat badan anak anda turun']),
      findAny(['berat badan anak anda tidak naik']),
      findAny(['berkurang nafsu makan']),
      findAny(['serumah atau sering bertemu dengan orang yang menderita tuberkulosis'])
    ];
    const qTbRisk = findAny(['risiko tuberkulosis anak']);
    if (qTbRisk && tbSignals.some(q => getValue(q?.id))) {
      setIfDifferent(qTbRisk, tbSignals.some(isYes) ? 'Beresiko' : 'Tidak beresiko');
    }

    const thalSignals = [
      findAny(['menderita talasemia', 'kelainan darah']),
      findAny(['pembawa sifat talasemia'])
    ];
    const qThalRisk = findAny(['faktor risiko talasemia']);
    if (qThalRisk && thalSignals.some(q => getValue(q?.id))) {
      setIfDifferent(qThalRisk, thalSignals.some(isYes) ? 'Ada faktor risiko' : 'Tidak ada faktor risiko');
    }

    const dmSignals = [
      findAny(['sering lapar', 'banyak makan']),
      findAny(['sering haus', 'banyak minum']),
      findAny(['sering pipis']),
      findAny(['sering mengompol']),
      findAny(['turun secara drastis']),
      findAny(['riwayat penyakit diabetes'])
    ];
    const qDmRisk = findAny(['keluhan & gejala dm']);
    if (qDmRisk && dmSignals.some(q => getValue(q?.id))) {
      setIfDifferent(qDmRisk, dmSignals.some(isYes) ? 'Ada keluhan/gejala DM' : 'Tidak ada keluhan/gejala DM');
    }

    const tbContact = findAny(['serumah atau sering bertemu dengan orang yang menderita tuberkulosis']);
    const tbScore = findAny(['hasil skoring tb anak']);
    if (tbContact && tbScore && isYes(tbContact)) {
      const activeSignals = [
        [findAny(['batuk yang tidak sembuh']), 'batuk >2 minggu'],
        [findAny(['berat badan anak anda turun']), 'BB turun'],
        [findAny(['berat badan anak anda tidak naik']), 'BB tidak naik'],
        [findAny(['berkurang nafsu makan']), 'nafsu makan turun'],
        [findAny(['demam yang tidak diketahui']), 'demam >=2 pekan'],
        [findAny(['pembesaran kelenjar']), 'pembesaran kelenjar'],
        [findAny(['pembengkakan tulang']), 'pembengkakan tulang/sendi'],
        [findAny(['hasil tes mantoux']), `Mantoux: ${getValue(findAny(['hasil tes mantoux'])?.id)}`]
      ].filter(([q]) => q && (isYes(q) || getValue(q.id)));
      const summary = activeSignals.length
        ? `Kontak TB: Ya; indikator: ${activeSignals.map(([, label]) => label).join(', ')}`
        : 'Kontak TB: Ya; lengkapi indikator skoring TB anak';
      setIfDifferent(tbScore, summary);
    }
  }, [formData, schema, kategoriUsia, getValue, onChange]);

  useEffect(() => {
    if (schema?.sheet_name !== 'BBL') return;
    const allQuestions = schema?.questions || [];
    const findAny = (keywords) => allQuestions.find(q => keywords.every(kw => String(q.question_text || '').toLowerCase().includes(kw)));
    const findLoose = (keywords) => allQuestions.find(q => keywords.some(kw => String(q.question_text || '').toLowerCase().includes(kw)));
    const setIfDifferent = (q, value) => {
      if (q && value && getValue(q.id) !== value) onChange(q.id, value);
    };
    const isPositive = (q) => String(getValue(q?.id)).toLowerCase().includes('positif');

    const rightPulse = parseFloat(getValue(findLoose(['pjb1', 'tangan kanan'])?.id));
    const footPulse = parseFloat(getValue(findLoose(['pjb2', 'kaki'])?.id));
    const qPjbResult = findAny(['hasil pemeriksaan penyakit jantung bawaan']);
    if (!Number.isNaN(rightPulse) && !Number.isNaN(footPulse) && qPjbResult) {
      const pjbStatus = rightPulse >= 95 && footPulse >= 95 && Math.abs(rightPulse - footPulse) <= 3 ? 'Normal' : 'Abnormal';
      setIfDifferent(qPjbResult, pjbStatus);
    }

    const qShkLab = findLoose(['hipotiroid kongenital']);
    const qG6pdLab = findAny(['laboratorium', 'g6pd']);
    const qHakLab = findAny(['hiperplasia adrenal kongenital']);
    const qShkAsk = findLoose(['konfrimasi shk', 'konfirmasi shk']);
    const qG6pdAsk = findAny(['konfirmasi', 'g6pd']);
    const qHakAsk = findAny(['konfirmasi', 'hak']);
    setIfDifferent(qShkAsk, isPositive(qShkLab) ? 'Ya' : getValue(qShkLab?.id) ? 'Tidak' : '');
    setIfDifferent(qG6pdAsk, isPositive(qG6pdLab) ? 'Ya' : getValue(qG6pdLab?.id) ? 'Tidak' : '');
    setIfDifferent(qHakAsk, isPositive(qHakLab) ? 'Ya' : getValue(qHakLab?.id) ? 'Tidak' : '');
  }, [formData, schema, getValue, onChange]);

  useEffect(() => {
    const allQuestions = schema?.questions || [];
    const findAny = (keywords) => allQuestions.find(q => keywords.every(kw => String(q.question_text || '').toLowerCase().includes(kw)));
    const findLoose = (keywords) => allQuestions.find(q => keywords.some(kw => String(q.question_text || '').toLowerCase().includes(kw)));
    const setIfDifferent = (q, value) => {
      if (q && value && getValue(q.id) !== value) onChange(q.id, value);
    };
    const dayFromValue = (value) => {
      const match = String(value || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    };
    const durationMinutes = (value) => {
      const text = String(value || '').toLowerCase();
      if (text.includes('<10')) return 5;
      if (text.includes('60')) return 60;
      if (text.includes('30')) return 45;
      if (text.includes('10')) return 20;
      return null;
    };

    if (isSchoolAgeCategory(kategoriUsia)) {
      const recent = findAny(['7 hari terakhir', 'aktif', '60']);
      const usual = findAny(['biasanya', 'aktif', '60']);
      const recentDays = dayFromValue(getValue(recent?.id));
      const usualDays = dayFromValue(getValue(usual?.id));
      const conservativeDays = Math.min(recentDays ?? 7, usualDays ?? 7);
      if (recent && usual && recentDays !== null && usualDays !== null) {
        const status = conservativeDays >= 5 ? 'Aktif sesuai anjuran anak' : conservativeDays >= 3 ? 'Cukup aktif, perlu ditingkatkan' : 'Kurang aktif';
        onChange('VIRTUAL_AKTIVITAS_ANAK_STATUS', status);
      }
      return;
    }

    const routine = findAny(['rutin', 'olahraga']);
    const frequency = findAny(['berapa kali', 'berolahraga']);
    const duration = findAny(['berapa menit', 'olahraga']);
    const level = findLoose(['tingkat aktivitas fisik']);
    if (!routine || !level) return;

    const routineValue = String(getValue(routine.id)).toLowerCase();
    if (routineValue === 'tidak') {
      setIfDifferent(level, 'Tidak aktif');
      return;
    }

    const freq = dayFromValue(getValue(frequency?.id));
    const minutes = durationMinutes(getValue(duration?.id));
    if (routineValue === 'ya' && freq !== null && minutes !== null) {
      const total = freq * minutes;
      const isOlder = String(kategoriUsia || '').includes('60') || String(schema?.sheet_name || '').includes('60') || String(schema?.sheet_name || '').includes('70');
      if (isOlder) {
        setIfDifferent(level, total >= 150 ? 'Aktif sesuai kemampuan' : total >= 90 ? 'Cukup aktif' : 'Kurang aktif');
      } else if (total >= 300) {
        setIfDifferent(level, 'Sangat aktif (>=300 menit/minggu)');
      } else if (total >= 150) {
        setIfDifferent(level, 'Cukup aktif (>=150 menit/minggu)');
      } else {
        setIfDifferent(level, 'Kurang aktif (<150 menit/minggu)');
      }
    }
  }, [formData, schema, kategoriUsia, getValue, onChange]);

  useEffect(() => {
    const allQuestions = schema?.questions || [];
    const findAny = (keywords) => allQuestions.find(q => keywords.every(kw => String(q.question_text || '').toLowerCase().includes(kw)));
    const setIfDifferent = (q, value) => {
      if (q && value && getValue(q.id) !== value) onChange(q.id, value);
    };

    const qApcsSmoke = findAny(['riwayat merokok', 'apcs']);
    if (qApcsSmoke) {
      const active = findAny(['merokok dalam setahun terakhir']);
      const years = findAny(['sudah berapa tahun', 'merokok']);
      const sticks = findAny(['batang rokok']);
      const former = findAny(['pernah merokok sebelumnya']);
      const exposed = findAny(['terpapar asap rokok']);
      const parts = [];
      if (getValue(active?.id)) parts.push(`Merokok setahun terakhir: ${getValue(active.id)}`);
      if (getValue(years?.id)) parts.push(`lama aktif: ${getValue(years.id)} tahun`);
      if (getValue(sticks?.id)) parts.push(`batang/hari: ${getValue(sticks.id)}`);
      if (getValue(former?.id)) parts.push(`pernah merokok: ${getValue(former.id)}`);
      if (getValue(exposed?.id)) parts.push(`paparan asap: ${getValue(exposed.id)}`);
      if (parts.length) setIfDifferent(qApcsSmoke, parts.join('; '));
    }

    const qLungCancer = findAny(['skrining kanker paru']);
    if (qLungCancer) {
      const smokingHistory = findAny(['sedang/mempunyai riwayat merokok']);
      const packYears = parseFloat(getValue(findAny(['bungkus per tahun'])?.id));
      const exposureScore = parseFloat(getValue(findAny(['riwayat merokok/paparan asap rokok'])?.id));
      const homeEnv = String(getValue(findAny(['lingkungan dalam rumah'])?.id)).toLowerCase();
      const areaEnv = String(getValue(findAny(['lingkungan tempat tinggal'])?.id)).toLowerCase();
      const riskFactors = [];
      if (String(getValue(smokingHistory?.id)).toLowerCase() === 'ya') riskFactors.push('riwayat merokok');
      if (!Number.isNaN(packYears) && packYears > 0) riskFactors.push(`${packYears} bungkus-tahun`);
      if (!Number.isNaN(exposureScore) && exposureScore > 0) riskFactors.push(`skor paparan ${exposureScore}`);
      if (areaEnv.includes('berpotensi tinggi')) riskFactors.push('lingkungan tempat tinggal berisiko');
      if (homeEnv.includes('tidak sehat')) riskFactors.push('lingkungan rumah tidak sehat');
      if (riskFactors.length) {
        setIfDifferent(qLungCancer, `Ada faktor risiko kanker paru: ${riskFactors.join(', ')}`);
      } else {
        const hasAnyInput = [smokingHistory, findAny(['bungkus per tahun']), findAny(['riwayat merokok/paparan asap rokok']), findAny(['lingkungan dalam rumah']), findAny(['lingkungan tempat tinggal'])]
          .some(q => getValue(q?.id));
        if (hasAnyInput) setIfDifferent(qLungCancer, 'Tidak ada faktor risiko kanker paru utama dari jawaban skrining');
      }
    }
  }, [formData, schema, getValue, onChange]);

  const getThemeColor = () => {
      if (primaryColor === 'rose') return 'bg-[#e11d48] border-[#e11d48]'; 
      if (primaryColor === 'purple') return 'bg-[#9333ea] border-[#9333ea]'; 
      if (primaryColor === 'emerald') return 'bg-[#059669] border-[#059669]'; 
      if (primaryColor === 'fuchsia') return 'bg-[#d946ef] border-[#d946ef]'; 
      if (primaryColor === 'blue') return 'bg-[#2563eb] border-[#2563eb]';
      return 'bg-[#4f46e5] border-[#4f46e5]';
  };

  const parseOption = (text) => {
    const t = text.toLowerCase();
    if (t.includes('visus <6/12 - 6/18')) return "Gg. Ringan";
    if (t.includes('visus <6/18 - 6/60')) return "Gg. Sedang";
    if (t.includes('visus <6/60 - 3/60')) return "Gg. Berat";
    if (t.includes('visus <3/60')) return "⚠️ Buta";
    if (t.includes('visus 6/6 - 6/12')) return "Normal";
    if (t.includes('non reaktif') || t.includes('negatif')) return text.length > 15 ? text : "NEGATIF";
    if (t.includes('reaktif') || t.includes('positif')) return text.length > 15 ? `⚠️ ${text}` : "⚠️ POSITIF";
    
    if (t.includes('lebih dari 3 kali seminggu')) return "Sering (>3x/mgg)";
    if (t.includes('1-2 kali seminggu')) return "Kadang (1-2x/mgg)";
    if (t.includes('tidak pernah')) return "Tidak Pernah";
    if (t.includes('lebih dari separuh waktu')) return "> Separuh Wkt";
    if (t.includes('hampir setiap hari')) return "Tiap Hari";
    if (t.includes('beberapa hari')) return "Bbrp Hari";
    if (/^[0-7] hari$/.test(t)) return text;
    if (/^[0-7] kali/.test(t)) return text;
    if (t.includes('tidak aktif')) return "Tidak Aktif";
    if (t.includes('kurang aktif')) return "Kurang Aktif";
    if (t.includes('cukup aktif')) return "Cukup Aktif";
    if (t.includes('sangat aktif')) return "Sangat Aktif";
    if (t.includes('aktif sesuai kemampuan')) return "Sesuai Kemampuan";
    
    return text;
  };

  const parseQuestion = (text, usia) => {
    const t = text.toLowerCase();
    const isBalita = isEarlyChildCategory(usia);
    const isSchoolAge = isSchoolAgeCategory(usia);

    if (t.includes('bungkus per tahun')) return "Riwayat Merokok: Bungkus per Tahun";
    if (t.includes('berapa lama') && t.includes('merokok sebelumnya')) return "Lama Riwayat Merokok Dulu (Tahun)";
    if (t.includes('sudah berapa tahun') && t.includes('merokok')) return "Lama Merokok Saat Ini (Tahun)";
    if (t.includes('lama') && t.includes('tahun') && t.includes('merokok')) return "Lama Merokok (Tahun)";
    if (t.includes('kapan') && t.includes('berhenti merokok')) return "Tahun Berhenti Merokok";
    if (t.includes('batang rokok')) return "Jumlah Batang Rokok per Hari";
    if (t.includes('pernah merokok sebelumnya')) return "Pernah Merokok Sebelumnya?";
    if (t.includes('terpapar asap rokok')) return "Terpapar Asap Rokok?";
    if (t.includes('riwayat merokok/paparan asap rokok')) return "Skor Paparan Rokok";
    if (t.includes('riwayat merokok') && t.includes('apcs')) return "Ringkasan Riwayat Merokok APCS";
    if (t.includes('merokok') || t.includes('asap rokok')) {
        return isBalita ? "Ada Keluarga Serumah Merokok?" : "Pasien Perokok / Terpapar Asap?";
    }
    if (t.includes('berapa kali') && t.includes('berolahraga')) return isSchoolAge ? "Frekuensi Aktivitas Fisik" : "Frekuensi Olahraga per Minggu";
    if (t.includes('berapa menit') && t.includes('olahraga')) return isSchoolAge ? "Durasi Aktivitas Fisik" : "Durasi per Sesi Olahraga";
    if (t.includes('tingkat aktivitas fisik')) return isSchoolAge ? "Status Aktivitas Fisik Anak" : "Interpretasi Aktivitas Fisik";
    if (t.includes('olahraga') || t.includes('aktivitas fisik')) {
        if (isBalita) return "Motorik Kasar: Aktif / Bisa Jalan?";
        if (isSchoolAge) return "Aktivitas Fisik Anak / Siswa";
        return "Rutin Olahraga / Aktivitas Fisik?";
    }
    if (isSchoolAge && t.includes('dalam 7 hari terakhir') && t.includes('aktif') && t.includes('60')) return "Aktif 60 Menit: 7 Hari Terakhir";
    if (isSchoolAge && t.includes('biasanya dalam satu minggu') && t.includes('aktif') && t.includes('60')) return "Aktif 60 Menit: Minggu Biasa";
    if (isSchoolAge && t.includes('masalah pada tulang dan sendi')) return "Batasan Aktivitas: Tulang/Sendi?";
    if (isSchoolAge && t.includes('masalah pada jantung')) return "Batasan Aktivitas: Jantung?";
    if (isSchoolAge && t.includes('asma') && t.includes('latihan fisik')) return "Asma Saat Aktivitas Fisik?";
    if (isSchoolAge && t.includes('pingsan karena aktivitas berat')) return "Pingsan/Sakit Kepala Saat Aktivitas?";
    if (t.includes('koreng') && (t.includes('kudis') || t.includes('gatal'))) return "Skabies: Koreng/Ruam/Kudis Bergerombol & Gatal Malam?";
    if (t.includes('frambusia')) return "Frambusia";
    if (t.includes('gula darah puasa') || t.includes('gdp')) return "Gula Darah Puasa (GDP)";
    if (t.includes('gula darah sewaktu') || t.includes('gds')) return "Gula Darah Sewaktu (GDS)";
    if (t === 'bb/u') return "Status BB/U";
    if (t.includes('pb/u') || t.includes('tb/u')) return "Status PB/U atau TB/U";
    if (t.includes('bb/pb') || t.includes('bb/tb')) return "Status BB/PB atau BB/TB";
    if (t.includes('risiko tuberkulosis anak')) return "Interpretasi Risiko TB Anak";
    if (t.includes('faktor risiko talasemia')) return "Interpretasi Risiko Talasemia";
    if (t.includes('keluhan & gejala dm')) return "Interpretasi Gejala DM";
    if (t.includes('sering tantrum')) return "Perilaku/Emosi: Tantrum atau Emosi Mengganggu?";
    if (t.includes('tidak bisa duduk tenang')) return "GPPH: Hiperaktif atau Impulsif?";
    if (t.includes('menderita talasemia') || t.includes('kelainan darah')) return "Keluarga Kandung Talasemia/Transfusi Rutin?";
    if (t.includes('pembawa sifat talasemia')) return "Keluarga Pembawa Sifat Talasemia?";
    if (t.includes('sering lapar') || t.includes('banyak makan')) return "Sering Lapar/Banyak Makan?";
    if (t.includes('sering haus') || t.includes('banyak minum')) return "Sering Haus/Banyak Minum?";
    if (t.includes('sering pipis')) return "Sering Pipis?";
    if (t.includes('sering mengompol')) return "Sering Mengompol?";
    if (t.includes('turun secara drastis')) return "BB Turun Drastis?";
    if (t.includes('riwayat penyakit diabetes')) return "Orang Tua Riwayat Diabetes?";
    if (t.includes('kmpe')) return "Hasil KMPE";
    if (t.includes('gpph')) return "Hasil GPPH";

    if (t.includes('lingkar betis')) return "Lingkar Betis (Alternatif IMT)";
    if (t.includes('selaput mata merah atau kornea keruh') && t.includes('kanan')) return "Mata Kanan: Kelainan Luar?";
    if (t.includes('selaput mata merah atau kornea keruh') && t.includes('kiri')) return "Mata Kiri: Kelainan Luar?";
    if (t.includes('selaput mata merah atau kornea keruh')) return "Kelainan Mata Luar (Merah/Keruh/Juling)?";
    if (t.includes('e-tumbling') && t.includes('kanan')) return "Visus KANAN (E-Tumb/Jari)";
    if (t.includes('e-tumbling') && t.includes('kiri')) return "Visus KIRI (E-Tumb/Jari)";
    if (t.includes('e-tumbling') || t.includes('visus mata')) return "Visus Dasar (E-Tumbling / Hitung Jari)";
    if (t.includes('snellen chart') && t.includes('kanan')) return "Snellen Lanjutan (Kanan)";
    if (t.includes('snellen chart') && t.includes('kiri')) return "Snellen Lanjutan (Kiri)";
    if (t.includes('snellen chart')) return isSchoolAge ? "Snellen Chart" : "Hasil Tes Lanjutan (Snellen Chart)";
    if (t.includes('otoskop dan/atau penala')) return "Pemeriksaan Telinga (Otoskop / Penala)";
    if (t.includes('tajam pendengaran')) return "Tes Bisik Pendengaran";
    if (t.includes('serumen impaksi')) return "Ada Kotoran Telinga (Serumen Impaksi)?";
    if (t.includes('gigi karies') || t.includes('berlubang')) return "Gigi Karies / Berlubang?";
    if (t.includes('gigi hilang')) return "Ada Gigi Hilang / Dicabut?";
    if (t.includes('periodontal')) return "Pocket Periodontal (Penyakit Gusi)?";
    if (t.includes('batuk yang tidak sembuh')) return "Batuk Lama > 2 Minggu?";
    if (t.includes('serumah atau sering bertemu dengan orang yang menderita tuberkulosis')) return "Kontak Serumah Penderita TB?";
    if (t.includes('napas pendek ketika berjalan')) return "Napas Pendek Saat Jalan Cepat/Menanjak?";
    if (t.includes('tes untuk hepatitis b dan mendapatkan hasil positif')) return "Pernah Tes Hepatitis B Positif?";

    // Mental Health (Skrining Jiwa)
    if (t.includes('kurang berminat atau bergairah')) return "1. Kurang berminat / bergairah?";
    if (t.includes('merasa murung, sedih, atau putus asa')) return "2. Merasa murung / sedih / putus asa?";
    if (t.includes('merasa gugup, cemas, atau tegang')) return "3. Merasa gugup / cemas / tegang?";
    if (t.includes('tidak mampu menahan atau mengendalikan kekhawatiran')) return "4. Sulit mengendalikan rasa khawatir?";

    return text;
  };

  const formatQuestionText = (text, usia) => {
    const cleaned = String(text || '')
      .replace(/^"+|"+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.length > 170 ? parseQuestion(cleaned, usia) : cleaned;
  };

  const isFilled = (id) => Boolean(String(getValue(id) || '').trim());

  const isYesValue = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'ya' || normalized === 'yes' || normalized.includes('positif') || normalized.includes('reaktif');
  };

  const isNoValue = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'tidak' || normalized === 'tdk' || normalized === 'no' || normalized.includes('negatif') || normalized.includes('non reaktif');
  };


  const VoiceInput = ({ value, onChange, placeholder, type="text", inputMode }) => {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState("");
    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);
    const valueRef = useRef(value);

    useEffect(() => {
       valueRef.current = value;
    }, [value]);

    useEffect(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true; 
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event) => {
          let currentFinal = "";
          let currentInterim = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript + " ";
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          
          if (currentFinal) {
             const prevVal = valueRef.current ? valueRef.current.trim() + " " : "";
             const newVal = prevVal + currentFinal.trim();
             valueRef.current = newVal;
             onChange(newVal);
          }
          setInterimText(currentInterim);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed' || event.error === 'network') {
              isListeningRef.current = false;
              setIsListening(false);
          }
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
             try { recognition.start(); } 
             catch(e) { 
               console.warn("Gagal melanjutkan voice input:", e);
               isListeningRef.current = false; 
               setIsListening(false); 
             }
          } else {
             setIsListening(false);
             setInterimText("");
          }
        };
        
        recognitionRef.current = recognition;
      }
      
      return () => {
         if (recognitionRef.current) {
            recognitionRef.current.onend = null; 
            recognitionRef.current.stop();
         }
      };
    }, [onChange]);

    const toggleListen = () => {
      if (isListeningRef.current) {
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current?.stop();
        setInterimText("");
      } else {
        if (recognitionRef.current) {
          try {
            isListeningRef.current = true;
            setIsListening(true);
            recognitionRef.current.start();
          } catch(e) {
            console.error(e);
          }
        } else {
          alert("Browser Anda tidak mendukung fitur Voice Recognition.");
        }
      }
    };

    const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const displayValue = isListening && interimText ? (value ? value + " " + interimText : interimText) : value;

    return (
      <div className="relative mt-2 flex w-full items-center">
        <input 
          type={type} 
          value={displayValue || ''} 
          onChange={e => {
              onChange(e.target.value);
              if (isListeningRef.current) toggleListen(); 
          }}
          required={false} 
          placeholder={isListening ? "Mendengarkan... (bisa jeda/napas)" : placeholder}
          inputMode={inputMode}
          className={`w-full bg-white border font-bold text-xs py-4 pl-4 pr-12 rounded-xl outline-none focus:ring-2 shadow-sm transition-all ${isListening ? 'border-rose-500 ring-2 ring-rose-200 placeholder-rose-400 text-rose-700' : 'border-slate-200 text-slate-800'}`}
        />
        {isSupported && (
            <button 
               type="button" 
               onClick={toggleListen}
               className={`absolute right-2 p-2.5 rounded-lg transition-all shadow-sm ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
               title={isListening ? "Matikan Mic" : "Mulai Bicara"}
            >
               {isListening ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="5" width="10" height="10" /></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-2a5 5 0 01-10 0H3a7.001 7.001 0 006 6.93V17H6v2h8v-2h-3v-2z" clipRule="evenodd" /></svg>
               )}
            </button>
        )}
      </div>
    );
  };

  const CustomToggle = ({ question, options=[], variant = "segmented" }) => {
      const val = getValue(question.id);
      const hasLongOption = options.some(opt => parseOption(opt).length > 18);

      if (variant === "radio") {
        return (
          <div className="mt-4 space-y-3">
            {options.map((opt, i) => {
              const isActive = val === opt;
              const visualText = parseOption(opt);
              const isWarning = String(opt).toLowerCase().includes('abnormal') || String(opt).toLowerCase().includes('positif') || String(opt).toLowerCase().includes('karies') || String(opt).toLowerCase().includes('buruk') || String(opt).toLowerCase() === 'ya';
              const dotClass = isActive
                ? (isWarning ? 'border-rose-500 bg-rose-500' : 'border-emerald-500 bg-emerald-500')
                : 'border-slate-200 bg-white';
              return (
                <label key={i} className={`flex items-start gap-3 rounded-xl px-2 py-1.5 transition-all cursor-pointer ${isActive ? 'text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" name={question.id} value={opt} checked={isActive} onChange={(e) => onChange(question.id, e.target.value)} className="sr-only" required={false} />
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 shadow-sm ${dotClass}`}>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="min-w-0 text-sm font-bold leading-snug break-words">{visualText}</span>
                </label>
              );
            })}
          </div>
        );
      }
      
      return (
          <div className={`${hasLongOption ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex'} bg-slate-50/50 rounded-xl p-1 border border-slate-200 w-full mt-2 shadow-sm gap-1`}>
            {options.map((opt, i) => {
              const isWarning = opt.toLowerCase().includes('abnormal') || opt.toLowerCase().includes('positif') || opt.toLowerCase().includes('karies') || opt.toLowerCase().includes('buruk') || opt.toLowerCase().includes('ya');
              const activeClass = isWarning ? 'bg-rose-500 text-white shadow-md border-transparent' : `${getThemeColor()} text-white shadow-md border-transparent`;
              const isActive = val === opt;
              return (
                <button key={i} type="button" onClick={() => onChange(question.id, opt)} 
                  className={`min-w-0 flex-1 py-3.5 px-2 rounded-lg text-[11px] font-black ${hasLongOption ? 'normal-case tracking-normal leading-snug text-left' : 'uppercase tracking-wide'} transition-all break-words ${isActive ? activeClass : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                  {parseOption(opt)}
                </button>
              );
            })}
          </div>
      );
  }

  const getNormalValue = (question, customOptions = null) => {
    const safeOptions = customOptions || (Array.isArray(question.options) ? question.options : []);
    if (safeOptions.length === 0) return null;
    const questionText = String(question.question_text || '').toLowerCase();

    if (questionText.includes('pupil')) {
      return safeOptions.find(opt => String(opt).toLowerCase() === 'normal') || null;
    }

    if (safeOptions.some(opt => String(opt).toLowerCase() === 'ya') && safeOptions.some(opt => String(opt).toLowerCase() === 'tidak')) {
      const normalIsYes = [
        'dapat mengingat',
        'peserta dapat',
        'mampu',
        'bisa',
        'aktif secara fisik',
        'berpuasa minimal'
      ].some(keyword => questionText.includes(keyword));
      return normalIsYes ? safeOptions.find(opt => String(opt).toLowerCase() === 'ya') : safeOptions.find(opt => String(opt).toLowerCase() === 'tidak');
    }

    const preferred = safeOptions.find(opt => {
      const value = String(opt).toLowerCase();
      return value === 'normal' ||
        (value.includes('normal') && !value.includes('tidak normal')) ||
        value.includes('sesuai usia') ||
        value.includes('sesuai umur') ||
        value.includes('daya lihat anak baik') ||
        value.includes('tidak karies') ||
        value.includes('tidak ada ikterus') ||
        value.includes('warna tinja 4-7') ||
        value.includes('berat badan normal') ||
        value === 'baik' ||
        value.includes('tidak beresiko') ||
        value.includes('tidak ada faktor risiko') ||
        value.includes('tidak ada keluhan') ||
        value.includes('tidak ada pembesaran') ||
        value.includes('negatif') ||
        value.includes('non reaktif') ||
        value.includes('mandiri') ||
        value.includes('risiko rendah');
    });

    return preferred || null;
  };

  const fillEmptyWithNormal = (questions) => {
    questions.forEach(q => {
      const opts = q.question_text.toLowerCase().includes('snellen chart') ? SNELLEN_OPTIONS : q.options;
      const normalValue = getNormalValue(q, opts);
      if (normalValue && !getValue(q.id)) onChange(q.id, normalValue);
    });
  };

  const renderInput = (question, customOptions = null, variant = "default") => {
    const value = getValue(question.id);
    const questionText = question.question_text.toLowerCase();
    const baseOptions = customOptions || (Array.isArray(question.options) ? question.options : []);
    const safeOptions = questionText.includes('hasil pemeriksaan pupil') && !baseOptions.some(opt => String(opt).toLowerCase() === 'normal')
      ? ['Normal', ...baseOptions]
      : baseOptions;
    const isBool = safeOptions.length === 2 || safeOptions.length === 3;

    if (questionText.includes('e-tumbling') || questionText.includes('visus mata')) {
       return (
         <div className="flex bg-slate-50/50 rounded-xl p-1 border border-slate-200 w-full mt-2 shadow-sm">
            <button type="button" onClick={() => onChange(question.id, safeOptions[0])} className={`flex-1 py-3.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all ${value === safeOptions[0] ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-400'}`}>✅ Normal</button>
            <button type="button" onClick={() => onChange(question.id, safeOptions[1])} className={`flex-1 py-3.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all ${value === safeOptions[1] ? `${getThemeColor()} text-white shadow-md border-transparent` : 'text-slate-400'}`}>⚠️ Curiga</button>
         </div>
       )
    }

    if (isBool) return <CustomToggle question={question} options={safeOptions} variant={variant === "card" ? "radio" : "segmented"} />;
    
    if (safeOptions.length > 0 && safeOptions.length <= 5) {
        const hasLongOption = safeOptions.some(opt => parseOption(opt).length > 18);
        if (variant === "card") {
          return (
            <div className="mt-4 space-y-3">
              {safeOptions.map((opt) => {
                const visualText = parseOption(opt);
                const isActive = value === opt;
                const isWarning = visualText.includes('âš ï¸') || visualText.toLowerCase().includes('buta') || visualText.toLowerCase().includes('berat') || visualText.toLowerCase().includes('positif');
                const dotClass = isActive
                  ? (isWarning ? 'border-rose-500 bg-rose-500' : 'border-emerald-500 bg-emerald-500')
                  : 'border-slate-200 bg-white';
                return (
                  <label key={opt} className={`flex items-start gap-3 rounded-xl px-2 py-1.5 transition-all cursor-pointer ${isActive ? 'text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <input type="radio" name={question.id} value={opt} checked={isActive} onChange={(e) => onChange(question.id, e.target.value)} className="sr-only" required={false} />
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 shadow-sm ${dotClass}`}>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0 text-sm font-bold leading-snug break-words">{visualText}</span>
                  </label>
                );
              })}
            </div>
          );
        }
        return (
          <div className={`grid ${hasLongOption ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'} gap-1.5 mt-1.5`}>
            {safeOptions.map((opt) => {
              const visualText = parseOption(opt);
              const isWarning = visualText.includes('⚠️') || visualText.toLowerCase().includes('buta') || visualText.toLowerCase().includes('berat') || visualText.toLowerCase().includes('positif');
              const activeClass = isWarning ? 'bg-rose-500 text-white shadow-md border-transparent' : `${getThemeColor()} text-white shadow-md border-transparent`;
              
              return (
              <label key={opt} className={`min-w-0 flex-1 flex items-center ${hasLongOption ? 'justify-start text-left' : 'justify-center text-center'} py-3 px-3 rounded-xl border transition-all cursor-pointer font-black shadow-sm ${
                  (value === opt) ? activeClass : 'bg-white border-slate-200 text-slate-600'
                }`}>
                <input type="radio" name={question.id} value={opt} checked={value === opt} onChange={(e) => onChange(question.id, e.target.value)} className="sr-only" required={false} />
                <span className={`${hasLongOption ? 'text-[11px] tracking-normal normal-case' : 'text-[10px] tracking-wide uppercase'} leading-snug break-words`}>{visualText}</span>
              </label>
            )})}
          </div>
        );
    }
    
    if (safeOptions.length > 5) {
        return (
          <select value={value} onChange={(e) => onChange(question.id, e.target.value)} required={false} 
            className="w-full bg-white border border-slate-200 text-slate-800 font-bold text-[11px] py-4 px-4 rounded-xl mt-2 outline-none focus:ring-2 shadow-sm appearance-none">
            <option value="" disabled>-- Pilih Hasil --</option>
            {safeOptions.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
          </select>
        );
    }
    if (question.answer_type === 'number') {
       return (
         <input 
            type="number"
            value={value}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder="Ketik angka..."
            inputMode="decimal"
            className={`w-full border border-slate-200 text-slate-800 font-bold text-sm py-4 px-4 rounded-xl outline-none focus:ring-2 focus:ring-[#0f766e] ${variant === "card" ? 'mt-4 bg-white shadow-sm placeholder-slate-400' : 'mt-2 bg-slate-50 shadow-inner'}`}
         />
       );
    }
    
    return (
      <VoiceInput 
        type="text" 
        value={value} 
        onChange={(val) => onChange(question.id, val)} 
        placeholder="Ketik hasil..." 
      />
    );
  };

  const renderCards = () => {
    const usedIds = new Set();
    
    const isQVisible = (q) => {
       const t = q.question_text.toLowerCase();
       const isPuasa = formData['VIRTUAL_PUASA'] === 'Ya';
       const isTidakPuasa = formData['VIRTUAL_PUASA'] === 'Tidak' || !formData['VIRTUAL_PUASA'];
       
       if (t.includes('gula darah sewaktu') && isPuasa) return false;
       if ((t.includes('gula darah puasa') || t.includes('2 jam pp')) && isTidakPuasa) return false;
       
       // Logika Lingkar Betis Hides Jika IMT Ada
       if (t.includes('lingkar betis')) {
          const qIMT = findQ(['index massa tubuh', 'imt']);
          if (qIMT && getValue(qIMT.id) && !getValue(qIMT.id).startsWith('0.0') && !getValue(qIMT.id).includes('NaN')) return false;
       }

       const qMerokokSetahun = findQ(['merokok dalam setahun terakhir']);
       const qPernahMerokok = findQ(['pernah merokok sebelumnya']);
       const qPumaMerokok = findQ(['sedang/mempunyai riwayat merokok']);
       const merokokSetahunValue = qMerokokSetahun ? getValue(qMerokokSetahun.id) : '';
       const pernahMerokokValue = qPernahMerokok ? getValue(qPernahMerokok.id) : '';
       const pumaMerokokValue = qPumaMerokok ? getValue(qPumaMerokok.id) : '';
       const isPerokokAktif = isYesValue(merokokSetahunValue);
       const isBukanPerokokAktif = isNoValue(merokokSetahunValue);
       const isMantanPerokok = isYesValue(pernahMerokokValue);
       const hasSmokingFlow = Boolean(qMerokokSetahun);

       if (hasSmokingFlow) {
          if (t.includes('jika perokok') || t.includes('sudah berapa tahun anda merokok') || t.includes('batang rokok')) {
             return isPerokokAktif;
          }
          if (t.includes('pernah merokok sebelumnya')) {
             return isBukanPerokokAktif;
          }
          if (t.includes('berapa lama') && t.includes('merokok sebelumnya')) {
             return isBukanPerokokAktif && isMantanPerokok;
          }
          if (t.includes('kapan anda berhenti merokok')) {
             return isBukanPerokokAktif && isMantanPerokok;
          }
          if (t.includes('derajat merokok')) {
             return isPerokokAktif;
          }
          if (t.includes('sedang/mempunyai riwayat merokok')) {
             return false;
          }
          if (t.includes('bungkus per tahun')) {
             return isPerokokAktif || isYesValue(pumaMerokokValue);
          }
          if (t.includes('riwayat merokok - apcs') || t.includes('riwayat merokok/paparan asap rokok')) {
             const qAsap = findQ(['terpapar asap rokok']);
             return isFilled(qMerokokSetahun.id) || isFilled(qPernahMerokok?.id) || isYesValue(getValue(qAsap?.id));
          }
       }

        if (t.includes('snellen chart') && !isSchoolAgeCategory(kategoriUsia)) {
           const tumb = t.includes('kiri') ? findQ(['e-tumbling', 'kiri']) : findQ(['e-tumbling', 'kanan']);
           if (tumb && (!getValue(tumb.id) || getValue(tumb.id).toLowerCase().includes('normal'))) return false;
        }

       if (schema?.sheet_name === 'BBL') {
          const isPositive = (item) => String(getValue(item?.id)).toLowerCase().includes('positif');
          const isYes = (item) => String(getValue(item?.id)).toLowerCase() === 'ya';
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
          const isYes = (item) => item && String(getValue(item.id)).toLowerCase() === 'ya';

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
          const tbRiskValue = String(getValue(findQ(['risiko tuberkulosis anak'])?.id)).toLowerCase();
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
          const hasDmRisk = dmSignals.some(isYes) || String(getValue(findQ(['keluhan & gejala dm'])?.id)).toLowerCase().includes('ada keluhan');
          if (t.includes('pemeriksaan gula darah sewaktu') && !hasDmRisk) return false;

          const thalRisk = String(getValue(findQ(['faktor risiko talasemia'])?.id)).toLowerCase().includes('ada faktor');
          const isThalLab = ['hemoglobin', 'mcv', 'mch', 'eritrosit', 'rbc count', 'rdw'].some(kw => t.includes(kw));
          if (isThalLab && findQ(['faktor risiko talasemia']) && !thalRisk) return false;
       }

       if (!isSchoolAgeCategory(kategoriUsia) && (t.includes('berapa kali') || t.includes('berapa menit')) && t.includes('olahraga')) {
          const routine = findQ(['rutin', 'olahraga']);
          if (routine && String(getValue(routine.id)).toLowerCase() !== 'ya') return false;
       }
       return true;
    };

    const takeCard = (title, icon, keywords, isGrid = false) => {
        const cardPosMap = {
          'Kesehatan Gigi & Mulut': 3,
          'Indera Penglihatan': 3,
          'Indera Pendengaran': 3,
          'Profil Lipid / Asam Urat': 4,
          'Skrining Penyakit Menular': 4,
          'Risiko Paru & Tuberkulosis': 5,
          'Skrining Kanker & Jantung': 5,
          'Skrining Kulit Khusus': 5,
          'Gaya Hidup & Risiko': 5,
          'Kesehatan Jiwa & Kognitif': 6,
          'Fisik Geriatri & Gizi': 6,
          'Tumbuh Kembang Anak': 6,
        };

        if (title === 'Observasi & Pemeriksaan Lainnya') return null;

        if (cardPosMap[title] && cardPosMap[title] !== posNumber) return null;

        const qs = allValidQuestions.filter(q => !usedIds.has(q.id) && keywords.some(kw => q.question_text.toLowerCase().includes(kw)));
        const visibleQs = qs.filter(isQVisible);
        if (visibleQs.length === 0) return null;
        qs.forEach(q => usedIds.add(q.id));
        const emptyCount = visibleQs.filter(q => !getValue(q.id)).length;
        const normalFillCount = visibleQs.filter(q => getNormalValue(q, q.question_text.toLowerCase().includes('snellen chart') ? SNELLEN_OPTIONS : q.options)).length;
        const useQuestionCards = ['Risiko Paru & Tuberkulosis', 'Skrining Kanker & Jantung', 'Skrining Kulit Khusus', 'Gaya Hidup & Risiko', 'Kesehatan Jiwa & Kognitif', 'Fisik Geriatri & Gizi'].includes(title);

        return (
          <div key={title} className="bg-slate-50/50 rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-200 shadow-sm animate-fade-in-up mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5 border-b border-slate-200/60 pb-3">
              <h4 className="min-w-0 flex flex-1 items-center gap-3 text-slate-800 font-black leading-tight"><span className="shrink-0 text-xl">{icon}</span> <span className="break-words">{title}</span></h4>
              <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                <span className={`text-[9px] font-black px-2 py-1 rounded-full ${emptyCount ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{emptyCount ? `${emptyCount} kosong` : 'Lengkap'}</span>
                {normalFillCount > 0 && (
                  <button type="button" onClick={() => fillEmptyWithNormal(visibleQs)} className="bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition">
                    Isi Normal
                  </button>
                )}
              </div>
            </div>

            {title === 'Skrining Kanker & Jantung' && isHypertensionHistory && (
               <div className="mb-5 bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 animate-fade-in-up">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-rose-100 shrink-0">⚠️</div>
                 <div>
                   <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Indikasi EKG Otomatis</h5>
                   <p className="text-[10px] text-rose-500 font-medium">Berdasarkan data tensi dari Pos 2, pasien memiliki riwayat/indikasi Hipertensi. Sangat disarankan melakukan Elektrokardiogram (EKG).</p>
                 </div>
               </div>
            )}

            {title === 'Gaya Hidup & Risiko' && isSchoolAgeCategory(kategoriUsia) && formData['VIRTUAL_AKTIVITAS_ANAK_STATUS'] && (
               <div className={`mb-5 rounded-2xl p-4 shadow-sm flex items-center gap-4 animate-fade-in-up border ${
                 formData['VIRTUAL_AKTIVITAS_ANAK_STATUS'].includes('Kurang')
                   ? 'bg-rose-50 border-rose-200 text-rose-600'
                   : formData['VIRTUAL_AKTIVITAS_ANAK_STATUS'].includes('Cukup')
                     ? 'bg-amber-50 border-amber-200 text-amber-600'
                     : 'bg-emerald-50 border-emerald-200 text-emerald-600'
               }`}>
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-white shrink-0">🏃</div>
                 <div>
                   <h5 className="text-[10px] font-black uppercase tracking-widest mb-1">Interpretasi Aktivitas Fisik Anak</h5>
                   <p className="text-[10px] font-bold">{formData['VIRTUAL_AKTIVITAS_ANAK_STATUS']}</p>
                 </div>
               </div>
            )}

            <div className={useQuestionCards ? "space-y-4" : (isGrid ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4")}>
               {visibleQs.map(q => {
                  const opts = q.question_text.toLowerCase().includes('snellen chart') ? SNELLEN_OPTIONS : q.options;
                  const questionIndex = visibleQs.findIndex(item => item.id === q.id) + 1;
                  if (useQuestionCards) {
                    return (
                      <div key={q.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-black text-slate-300">{questionIndex}.</span>
                          <label className="min-w-0 flex-1 text-[15px] font-black leading-snug text-slate-800 normal-case break-words">
                            {formatQuestionText(q.question_text, kategoriUsia)}
                            {q.required && <span className="text-rose-500"> *</span>}
                          </label>
                        </div>
                        <div className="pl-8">
                          {renderInput(q, opts, "card")}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={q.id} className="min-w-0">
                      <label className="text-[11px] md:text-[10px] font-black text-slate-500 uppercase tracking-wide px-1 block mb-1 leading-snug break-words">{parseQuestion(q.question_text, kategoriUsia)}</label>
                      {renderInput(q, opts)}
                    </div>
                  );
               })}
            </div>
          </div>
        );
    };

    const qBB = posNumber === 2 ? findQ(['berat badan (kg)', 'berat badan']) : null; const qTB = posNumber === 2 ? findQ(['tinggi badan']) : null; const qLP = posNumber === 2 ? findQ(['lingkar perut']) : null; const qLiLA = posNumber === 2 ? findQ(['lila']) : null; const qBetis = posNumber === 2 ? findQ(['lingkar betis']) : null;
    const qSys = posNumber === 2 ? findQ(['sistolik']) : null; const qDia = posNumber === 2 ? findQ(['diastolik']) : null;
    const qRiwayatHT = posNumber === 2 ? (findQ(['tekanan darah tinggi', 'hipertensi']) || { id: 'VIRTUAL_RIWAYAT_HT', question_text: 'Apakah Anda pernah dinyatakan tekanan darah tinggi?', answer_type: 'yes_no', options: ['Ya', 'Tidak'], isVirtual: true }) : null;
    const qGDS = posNumber === 2 ? findQ(['gula darah sewaktu', 'gds']) : null; const qGDP = posNumber === 2 ? findQ(['gula darah puasa', 'gdp']) : null;
    const qHbA1c = posNumber === 2 ? findQ(['hba1c', 'hb1ac']) : null;
    const qRiwayatDM = posNumber === 2 ? (findQ(['dinyatakan diabetes', 'kencing manis']) || { id: 'VIRTUAL_RIWAYAT_DM', question_text: 'Apakah Anda pernah dinyatakan diabetes atau kencing manis?', answer_type: 'yes_no', options: ['Ya', 'Tidak'], isVirtual: true }) : null;

    [qBB, qTB, qLP, qLiLA, qBetis, qSys, qDia, qRiwayatHT, findQ(['hasil tekanan darah']), qGDS, qGDP, findQ(['index massa tubuh', 'imt']), qHbA1c, qRiwayatDM, qKolesterol, qHdl, qLdl, qTrigliserida, qAsamUrat, qIntKolesterol, qIntHdl, qIntLdl, qIntTrigliserida, qIntDislipidemia].forEach(q => { if(q) usedIds.add(q.id); });

    return (
      <div className="space-y-6">
        
        {/* CUSTOM BLOK: ANTROPOMETRI */}
        {(qBB || qTB || qBetis) && (
          <div className="bg-slate-50/50 rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-200 shadow-sm mb-6">
            <h4 className="flex items-center gap-3 text-slate-800 font-black mb-5 border-b border-slate-200/60 pb-3"><span className="text-xl">📏</span> Antropometri Dasar</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 mb-6">
              {qTB && <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5">Tinggi/Panjang <span className="text-rose-500">*</span></label>
                <p className="text-[9px] text-slate-500 mb-2">Dalam sentimeter (cm)</p>
                    <input type="number" inputMode="decimal" value={getValue(qTB.id)} onChange={(e) => onChange(qTB.id, e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-lg" />
              </div>}
              {qBB && <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5">Berat Badan <span className="text-rose-500">*</span></label>
                <p className="text-[9px] text-slate-500 mb-2">Dalam kilogram (kg)</p>
                <input type="number" inputMode="decimal" value={getValue(qBB.id)} onChange={(e) => onChange(qBB.id, e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-lg" />
              </div>}
              {qLP && <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5">Lingkar Perut <span className="text-rose-500">*</span></label>
                <p className="text-[9px] text-slate-500 mb-2">cm</p>
                <input type="number" inputMode="decimal" value={getValue(qLP.id)} onChange={(e) => onChange(qLP.id, e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-lg" />
              </div>}
              {qLiLA && <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5">LiLA <span className="text-rose-500">*</span></label>
                <p className="text-[9px] text-slate-500 mb-2">Lingkar Lengan (cm)</p>
                {qLiLA.answer_type === 'number' ? (
                  <input type="number" inputMode="decimal" value={getValue(qLiLA.id)} onChange={(e) => onChange(qLiLA.id, e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-lg" />
                ) : renderInput(qLiLA)}
              </div>}
              {qBetis && isQVisible(qBetis) && <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5 text-orange-600">{parseQuestion(qBetis.question_text, kategoriUsia)}</label>
                <p className="text-[9px] text-orange-400 mb-2">Lingkar Betis (cm)</p>
                <input type="number" inputMode="decimal" value={getValue(qBetis.id)} onChange={(e) => onChange(qBetis.id, e.target.value)} className="w-full border border-orange-200 rounded-xl px-4 py-3 font-bold bg-orange-50 outline-none focus:ring-2 focus:ring-orange-500 text-lg" />
              </div>}
            </div>
            
            {(() => {
               const imtRaw = findQ(['index massa tubuh', 'imt']) ? getValue(findQ(['index massa tubuh', 'imt']).id) : "";
               const hasImt = Boolean(imtRaw) && !imtRaw.startsWith('0.0') && !imtRaw.includes('NaN');
               const imtValue = hasImt ? imtRaw.split(' ')[0] : "--";
               const imtStatus = imtRaw.split(' ').slice(1).join(' ').replace(/[()]/g, '') || "BELUM ADA";
               const imtColor = imtStatus === 'NORMAL' ? 'text-emerald-600' : (imtStatus === 'OBESITAS' || imtStatus === 'GEMUK' ? 'text-rose-600' : 'text-slate-800');
               
               return (
                 <div className="bg-[#1e293b] text-white rounded-2xl p-5 flex flex-wrap justify-between items-center gap-3 shadow-md">
                   <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">IMT Terhitung</p>
                      <h2 className="text-4xl font-black font-mono tracking-tighter leading-none">{imtValue}</h2>
                      {!hasImt && <p className="mt-2 text-[10px] font-bold text-slate-300">Isi BB dan TB/PB untuk menghitung.</p>}
                   </div>
                   <div className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase bg-white ${imtColor} shadow-sm`}>
                      {hasImt ? imtStatus : 'MENUNGGU DATA'}
                   </div>
                 </div>
               )
            })()}
          </div>
        )}

        {/* CUSTOM BLOK: TENSI DARAH */}
        {qSys && (
          <div className="bg-slate-50/50 rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-200 shadow-sm mb-6">
            <h4 className="flex items-center gap-3 text-slate-800 font-black mb-5 border-b border-slate-200/60 pb-3"><span className="text-xl">🩺</span> Tekanan Darah</h4>
            <div className="mb-4">
               <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5 px-1">Tekanan Darah Sis/Dia <span className="text-rose-500">*</span></label>
               <p className="text-[9px] text-slate-500 mb-2 px-1">Isi sistolik dan diastolik dalam mmHg</p>
               <div className="grid w-full md:w-2/3 grid-cols-[1fr_auto_1fr] items-end gap-3">
                 <div>
                   <span className="mb-1 block px-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Sistolik</span>
                   <input type="number" inputMode="numeric" value={getValue(qSys.id)} onChange={(e) => onChange(qSys.id, e.target.value)} placeholder="120" className="w-full border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-lg tracking-widest bg-white outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                 </div>
                 <div className="pb-4 text-2xl font-black text-slate-300">/</div>
                 <div>
                   <span className="mb-1 block px-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Diastolik</span>
                   <input type="number" inputMode="numeric" value={getValue(qDia?.id)} onChange={(e) => qDia && onChange(qDia.id, e.target.value)} placeholder="80" className="w-full border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-lg tracking-widest bg-white outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                 </div>
               </div>
            </div>

            {(parseInt(getValue(qSys.id)) >= 140 || parseInt(getValue(qDia?.id)) >= 90) && qRiwayatHT && (
              <div className="mt-5 bg-rose-50 border border-rose-200 rounded-2xl p-5 md:w-1/2 shadow-sm animate-fade-in-up">
                <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 mb-4"><span>⚠️</span> Tindak Lanjut Hipertensi</h5>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Pernah didiagnosis Hipertensi oleh dokter?</label>
                <CustomToggle question={qRiwayatHT} falseText="TIDAK" trueText="YA" options={qRiwayatHT.options} />
                
                {getValue(qRiwayatHT.id)?.toLowerCase() === 'ya' && (
                  <div className="mt-5 pt-5 border-t border-rose-200/60 animate-fade-in-up">
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5 px-1">Lama Diagnosis (Bulan) <span className="text-rose-500">*</span></label>
                    <p className="text-[9px] text-slate-500 mb-2 px-1">Contoh: 1 thn = 12, 2 thn 6 bln = 30.</p>
                    <div className="relative">
                      <input type="number" value={getValue('VIRTUAL_LAMA_HT')} onChange={(e) => onChange('VIRTUAL_LAMA_HT', e.target.value)} placeholder="0" className="w-full border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-lg bg-white outline-none focus:ring-2 focus:ring-rose-500 pr-16" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Bulan</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CUSTOM BLOK: SKRINING GULA DARAH (POS 2) */}
        {(qGDS || qGDP) && (
          <div className="bg-slate-50/50 rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-200 shadow-sm mb-6">
            <h4 className="flex items-center gap-3 text-slate-800 font-black mb-5 border-b border-slate-200/60 pb-3"><span className="text-xl">🩸</span> Skrining Gula Darah</h4>
            
            <div className="mb-5">
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 px-1">Apakah pasien berpuasa 8-12 jam sebelumnya? <span className="text-rose-500">*</span></label>
              <div className="flex bg-slate-50/50 rounded-xl p-1 border border-slate-200 w-full mt-2 shadow-sm">
                <button type="button" onClick={() => { setMetodeGula('sewaktu'); onChange('VIRTUAL_PUASA', 'Tidak'); }} className={`flex-1 py-4 rounded-lg text-[10px] font-black tracking-widest transition-all ${metodeGula === 'sewaktu' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400'}`}>TIDAK (GDS)</button>
                <button type="button" onClick={() => { setMetodeGula('puasa'); onChange('VIRTUAL_PUASA', 'Ya'); }} className={`flex-1 py-4 rounded-lg text-[10px] font-black tracking-widest transition-all ${metodeGula === 'puasa' ? `bg-[#4f46e5] text-white shadow-md border-transparent` : 'text-slate-400'}`}>YA (GDP)</button>
              </div>
            </div>

            <div className="mb-4 animate-fade-in-up">
               {metodeGula === 'sewaktu' && qGDS && (
                 <input type="number" inputMode="decimal" value={getValue(qGDS.id)} onChange={(e) => onChange(qGDS.id, e.target.value)} placeholder="GDS mg/dL" className="w-full md:w-2/3 border border-slate-200 rounded-2xl px-6 py-6 font-black text-slate-300 placeholder-slate-300 focus:text-slate-800 text-3xl tracking-wider bg-white outline-none focus:ring-4 focus:ring-[#4f46e5]/20 shadow-inner transition-all" />
               )}
               {metodeGula === 'puasa' && qGDP && (
                 <input type="number" inputMode="decimal" value={getValue(qGDP.id)} onChange={(e) => onChange(qGDP.id, e.target.value)} placeholder="GDP mg/dL" className="w-full md:w-2/3 border border-slate-200 rounded-2xl px-6 py-6 font-black text-slate-300 placeholder-slate-300 focus:text-slate-800 text-3xl tracking-wider bg-white outline-none focus:ring-4 focus:ring-[#4f46e5]/20 shadow-inner transition-all" />
               )}
            </div>

            {(() => {
              const valGDS = parseInt(getValue(qGDS?.id) || 0);
              const valGDP = parseInt(getValue(qGDP?.id) || 0);
              const isDiabetes = (metodeGula === 'sewaktu' && valGDS >= 200) || (metodeGula === 'puasa' && valGDP >= 126);
              
              if (isDiabetes && qRiwayatDM) {
                return (
                  <div className="mt-6 bg-rose-50 border border-rose-200 rounded-3xl p-6 md:w-2/3 shadow-sm animate-fade-in-up">
                    <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 mb-4"><span>⚠️</span> Tindak Lanjut Diabetes</h5>
                    
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">{parseQuestion(qRiwayatDM.question_text, kategoriUsia)}</label>
                    <CustomToggle question={qRiwayatDM} falseText="TIDAK" trueText="YA" options={qRiwayatDM.options} />

                    {qHbA1c && (
                      <div className="mt-5 pt-5 border-t border-rose-200/60 animate-fade-in-up">
                        <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-0.5 px-1">{parseQuestion(qHbA1c.question_text, kategoriUsia)} <span className="text-rose-500">*</span></label>
                        <p className="text-[9px] text-slate-500 mb-2 px-1">Persentase (%)</p>
                        <div className="relative">
                          <input type="number" value={getValue(qHbA1c.id)} onChange={(e) => onChange(qHbA1c.id, e.target.value)} placeholder="0.0" step="0.1" className="w-full border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-lg bg-white outline-none focus:ring-2 focus:ring-rose-500 pr-16" />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* CUSTOM BLOK: PROFIL LIPID & ASAM URAT */}
        {(qKolesterol || qHdl || qLdl || qTrigliserida || qAsamUrat) && (
          <div className="bg-slate-50/50 rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-200 shadow-sm mb-6">
            <h4 className="flex items-center gap-3 text-slate-800 font-black mb-5 border-b border-slate-200/60 pb-3"><span className="text-xl">🧪</span> Profil Lipid / Asam Urat</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolesterol Total */}
              {qKolesterol && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 w-1.5 h-full transition-all ${getValue(qIntKolesterol?.id) === 'Normal' ? 'bg-emerald-400' : (getValue(qIntKolesterol?.id) ? 'bg-rose-400' : 'bg-slate-200')}`}></div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Kolesterol Total <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-3 ml-2">
                    <input type="number" inputMode="decimal" value={getValue(qKolesterol.id)} onChange={(e) => onChange(qKolesterol.id, e.target.value)} placeholder="mg/dL" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-2xl outline-none focus:ring-2 focus:ring-[#4f46e5] focus:bg-white transition-all" />
                    <span className="text-[10px] font-black text-slate-400">mg/dL</span>
                  </div>
                  {getValue(qKolesterol.id) && qIntKolesterol && (
                    <div className="mt-4 ml-2 flex items-center justify-between">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Interpretasi AI:</span>
                       <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${getValue(qIntKolesterol.id) === 'Normal' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'}`}>
                          {getValue(qIntKolesterol.id)}
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* HDL */}
              {qHdl && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 w-1.5 h-full transition-all ${getValue(qIntHdl?.id) === 'Normal' ? 'bg-emerald-400' : (getValue(qIntHdl?.id) ? 'bg-rose-400' : 'bg-slate-200')}`}></div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">HDL (High-Density Lipoprotein) <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-3 ml-2">
                    <input type="number" inputMode="decimal" value={getValue(qHdl.id)} onChange={(e) => onChange(qHdl.id, e.target.value)} placeholder="mg/dL" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-2xl outline-none focus:ring-2 focus:ring-[#4f46e5] focus:bg-white transition-all" />
                    <span className="text-[10px] font-black text-slate-400">mg/dL</span>
                  </div>
                  {getValue(qHdl.id) && qIntHdl && (
                    <div className="mt-4 ml-2 flex items-center justify-between">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Interpretasi AI:</span>
                       <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${getValue(qIntHdl.id) === 'Normal' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'}`}>
                          {getValue(qIntHdl.id)}
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* LDL */}
              {qLdl && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 w-1.5 h-full transition-all ${getValue(qIntLdl?.id) === 'Optimal' || getValue(qIntLdl?.id) === 'Mendekati Optimal' ? 'bg-emerald-400' : (getValue(qIntLdl?.id) ? 'bg-rose-400' : 'bg-slate-200')}`}></div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">LDL (Low-Density Lipoprotein) <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-3 ml-2">
                    <input type="number" inputMode="decimal" value={getValue(qLdl.id)} onChange={(e) => onChange(qLdl.id, e.target.value)} placeholder="mg/dL" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-2xl outline-none focus:ring-2 focus:ring-[#4f46e5] focus:bg-white transition-all" />
                    <span className="text-[10px] font-black text-slate-400">mg/dL</span>
                  </div>
                  {getValue(qLdl.id) && qIntLdl && (
                    <div className="mt-4 ml-2 flex items-center justify-between">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Interpretasi AI:</span>
                       <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${getValue(qIntLdl.id) === 'Optimal' || getValue(qIntLdl.id) === 'Mendekati Optimal' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'}`}>
                          {getValue(qIntLdl.id)}
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trigliserida */}
              {qTrigliserida && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 w-1.5 h-full transition-all ${getValue(qIntTrigliserida?.id) === 'Normal' ? 'bg-emerald-400' : (getValue(qIntTrigliserida?.id) ? 'bg-rose-400' : 'bg-slate-200')}`}></div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Trigliserida <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-3 ml-2">
                    <input type="number" inputMode="decimal" value={getValue(qTrigliserida.id)} onChange={(e) => onChange(qTrigliserida.id, e.target.value)} placeholder="mg/dL" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-2xl outline-none focus:ring-2 focus:ring-[#4f46e5] focus:bg-white transition-all" />
                    <span className="text-[10px] font-black text-slate-400">mg/dL</span>
                  </div>
                  {getValue(qTrigliserida.id) && qIntTrigliserida && (
                    <div className="mt-4 ml-2 flex items-center justify-between">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Interpretasi AI:</span>
                       <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${getValue(qIntTrigliserida.id) === 'Normal' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'}`}>
                          {getValue(qIntTrigliserida.id)}
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* Asam Urat */}
              {qAsamUrat && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden md:col-span-2 group">
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-[#4f46e5]"></div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Asam Urat <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-3 ml-2">
                    <input type="number" inputMode="decimal" value={getValue(qAsamUrat.id)} onChange={(e) => onChange(qAsamUrat.id, e.target.value)} placeholder="mg/dL" className="w-full md:w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-black text-slate-800 text-2xl outline-none focus:ring-2 focus:ring-[#4f46e5] focus:bg-white transition-all" />
                    <span className="text-[10px] font-black text-slate-400">mg/dL</span>
                  </div>
                </div>
              )}
            </div>

            {/* Banner Dislipidemia */}
            {qIntDislipidemia && getValue(qIntDislipidemia.id) === 'Dislipidemia' && (
              <div className="mt-6 bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 animate-fade-in-up">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-rose-100 shrink-0">⚠️</div>
                 <div>
                   <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Peringatan Dislipidemia</h5>
                   <p className="text-[10px] text-rose-500 font-medium">Berdasarkan kalkulasi profil lipid di atas, pasien terindikasi mengalami Dislipidemia.</p>
                 </div>
              </div>
            )}
          </div>
        )}


        {takeCard('Kesehatan Gigi & Mulut', '🦷', ['gigi', 'karies', 'periodontal', 'goyang', 'mulut'], true)}
        {takeCard('Indera Penglihatan', '👁️', ['mata', 'visus', 'pupil', 'pinhole', 'kacamata', 'juling', 'penglihatan', 'e-tumbling', 'snellen'])}
        {takeCard('Indera Pendengaran', '👂', ['telinga', 'pendengaran', 'serumen', 'berbisik', 'dengar', 'otoskop', 'penala'])}
        
        {takeCard('Profil Lipid / Asam Urat', '🧪', ['kolesterol', 'ldl', 'hdl', 'trigliserida', 'asam urat', 'dislipidemia', 'hba1c', 'diabetes'])}
        {takeCard('Skrining Penyakit Menular', '🦠', ['hepatitis', 'hcv', 'hbsag', 'hiv', 'sifilis', 'malaria', 'transfusi', 'cuci darah', 'hemodialisa', 'kencing nanah', 'gonore'])}
        
        {takeCard('Risiko Paru & Tuberkulosis', '🫁', ['batuk', 'tb', 'tbc', 'tuberkulosis', 'keringat malam', 'demam', 'lesu', 'dahak', 'napas', 'spirometri', 'puma', 'tcm', 'bta', 'skoring tb'])}
        {takeCard('Skrining Kanker & Jantung', '🎗️', ['sadanis', 'inspekulo', 'iva', 'dna hpv', 'ekg'])}
        {takeCard('Skrining Kulit Khusus', '🤚', ['bercak', 'putih mati rasa', 'kudis', 'skabies', 'koreng', 'gatal', 'kusta', 'frambusia'])}
        {takeCard('Gaya Hidup & Risiko', '🏃', ['olahraga', 'merokok', 'alkohol', 'sayur', 'buah', 'aktif', 'terbangun', 'haus', 'lapar', 'mengompol'])}
        
        {takeCard('Kesehatan Jiwa & Kognitif', '🧠', ['minicog', 'menggambar jam', 'depresi', 'sdq', 'srq', 'emosi', 'khawatir', 'cemas', 'mengingat', 'perilaku'])}
        {takeCard('Fisik Geriatri & Gizi', '🧓', ['adl', 'sppb', 'risiko jatuh', 'mna'])}
        {takeCard('Tumbuh Kembang Anak', '🧸', ['kpsp', 'autisme', 'm-chat'])}
        
        {takeCard('Observasi & Pemeriksaan Lainnya', '📋', [''])}
      </div>
    );
  };

  if (allValidQuestions.length === 0) {
    const emptyMessage = isEarlyChildCategory(kategoriUsia) && posNumber === 4
      ? 'Tidak ada pemeriksaan Pos 4 untuk kelompok ini. Lanjut ke Pos 5 bila ada skrining TB anak atau risiko lanjutan.'
      : 'Tugas selesai / data tidak tersedia untuk kategori ini';
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5 opacity-70 bg-slate-50 rounded-3xl mt-4 text-center">
        <span className="text-4xl mb-3">📄</span>
        <p className="font-bold uppercase tracking-wide text-slate-500 text-xs md:text-sm leading-relaxed">{emptyMessage}</p>
      </div>
    );
  }

  return <div className="w-full mt-4">{renderCards()}</div>;
};

export default DynamicFormRenderer;
