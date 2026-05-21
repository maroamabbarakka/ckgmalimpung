// File ini mengekspor Helper untuk Export PKG berdasarkan string header
const extractValue = (posData, keywords, questionMap = {}) => {
    if (!posData) return null;
    const key = Object.keys(posData).find(k => {
        const keyText = k.toLowerCase();
        const questionText = String(questionMap[k] || '').toLowerCase();
        return keywords.some(kw => keyText.includes(kw) || questionText.includes(kw));
    });
    return key ? posData[key] : null;
};

const firstValue = (...values) => values.find(v => v !== undefined && v !== null && String(v).trim() !== '');

const formatDate = (value) => {
    if (!value) return '';
    if (value?.toDate) return value.toDate().toLocaleDateString('id-ID');
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toLocaleDateString('id-ID');
    return '';
};

const getTanggalPemeriksaan = (visit) => (
    visit.tanggal_pelaksanaan ||
    formatDate(visit.tanggal_kunjungan) ||
    formatDate(visit.waktu_selesai_total) ||
    formatDate(visit.waktu_ambil_tiket) ||
    formatDate(visit.created_at)
);

const splitTekananDarah = (value) => {
    const text = String(value || '');
    if (!text.includes('/')) return { sys: text, dia: '' };
    const [sys, dia] = text.split('/');
    return { sys: sys || '', dia: dia || '' };
};

export const getPkgValue = (visit, headerString) => {
    if (!headerString) return '';
    const h = String(headerString).toLowerCase().trim();
    
    // Identitas Faskes
    if (h.includes('provinsi') || h.includes('kabupaten') || h.includes('faskes')) return '';

    // Data Diri
    if (h === 'no') return ''; // Di-handle di loop array
    if (h.includes('desa') || h.includes('kelurahan')) return visit.pasien_snapshot?.desa || visit.pasien_snapshot?.kelurahan || visit.desa_pelaksanaan || visit.pasien_snapshot?.alamat || '';
    if (h.includes('dusun') || h.includes('lingkungan')) return visit.pasien_snapshot?.dusun || visit.tempat_pelaksanaan || '';
    if (h.includes('tanggal pemeriksaan')) return getTanggalPemeriksaan(visit);
    if (h === 'nik' || h === 'nik ') return visit.patientNIK || '';
    if (h.includes('nama lengkap') || h === 'nama') return visit.pasien_snapshot?.nama || '';
    if (h.includes('tanggal lahir')) return visit.pasien_snapshot?.tgl_lahir || '';
    if (h.includes('jenis kelamin')) return visit.pasien_snapshot?.j_kelamin || '';
    if (h === 'no wa') return visit.pasien_snapshot?.no_hp || '';
    if (h.includes('status perkawinan')) return visit.pasien_snapshot?.status || visit.status_perkawinan || 'Menikah';
    if (h.includes('rencana menikah')) return ''; // Kosongkan

    const p2 = visit.pos2 || {}; const qmap2 = visit.pos2_question_map || {};
    const p3 = visit.pos3 || {}; const qmap3 = visit.pos3_question_map || {};
    const p4 = visit.pos4 || {}; const qmap4 = visit.pos4_question_map || {};
    const p5 = visit.pos5 || {}; const qmap5 = visit.pos5_question_map || {};
    const p6 = visit.pos6 || {}; const qmap6 = visit.pos6_question_map || {};

    // Fisik
    const bb = firstValue(p2.bb, extractValue(p2, ['berat badan (kg)', 'berat badan'], qmap2));
    const tb = firstValue(p2.tb, extractValue(p2, ['tinggi badan (cm)', 'tinggi badan'], qmap2));
    const lp = firstValue(p2.lp, extractValue(p2, ['lingkar perut'], qmap2));
    const td = firstValue(p2.td, extractValue(p2, ['tekanan darah'], qmap2));
    const sistolik = firstValue(extractValue(p2, ['sistolik'], qmap2), splitTekananDarah(td).sys);
    const diastolik = firstValue(extractValue(p2, ['diastolik'], qmap2), splitTekananDarah(td).dia);
    const gds = firstValue(p4.gds, extractValue(p4, ['gula darah sewaktu', 'gds'], qmap4), p2.gds, extractValue(p2, ['gula darah sewaktu', 'gds'], qmap2));
    const gdp = firstValue(p4.gdp, extractValue(p4, ['gula darah puasa', 'gdp'], qmap4), p2.gdp, extractValue(p2, ['gula darah puasa', 'gdp'], qmap2));

    if (h.includes('berat badan (kg)')) return bb || '';
    if (h.includes('tinggi badan (cm)')) return tb || '';
    if (h.includes('massa tubuh')) {
        if(bb && tb) return (parseFloat(bb) / Math.pow(parseFloat(tb)/100, 2)).toFixed(1);
        return '';
    }
    if (h.includes('lingkar perut')) return lp || '';
    if (h.includes('sistolik')) return sistolik || '';
    if (h.includes('diastolik')) return diastolik || '';
    if (h.includes('hasil tekanan darah')) {
        const sys = parseInt(sistolik || 0);
        if (sys >= 140) return 'Hipertensi';
        if (sys >= 120) return 'Prehipertensi';
        return sys > 0 ? 'Normal' : '';
    }

    // Gula
    if (h.includes('sewaktu') && h.includes('gula')) return gds || '';
    if (h.includes('puasa (gdp)')) return gdp || '';
    if (h.includes('gula darah 2 jam')) return '';
    if (h.includes('metode pemeriksaan') && h.includes('gula')) return 'Kapiler';

    // Jiwa SRQ
    if (h.includes('bersemangat')) return p3.jiwa_srq20?.tdk_semangat || p6.jiwa_srq20?.tdk_semangat || extractValue(p6, ['semangat'], qmap6) || extractValue(p3, ['semangat'], qmap3) || 'Tidak';
    if (h.includes('murung')) return p3.jiwa_srq20?.murung || p6.jiwa_srq20?.murung || extractValue(p6, ['murung'], qmap6) || extractValue(p3, ['murung'], qmap3) || 'Tidak';
    if (h.includes('gugup') || h.includes('cemas')) return p3.jiwa_srq20?.gugup || p6.jiwa_srq20?.gugup || extractValue(p6, ['cemas', 'gugup'], qmap6) || extractValue(p3, ['cemas', 'gugup'], qmap3) || 'Tidak';
    if (h.includes('gejala depresi')) return (p3.jiwa_srq20?.murung === 'Ya' || p6.jiwa_srq20?.murung === 'Ya') ? 'Ya' : 'Tidak';
    if (h.includes('gejala kecemasan')) return (p3.jiwa_srq20?.gugup === 'Ya' || p6.jiwa_srq20?.gugup === 'Ya') ? 'Ya' : 'Tidak';

    // Rokok & PPOK
    if (h.includes('merokok dalam setahun') || h.includes('apakah anda merokok')) return p4.resiko_ca_paru?.riw_merokok || p5.merokok?.status || extractValue(p5, ['rokok', 'merokok'], qmap5) || extractValue(p4, ['rokok', 'merokok'], qmap4) || 'Tidak';
    if (h.includes('terpapar asap') || h.includes('menghirup asap')) return p4.resiko_ca_paru?.terpapar_asap || extractValue(p5, ['asap', 'orang lain'], qmap5) || extractValue(p4, ['asap', 'orang lain'], qmap4) || 'Tidak';

    // Kanker
    if (h.includes('usus')) return p3.skrining_kanker?.ca_usus || p5.skrining_kanker?.ca_usus || extractValue(p5, ['usus'], qmap5) || extractValue(p4, ['usus'], qmap4) || 'Tidak';
    if (h.includes('payudara') && !h.includes('serviks')) return p3.skrining_kanker?.ca_payudara || p5.skrining_kanker?.ca_payudara || extractValue(p5, ['payudara', 'sadanis'], qmap5) || extractValue(p4, ['payudara', 'sadanis'], qmap4) || 'Tidak';
    if (h.includes('serviks') && !h.includes('payudara')) return p3.skrining_kanker?.ca_serviks || p5.skrining_kanker?.ca_serviks || extractValue(p5, ['serviks'], qmap5) || extractValue(p4, ['serviks'], qmap4) || 'Tidak';
    if (h.includes('iva')) return p3.reproduksi_wanita?.iva || p3.reproduksi_wanita?.hpv_dna || p5.reproduksi_wanita?.iva || extractValue(p5, ['iva', 'hpv'], qmap5) || extractValue(p4, ['iva', 'hpv'], qmap4) || 'Tidak';
    
    // PPOK & Paru
    if (h.includes('tuberkulosis') && h.includes('kontak')) return p4.resiko_tb?.kontak || p5.resiko_tb?.kontak || extractValue(p5, ['kontak'], qmap5) || extractValue(p4, ['kontak'], qmap4) || 'Tidak';
    if (h.includes('batuk') && h.includes('2 minggu')) return p4.resiko_tb?.batuk_lama || p5.resiko_tb?.batuk || extractValue(p5, ['batuk'], qmap5) || extractValue(p4, ['batuk'], qmap4) || 'Tidak';
    if (h.includes('hasil pemeriksaan bta') || h.includes('tcm')) return '-'; // Biasanya belum ada
    
    // Indera
    if (h.includes('tajam penglihatan (snellen') || h.includes('snellen chart')) return p3.mata?.visus || extractValue(p3, ['snellen', 'visus'], qmap3) || '-';
    if (h.includes('otoskop')) return p3.telinga?.infeksi || extractValue(p3, ['otoskop', 'infeksi'], qmap3) || '-';
    if (h.includes('tajam pendengaran')) return p3.telinga?.gg_pendengaran || extractValue(p3, ['pendengaran'], qmap3) || '-';

    // Gigi
    if (h.includes('karies')) return p2.skrining_gigi?.karies || p2.skrining_gigi?.lubang || extractValue(p3, ['karies'], qmap3) || '-';
    if (h.includes('hilang/dicabut') || h.includes('hilang')) return p2.skrining_gigi?.hilang || extractValue(p3, ['hilang', 'dicabut'], qmap3) || '-';

    // Hepatitis & Sifilis
    if (h.includes('hepatitis b')) return p3.catin?.hbsag || p4.hepatitis?.transfusi || extractValue(p4, ['hepatitis', 'hbsag'], qmap4) || '-';
    if (h.includes('sifilis')) return p3.catin?.sifilis || extractValue(p4, ['sifilis'], qmap4) || '-';
    if (h.includes('hiv')) return p3.catin?.hiv || extractValue(p4, ['hiv'], qmap4) || '-';

    // Default
    return firstValue(
        extractValue(p2, [h], qmap2),
        extractValue(p3, [h], qmap3),
        extractValue(p4, [h], qmap4),
        extractValue(p5, [h], qmap5),
        extractValue(p6, [h], qmap6)
    ) || '-';
};
