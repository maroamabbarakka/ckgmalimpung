const fs = require('fs');

let code = fs.readFileSync('Dashboard.jsx', 'utf8');

// 1. INJECT HELPERS
const injectPos = `// =====================================================================
// KONFIGURASI TATA LETAK DESKTOP (MATEMATIKA 24 KOLOM)`;

const helpers = `const extractValue = (posData, keywords, questionMap = {}) => {
    if (!posData) return null;
    const key = Object.keys(posData).find(k => {
        const keyText = k.toLowerCase();
        const questionText = String(questionMap[k] || '').toLowerCase();
        return keywords.some(kw => keyText.includes(kw) || questionText.includes(kw));
    });
    return key ? posData[key] : null;
};

const isPasienParu = (v) => {
    const p4 = v.pos4 || {}; const p5 = v.pos5 || {}; const qmap5 = v.pos5_question_map || {};
    if (p4.ppok?.nafas_pendek === 'Ya' || p4.merokok?.batuk_lama === 'Ya' || p4.resiko_ca_paru?.riw_merokok === 'Ya' || p4.resiko_tb?.batuk_lama === '>2Mg') return true;
    if (p5.resiko_tb?.batuk === 'Ya' || p5.resiko_tb?.batuk_lama === 'Ya' || p5.ppok?.nafas_pendek === 'Ya') return true;
    
    const batukVal = extractValue(p5, ['batuk', 'tb', 'tbc'], qmap5);
    const rokokVal = extractValue(p5, ['rokok', 'ppok', 'nafas', 'sesak', 'napas'], qmap5);
    if (batukVal && String(batukVal).toLowerCase() === 'ya') return true;
    if (rokokVal && String(rokokVal).toLowerCase() === 'ya') return true;
    
    return false;
};

const isPasienMental = (v) => {
    const p3 = v.pos3 || {}; const skilas = p3.skilas || {}; const p6 = v.pos6 || {}; const qmap6 = v.pos6_question_map || {};
    if (Object.values(p3.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '') || 
        Object.values(p3.jiwa_sdq || {}).some(val => String(val) === 'Ya') ||
        skilas.dep_sedih === 'Ya' || skilas.dep_minat_turun === 'Ya' || skilas.depl_tak_berdaya === 'Ya') return true;
    
    if (p6.depresi === 'Ya' || p6.minicog === 'Tidak Normal' || p6.depresi_cemas === 'Ya') return true;
    
    const mentalVal = extractValue(p6, ['depresi', 'cemas', 'emosional', 'srq', 'ad8', 'sedih', 'minicog', 'kognitif'], qmap6);
    if (mentalVal && String(mentalVal).toLowerCase() !== 'tidak' && String(mentalVal).toLowerCase() !== 'tdk' && !String(mentalVal).toLowerCase().includes('normal') && String(mentalVal).toLowerCase() !== 'aman') return true;
    
    return false;
};

// =====================================================================
// KONFIGURASI TATA LETAK DESKTOP (MATEMATIKA 24 KOLOM)`;

if (code.includes(injectPos) && !code.includes('isPasienParu')) {
    code = code.replace(injectPos, helpers);
}

// 2. REPLACE kalkulasiStatistik PARU & MENTAL
const oldCalc = `        const p4 = v.pos4 || {};
        if (p4.ppok?.nafas_pendek === 'Ya' || p4.merokok?.batuk_lama === 'Ya' || p4.resiko_ca_paru?.riw_merokok === 'Ya' || p4.resiko_tb?.batuk_lama === '>2Mg') s.klinis.paru_ppok++;

        const p3 = v.pos3 || {}; const skilas = p3.skilas || {};
        const isMental = Object.values(p3.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '') || 
                         Object.values(p3.jiwa_sdq || {}).some(val => String(val) === 'Ya') ||
                         skilas.dep_sedih === 'Ya' || skilas.dep_minat_turun === 'Ya' || skilas.depl_tak_berdaya === 'Ya';
        if (isMental) s.klinis.mental++;

        const visusStr = String(p3.mata?.visus || '');`;

const newCalc = `        if (isPasienParu(v)) s.klinis.paru_ppok++;
        if (isPasienMental(v)) s.klinis.mental++;

        const p3 = v.pos3 || {};
        const visusStr = String(p3.mata?.visus || '');`;

if (code.includes(oldCalc)) {
    code = code.replace(oldCalc, newCalc);
}

// 3. REPLACE popupPatients PARU & MENTAL
const oldPopup = `          if (popupConfig.type === 'paru_ppok') return v.pos4?.ppok?.nafas_pendek === 'Ya' || v.pos4?.merokok?.batuk_lama === 'Ya' || v.pos4?.resiko_ca_paru?.riw_merokok === 'Ya' || v.pos4?.resiko_tb?.batuk_lama === '>2Mg';
          if (popupConfig.type === 'mental') {
              const p3 = v.pos3 || {}; const skilas = p3.skilas || {};
              return Object.values(p3.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '') || Object.values(p3.jiwa_sdq || {}).some(val => String(val) === 'Ya') || skilas.dep_sedih === 'Ya';
          }`;

const newPopup = `          if (popupConfig.type === 'paru_ppok') return isPasienParu(v);
          if (popupConfig.type === 'mental') return isPasienMental(v);`;

if (code.includes(oldPopup)) {
    code = code.replace(oldPopup, newPopup);
}

// 4. FIX DEWASA EXCEL
const oldDewasa1 = `            rows: data.map((p, i) => { 
                const p3 = p.pos3 || {}; 
                return [i+1, p.pasien_snapshot?.nama, p3.mata?.visus || '-', p3.telinga?.infeksi || '-', p3.jiwa_srq20?.tdk_semangat || '-', p3.jiwa_srq20?.murung || '-', p3.catin?.hiv || '-', p3.catin?.sifilis || '-', p3.catin?.tt || '-', p3.skrining_kanker?.ca_usus || '-', p3.skrining_kanker?.ca_payudara || '-', p3.skrining_kanker?.ca_serviks || '-', p3.reproduksi_wanita?.iva || p3.reproduksi_wanita?.hpv_dna || '-', p3.reproduksi_wanita?.hamil || '-']; 
            })`;

const newDewasa1 = `            rows: data.map((p, i) => { 
                const p3 = p.pos3 || {}; const p5 = p.pos5 || {}; const qmap5 = p.pos5_question_map || {}; const p6 = p.pos6 || {}; const qmap6 = p.pos6_question_map || {};
                const jiwaSmt = p3.jiwa_srq20?.tdk_semangat || p6.jiwa_srq20?.tdk_semangat || extractValue(p6, ['semangat'], qmap6) || '-';
                const jiwaMurung = p3.jiwa_srq20?.murung || p6.jiwa_srq20?.murung || extractValue(p6, ['murung', 'sedih'], qmap6) || '-';
                const caUsus = p3.skrining_kanker?.ca_usus || p5.skrining_kanker?.ca_usus || extractValue(p5, ['usus'], qmap5) || '-';
                const caPayudara = p3.skrining_kanker?.ca_payudara || p5.skrining_kanker?.ca_payudara || extractValue(p5, ['payudara', 'sadanis'], qmap5) || '-';
                const caServiks = p3.skrining_kanker?.ca_serviks || p5.skrining_kanker?.ca_serviks || extractValue(p5, ['serviks'], qmap5) || '-';
                const iva = p3.reproduksi_wanita?.iva || p3.reproduksi_wanita?.hpv_dna || p5.reproduksi_wanita?.iva || extractValue(p5, ['iva', 'hpv'], qmap5) || '-';
                const hamil = p3.reproduksi_wanita?.hamil || p5.reproduksi_wanita?.hamil || extractValue(p5, ['hamil'], qmap5) || '-';
                return [i+1, p.pasien_snapshot?.nama, p3.mata?.visus || '-', p3.telinga?.infeksi || '-', jiwaSmt, jiwaMurung, p3.catin?.hiv || '-', p3.catin?.sifilis || '-', p3.catin?.tt || '-', caUsus, caPayudara, caServiks, iva, hamil]; 
            })`;

if (code.includes(oldDewasa1)) {
    code = code.replace(oldDewasa1, newDewasa1);
}

const oldDewasa2 = `            rows: data.map((p, i) => { 
                const p4 = p.pos4 || {}; 
                return [i+1, p.pasien_snapshot?.nama, p4.resiko_tb?.batuk_lama || '-', p4.resiko_tb?.kontak || '-', p4.resiko_tb?.riw_tb_ppok || '-', p4.resiko_ca_paru?.merokok_krg_1th || '-', p4.resiko_ca_paru?.riw_merokok || '-', p4.resiko_ca_paru?.terpapar_asap || '-', p4.ppok?.nafas_pendek || '-', p4.ppok?.sulit_dahak || '-', p4.hepatitis?.transfusi || '-', p4.kulit?.kusta || '-', p4.kulit?.skabies || '-', p4.kulit?.frambusia || '-', p4.aktivitas_fisik || '-', p4.keterangan || p3.keterangan || '-']; 
            })`;

const newDewasa2 = `            rows: data.map((p, i) => { 
                const p3 = p.pos3 || {}; const p4 = p.pos4 || {}; const p5 = p.pos5 || {}; const qmap5 = p.pos5_question_map || {};
                const tbBatuk = p4.resiko_tb?.batuk_lama || p5.resiko_tb?.batuk || extractValue(p5, ['batuk', 'tb'], qmap5) || '-';
                const tbKontak = p4.resiko_tb?.kontak || p5.resiko_tb?.kontak || extractValue(p5, ['kontak'], qmap5) || '-';
                const tbPpok = p4.resiko_tb?.riw_tb_ppok || p5.resiko_tb?.riw_tb_ppok || extractValue(p5, ['riwayat tb', 'ppok'], qmap5) || '-';
                const caParuRok = p4.resiko_ca_paru?.riw_merokok || extractValue(p5, ['merokok', 'rokok'], qmap5) || '-';
                const ppokNafas = p4.ppok?.nafas_pendek || extractValue(p5, ['nafas pendek', 'napas', 'sesak'], qmap5) || '-';
                const ppokDahak = p4.ppok?.sulit_dahak || extractValue(p5, ['dahak'], qmap5) || '-';
                return [i+1, p.pasien_snapshot?.nama, tbBatuk, tbKontak, tbPpok, p4.resiko_ca_paru?.merokok_krg_1th || '-', caParuRok, p4.resiko_ca_paru?.terpapar_asap || '-', ppokNafas, ppokDahak, p4.hepatitis?.transfusi || '-', p4.kulit?.kusta || '-', p4.kulit?.skabies || '-', p4.kulit?.frambusia || '-', p4.aktivitas_fisik || '-', p4.keterangan || p5.keterangan || p3.keterangan || '-']; 
            })`;

if (code.includes(oldDewasa2)) {
    code = code.replace(oldDewasa2, newDewasa2);
}

// 5. FIX LANSIA EXCEL
const oldLansia1 = `            rows: data.map((p, i) => { 
                const p3 = p.pos3 || {}; const p4 = p.pos4 || {}; 
                return [i+1, p.pasien_snapshot?.nama, p3.skrining_kanker?.ca_usus || '-', p3.skrining_kanker?.ca_payudara || p3.skrining_kanker?.ca_serviks || '-', p4.resiko_tb?.batuk_lama || '-', p4.resiko_ca_paru?.riw_merokok || '-', p4.ppok?.nafas_pendek || '-', p4.kulit?.kusta || '-', p4.kulit?.skabies || '-', p4.aktivitas_fisik || '-', p4.keterangan || p3.keterangan || '-']; 
            })`;

const newLansia1 = `            rows: data.map((p, i) => { 
                const p3 = p.pos3 || {}; const p4 = p.pos4 || {}; const p5 = p.pos5 || {}; const qmap5 = p.pos5_question_map || {};
                const caUsus = p3.skrining_kanker?.ca_usus || p5.skrining_kanker?.ca_usus || extractValue(p5, ['usus'], qmap5) || '-';
                const caLain = p3.skrining_kanker?.ca_payudara || p5.skrining_kanker?.ca_payudara || extractValue(p5, ['payudara', 'sadanis', 'serviks'], qmap5) || '-';
                const tbBatuk = p4.resiko_tb?.batuk_lama || p5.resiko_tb?.batuk || extractValue(p5, ['batuk', 'tb'], qmap5) || '-';
                const caParuRok = p4.resiko_ca_paru?.riw_merokok || extractValue(p5, ['merokok', 'rokok'], qmap5) || '-';
                const ppokNafas = p4.ppok?.nafas_pendek || extractValue(p5, ['nafas pendek', 'napas', 'sesak'], qmap5) || '-';
                return [i+1, p.pasien_snapshot?.nama, caUsus, caLain, tbBatuk, caParuRok, ppokNafas, p4.kulit?.kusta || '-', p4.kulit?.skabies || '-', p4.aktivitas_fisik || '-', p4.keterangan || p5.keterangan || p3.keterangan || '-']; 
            })`;

if (code.includes(oldLansia1)) {
    code = code.replace(oldLansia1, newLansia1);
}

fs.writeFileSync('Dashboard.jsx', code);
console.log('Successfully updated Dashboard.jsx with cross-compatible logic!');
