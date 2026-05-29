import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { createQrDataUrl } from './utils/qrCode';
import { safeBack } from './utils/navigation';
import { maskNik } from './utils/privacy';
import { STATUS_MAPPING } from './utils/constants';
import { canPrintFinalReport } from './features/workflow/workflowGuards';
import { getVisitReportById } from './services/reportService';
import EmptyState from './components/system/EmptyState';
import LoadingState from './components/system/LoadingState';

const LOGO_MALIMPUNG = "/logo_malimpung.png";

const extractValue = (posData, keywords, questionMap = {}) => {
    if (!posData) return null;
    const key = Object.keys(posData).find(k => {
        const keyText = k.toLowerCase();
        const questionText = String(questionMap[k] || '').toLowerCase();
        return keywords.some(kw => keyText.includes(kw) || questionText.includes(kw)) && !isPlaceholderValue(posData[k]);
    });
    return key ? posData[key] : null;
};

const extractFirstExamValue = (posData, keywordGroups = [], questionMap = {}) => {
    for (const keywords of keywordGroups) {
        const value = extractValue(posData, keywords, questionMap);
        if (value !== null && value !== undefined && !isPlaceholderValue(value)) return value;
    }
    return null;
};

const isPlaceholderValue = (value) => {
    const text = normalizePrintValue(value).toLowerCase();
    return !text || text.includes('data dummy') || text.includes('dummy lengkap') || text === 'undefined' || text.includes('undefined/');
};

const evalTensi = (td) => {
    if (!td || !td.includes('/')) return { status: 'Belum Diperiksa', color: 'text-slate-500', pos: 0 };
    const sys = parseInt(td.split('/')[0]);
    if (isNaN(sys)) return { status: 'Data Invalid', color: 'text-slate-500', pos: 0 };
    if (sys < 120) return { status: 'Normal', color: 'text-emerald-600', pos: 30, bar: 'bg-emerald-500' };
    if (sys >= 120 && sys <= 139) return { status: 'Prehipertensi', color: 'text-yellow-600', pos: 60, bar: 'bg-yellow-500' };
    return { status: 'Hipertensi', color: 'text-rose-600', pos: 85, bar: 'bg-rose-500' };
};

const evalGula = (gds, gdp) => {
    if (gdp && String(gdp).trim() !== '') {
        const val = parseFloat(gdp); if (isNaN(val)) return { nilai: '-', status: 'Invalid', color: 'text-slate-500', pos: 0 };
        if (val < 100) return { nilai: `${val} mg/dL`, status: 'Normal', color: 'text-emerald-600', pos: 30, bar: 'bg-emerald-500' };
        if (val >= 100 && val <= 125) return { nilai: `${val} mg/dL`, status: 'Prediabetes', color: 'text-yellow-600', pos: 60, bar: 'bg-yellow-500' };
        return { nilai: `${val} mg/dL`, status: 'Diabetes', color: 'text-rose-600', pos: 85, bar: 'bg-rose-500' };
    }
    if (gds && String(gds).trim() !== '') {
        const val = parseFloat(gds); if (isNaN(val)) return { nilai: '-', status: 'Invalid', color: 'text-slate-500', pos: 0 };
        if (val < 140) return { nilai: `${val} mg/dL`, status: 'Normal', color: 'text-emerald-600', pos: 30, bar: 'bg-emerald-500' };
        if (val >= 140 && val <= 199) return { nilai: `${val} mg/dL`, status: 'Prediabetes', color: 'text-yellow-600', pos: 60, bar: 'bg-yellow-500' };
        return { nilai: `${val} mg/dL`, status: 'Diabetes', color: 'text-rose-600', pos: 85, bar: 'bg-rose-500' };
    }
    return { nilai: '-', status: 'Tidak Diperiksa', color: 'text-slate-500', pos: 0, bar: 'bg-slate-300' };
};

const evalHbA1c = (hba1c) => {
    if (!hba1c || String(hba1c).trim() === '') return null;
    const val = parseFloat(hba1c);
    if (isNaN(val)) return null;
    if (val < 5.7) return { nilai: `${val}%`, status: 'Normal', color: 'text-emerald-600', pos: 30, bar: 'bg-emerald-500' };
    if (val <= 6.4) return { nilai: `${val}%`, status: 'Prediabetes', color: 'text-yellow-600', pos: 60, bar: 'bg-yellow-500' };
    return { nilai: `${val}%`, status: 'Diabetes', color: 'text-rose-600', pos: 85, bar: 'bg-rose-500' };
};

const hitungIMT = (tb, bb) => {
    const tinggiMeter = parseFloat(tb) / 100;
    const berat = parseFloat(bb);
    if (!tinggiMeter || !berat) return { nilai: '-', status: 'BELUM DIPERIKSA' };
    const nilai = (berat / (tinggiMeter * tinggiMeter)).toFixed(1);
    if (nilai < 18.5) return { nilai, status: 'KURUS' };
    if (nilai <= 24.9) return { nilai, status: 'NORMAL' };
    if (nilai <= 29.9) return { nilai, status: 'GEMUK' };
    return { nilai, status: 'OBESITAS' };
};

// Komponen Rangkuman Visual Universal (untuk Web dan Cetak)
const RangkumanCard = ({ icon, title, value, status, textColor, dotPos }) => {
    const isUnexamined = value === '-' || !value || String(status).toUpperCase().includes('BELUM DIPERIKSA') || dotPos === 0;
    
    return (
        <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between h-full shadow-sm print:shadow-none print:border-slate-300 print:p-3 print:rounded-xl">
            <div className="flex items-start gap-3 mb-5 print:mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0 print:w-9 print:h-9 print:text-lg">{icon}</div>
                <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5 print:text-[9px] print:mb-1">{title}</h4>
                    <p className="text-xl font-black text-slate-800 leading-none print:text-sm">{value}</p>
                    <p className={`text-[10px] font-black uppercase mt-1.5 print:text-[9px] print:mt-1 ${isUnexamined ? 'text-slate-400' : textColor}`}>
                        {isUnexamined ? 'BELUM DIPERIKSA' : status}
                    </p>
                </div>
            </div>
            {isUnexamined ? (
                <div className="w-full h-2 rounded-full bg-slate-200 mt-auto print:h-1.5"></div>
            ) : (
                <div className="w-full h-2 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 relative mt-auto print:h-1.5">
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-700 rounded-full shadow-md transition-all print:w-3 print:h-3" style={{ left: `calc(${dotPos}% - 8px)` }}></div>
                </div>
            )}
        </div>
    );
};

const normalizePrintValue = (rawVal) => {
    if (rawVal === null || rawVal === undefined) return '';
    if (typeof rawVal === 'object') {
        if (Array.isArray(rawVal)) return rawVal.filter(Boolean).join(', ');
        return Object.entries(rawVal).filter((entry) => entry[1]).map(([key, value]) => `${key}: ${value}`).join(', ');
    }
    return String(rawVal).trim();
};

const getPrintUnit = (name) => {
    const text = String(name || '').toLowerCase();
    if (text.includes('berat badan')) return 'kg';
    if (text.includes('sistol') || text.includes('diastol') || text.includes('tekanan darah')) return 'mmHg';
    if (text.includes('tinggi badan') || text.includes('panjang badan') || text.includes('lingkar')) return 'cm';
    if (text.includes('gula darah') || text.includes('kolesterol') || text.includes('ldl') || text.includes('hdl') || text.includes('trigliserida')) return 'mg/dL';
    if (text.includes('asam urat')) return 'mg/dL';
    if (text.includes('hemoglobin') || text === 'hb') return 'g/dL';
    if (text.includes('hba1c') || text.includes('hb1ac')) return '%';
    if (text.includes('aktivitas fisik') || text.includes('skor')) return 'skor';
    return '';
};

const getPrintNormal = (name, gender = '') => {
    const text = String(name || '').toLowerCase();
    const isFemale = gender === 'P';
    if (text.includes('indeks massa tubuh') || text.includes('index massa tubuh') || text.includes('imt')) return '18.5 - 22.9';
    if (text.includes('lingkar perut')) return isFemale ? '<80' : '<90';
    if (text.includes('gula darah sewaktu') || text.includes('gds')) return '70 - 139';
    if (text.includes('gula darah puasa') || text.includes('gdp')) return '<100';
    if (text.includes('kolesterol total')) return '<200';
    if (text.includes('hdl')) return isFemale ? '>=50' : '>=40';
    if (text.includes('ldl')) return '<100';
    if (text.includes('trigliserida')) return '<150';
    if (text.includes('asam urat')) return isFemale ? '<6.0' : '<7.0';
    if (text.includes('sistol')) return '<120';
    if (text.includes('diastol')) return '<80';
    if (text.includes('hemoglobin') || text === 'hb') return isFemale ? '12 - 15' : '13 - 17';
    if (text.includes('hba1c') || text.includes('hb1ac')) return '<5.7';
    if (text.includes('aktivitas fisik')) return 'Cukup';
    return '';
};

const getPrintRecommendation = (name, val) => {
    const text = `${name || ''} ${val || ''}`.toLowerCase();
    const valueText = String(val || '').toLowerCase();
    const isWarning = valueText === 'ya' || valueText.includes('positif') || valueText.includes('gangguan') || valueText.includes('risiko') || valueText.includes('obesitas') || valueText.includes('tinggi') || valueText.includes('kurang') || valueText.includes('abnormal');
    const isSafe = valueText === 'tidak' || valueText.includes('normal') || valueText.includes('negatif') || valueText.includes('aman') || valueText.includes('sehat');

    if (text.includes('merokok') && isWarning) return 'Berikan edukasi berhenti merokok dan hindari paparan asap rokok.';
    if (text.includes('paparan asap rokok') && isWarning) return 'Edukasi keluarga untuk menghindari paparan asap rokok di rumah.';
    if (text.includes('gula darah') && isWarning) return 'Anjurkan kontrol gula darah ulang dan konsultasi ke petugas kesehatan.';
    if ((text.includes('sistol') || text.includes('diastol') || text.includes('tekanan darah')) && isWarning) return 'Anjurkan pemantauan tekanan darah dan evaluasi faktor risiko hipertensi.';
    if ((text.includes('imt') || text.includes('lingkar perut') || text.includes('gizi')) && isWarning) return 'Anjurkan diet seimbang, aktivitas fisik, dan konsultasi gizi bila perlu.';
    if ((text.includes('tb') || text.includes('tuberkulosis') || text.includes('batuk')) && isWarning) return 'Lakukan evaluasi lanjutan sesuai alur skrining TB.';
    if ((text.includes('jiwa') || text.includes('cemas') || text.includes('depresi') || text.includes('kognitif')) && isWarning) return 'Pertimbangkan konseling atau pemeriksaan lanjutan sesuai indikasi.';
    if (text.includes('hepatitis') && isWarning) return 'Edukasi PHBS dan lakukan tindak lanjut sesuai alur hepatitis.';
    if (isSafe) return 'Pertahankan perilaku hidup sehat dan lakukan skrining berkala.';
    return '';
};

const getResultTextColor = (val) => {
    const text = String(val || '').toLowerCase();
    if (text === 'tidak' || text.includes('normal') || text.includes('negatif') || text.includes('aman') || text.includes('sehat') || text.includes('cukup') || text.includes('mandiri')) return 'text-emerald-600';
    if (text === 'ya' || text.includes('positif') || text.includes('gangguan') || text.includes('risiko') || text.includes('obesitas') || text.includes('diabetes') || text.includes('tinggi') || text.includes('kurang')) return 'text-rose-600';
    if (text.includes('tidak diperiksa') || text === '-') return 'text-slate-400';
    return 'text-slate-800';
};

const chunkPrintRows = (rows, firstPageLimit = 13, nextPageLimit = 24) => {
    const pages = [];
    let index = 0;
    let limit = firstPageLimit;
    while (index < rows.length) {
        let end = Math.min(index + limit, rows.length);
        if (rows[end - 1]?.isHeader && end < rows.length) end -= 1;
        pages.push(rows.slice(index, end));
        index = end;
        limit = nextPageLimit;
    }
    return pages.length ? pages : [[]];
};

function RaporDigital() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const fallbackPetugas = searchParams.get('petugas') || user?.nama || '';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        const fetchRapor = async () => {
            if (!id) {
                setData(null);
                setLoading(false);
                document.title = `Rapor Tidak Ditemukan - PKM Malimpung`;
                return;
            }

            try {
                const docData = await getVisitReportById(id);
                if (docData) {
                    setData(docData);
                    document.title = `Rapor CKG ${docData.pasien_snapshot?.nama || 'Anonim'} - PKM Malimpung`;
                } else {
                    setData(null);
                    document.title = `Rapor Tidak Ditemukan - PKM Malimpung`;
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        }; fetchRapor();
        
        return () => { document.title = "TERSANJUNG - Puskesmas Malimpung"; };
    }, [id]);

    useEffect(() => {
        let isActive = true;
        createQrDataUrl(window.location.href)
            .then((dataUrl) => {
                if (isActive) setQrCodeUrl(dataUrl);
            })
            .catch(() => {
                if (isActive) setQrCodeUrl('');
            });

        return () => {
            isActive = false;
        };
    }, []);

    if (loading) return <LoadingState title="Menyusun Rapor Kesehatan..." className="min-h-screen" />;
    if (!data) return <EmptyState icon="?" title="Data Rapor tidak ditemukan." description="Pastikan tautan rapor benar atau buka kembali dari dashboard pemeriksaan." className="min-h-screen" />;

    // --- EKSTRAKSI DATA INDIKATOR UTAMA ---
    const directTd = data.pos2?.td;
    const sistolik = extractValue(data.pos2, ['sistolik'], data.pos2_question_map) || (String(directTd || '').includes('/') ? String(directTd).split('/')[0] : '');
    const diastolik = extractValue(data.pos2, ['diastolik'], data.pos2_question_map) || (String(directTd || '').includes('/') ? String(directTd).split('/')[1] : '');
    const tensiField = sistolik && diastolik ? `${sistolik}/${diastolik}` : directTd || '-';
    const tensiData = evalTensi(tensiField);

    const gds = extractFirstExamValue(data.pos2, [['gula darah sewaktu'], ['gds']], data.pos2_question_map) || extractFirstExamValue(data.pos4, [['gula darah sewaktu'], ['gds']], data.pos4_question_map);
    const gdp = extractFirstExamValue(data.pos2, [['gula darah puasa'], ['gdp']], data.pos2_question_map) || extractFirstExamValue(data.pos4, [['gula darah puasa'], ['gdp']], data.pos4_question_map);
    const hba1c = extractFirstExamValue(data.pos2, [['hba1c'], ['hb1ac'], ['gula darah lanjutan']], data.pos2_question_map) || extractFirstExamValue(data.pos4, [['hba1c'], ['hb1ac'], ['gula darah lanjutan']], data.pos4_question_map);
    const gulaData = evalGula(gds, gdp);
    const gulaDisplayData = gulaData.nilai !== '-' ? gulaData : (evalHbA1c(hba1c) || gulaData);

    // IMT Parsing
    const tinggiBadan = extractFirstExamValue(data.pos2, [['tinggi badan'], ['pengukuran tinggi badan'], ['panjang badan']], data.pos2_question_map);
    const beratBadan = extractFirstExamValue(data.pos2, [['berat badan']], data.pos2_question_map);
    const imtHitung = hitungIMT(tinggiBadan, beratBadan);
    const computedImt = imtHitung.nilai !== '-' ? `${imtHitung.nilai} (${imtHitung.status})` : '';
    const imtValFull = extractFirstExamValue(data.pos2, [['index massa tubuh'], ['indeks massa tubuh'], ['imt/u'], ['imt']], data.pos2_question_map) || computedImt || '-';
    let imtValue = '-'; let imtStatus = 'BELUM DIPERIKSA'; let imtColor = 'text-slate-500'; let imtPos = 0;
    if (imtValFull !== '-') {
        const parts = imtValFull.split(' ');
        imtValue = parts[0];
        imtStatus = parts.slice(1).join(' ').replace(/[()]/g, '') || 'NORMAL';
        imtColor = imtStatus.includes('GEMUK') || imtStatus.includes('OBESITAS') || imtStatus.includes('KURUS') ? 'text-rose-600' : 'text-emerald-600';
        imtPos = imtStatus.includes('NORMAL') ? 40 : (imtStatus.includes('KURUS') ? 15 : 85);
    }

    // TB Parsing
    const tbParuRaw = extractValue(data.pos5, ['batuk', 'tb', 'tbc'], data.pos5_question_map);
    let tbValue = '-'; let tbStatus = 'BELUM DIPERIKSA'; let tbColor = 'text-slate-500'; let tbPos = 0;
    if (tbParuRaw) {
        if (String(tbParuRaw).toLowerCase() === 'ya') {
            tbValue = 'Risiko'; tbStatus = 'RISIKO'; tbColor = 'text-rose-600'; tbPos = 85;
        } else {
            tbValue = 'Aman'; tbStatus = 'AMAN'; tbColor = 'text-emerald-600'; tbPos = 15;
        }
    }

    const tglPeriksa = new Date(data.waktu_ambil_tiket?.toDate() || Date.now());
    const tglString = tglPeriksa.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}).toUpperCase();
    const tglPanjang = tglPeriksa.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
    const waktuString = tglPeriksa.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) + ' WITA';
    
    const getPrintRows = () => {
        const rows = [];
        const gender = data.pasien_snapshot?.j_kelamin;
        const addPos = (posData, mapData, catName) => {
            if (!posData) return;
            const keys = Object.keys(posData).filter((key) => !key.startsWith('waktu_') && key !== 'petugas');
            const detailRows = keys.map((key) => {
                const val = normalizePrintValue(posData[key]);
                if (!val || isPlaceholderValue(val)) return null;
                const name = mapData && mapData[key] ? mapData[key] : key;
                return {
                    name,
                    val,
                    normal: getPrintNormal(name, gender),
                    unit: getPrintUnit(name),
                    recommendation: getPrintRecommendation(name, val)
                };
            }).filter(Boolean);
            if (detailRows.length === 0) return;
            rows.push({ isHeader: true, name: catName });
            rows.push(...detailRows);
        };

        addPos(data.pos2, data.pos2_question_map, "Gizi, Antropometri, Tekanan Darah & Gula Darah");
        addPos(data.pos3, data.pos3_question_map, "Kesehatan Indera, Gigi & Mulut");
        addPos(data.pos4, data.pos4_question_map, "Laboratorium & Infeksi");
        addPos(data.pos5, data.pos5_question_map, "Perilaku, PTM, TB & Kanker");
        addPos(data.pos6, data.pos6_question_map, "Kesehatan Jiwa, Kognitif, Lansia & Gizi");
        return rows;
    };
    const printRows = getPrintRows();
    const isKunjunganRumah = String(data.jalur_pemeriksaan || '').toLowerCase().includes('kunjungan rumah');
    const printPages = chunkPrintRows(printRows);
    const canPrintOfficialReport = canPrintFinalReport(data) || data.status_antrian === STATUS_MAPPING.SELESAI;
    const handlePrint = () => {
        if (!canPrintOfficialReport) return;
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans relative">
            
            <style type="text/css" media="print">
            {`
                @page { size: A4 portrait; margin: 0; }
                body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .print-hidden { display: none !important; }
                .rapor-print-area { display: block !important; position: static; width: 210mm; margin: 0; padding: 0; background-color: white !important; }
                .print-sheet { position: relative; width: 210mm; min-height: 296mm; padding: 32mm 10mm 26mm 10mm; page-break-after: always; background: white !important; overflow: hidden; }
                .print-sheet:last-child { page-break-after: auto; }
                .print-page-header {
                    position: absolute; top: 0; left: 0; right: 0; height: 30mm;
                    background: #10a892 !important; color: white !important;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 10mm; z-index: 50;
                }
                .print-page-footer {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 24mm;
                    background: #10a892 !important; color: white !important;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 10mm; z-index: 50;
                }
                .print-content { padding: 0; }
                table { border-collapse: collapse; width: 100%; font-size: 10px; }
                th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
                th { background-color: #f8fafc !important; font-weight: 900; color: #475569; text-transform: uppercase; font-size: 8px; letter-spacing: 1px; }
                td { color: #1e293b; font-weight: 600; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                .print-detail-table { font-size: 8px; }
                .print-detail-table th { padding: 6px 7px; }
                .print-detail-table td { padding: 5px 7px; vertical-align: top; line-height: 1.25; }
                .print-detail-table tr { page-break-inside: avoid; break-inside: avoid; }
                .print-section-row td { background: #f1f5f9 !important; color: #0f766e; font-size: 8px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
                .print-avoid-break { page-break-inside: avoid; break-inside: avoid; }
            `}
            </style>

            {/* --- TAMPILAN MOBILE & WEB KOMPREHENSIF --- */}
            <div className="print-hidden min-h-screen bg-white pb-28">
                <div className="bg-gradient-to-r from-[#12b8ad] to-[#029876] text-white px-4 py-3 md:px-8 md:py-4 shadow-sm">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/70">
                                <img src={LOGO_MALIMPUNG} alt="Logo" className="h-7 w-7 object-contain" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-black leading-tight md:text-xl">Rapor Kesehatan</h1>
                                <p className="truncate text-[10px] font-semibold text-white/90 md:text-xs">Tanggal diperbarui: {tglPanjang}</p>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <button onClick={() => safeBack(navigate, '/dashboard')} className="rounded-lg bg-white/15 px-3 py-2 text-[10px] font-black text-white ring-1 ring-white/35 hover:bg-white/25 md:px-4">
                                Kembali
                            </button>
                            <button
                                onClick={handlePrint}
                                disabled={!canPrintOfficialReport}
                                className="rounded-lg bg-white px-3 py-2 text-[10px] font-black text-[#078b78] shadow-sm hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 md:px-4"
                            >
                                Unduh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 py-5 md:px-8">
                    <div className="mb-6 flex items-center gap-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-teal-100 bg-teal-50 text-3xl shadow-sm text-teal-700">
                            {data.pasien_snapshot?.j_kelamin === 'P' ? '👩' : '👨'}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-black uppercase text-slate-900">{data.pasien_snapshot?.nama || 'Anonim'}</h2>
                                <span className="text-[10px] font-bold text-teal-600">Detail data</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] font-semibold text-slate-600 md:grid-cols-5">
                                <span>NIK: {maskNik(data.patientNIK)}</span>
                                <span>Tgl lahir: {data.pasien_snapshot?.tgl_lahir || '-'}</span>
                                <span>Usia: {data.umur_saat_periksa || '-'} tahun</span>
                                <span>Kategori: {data.kategori_usia_satusehat || '-'}</span>
                                <span>Lokasi: PKM Malimpung</span>
                            </div>
                        </div>
                    </div>

                    {/* VIsual Rangkuman Section (Sesuai Screenshot Terbaru) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        <RangkumanCard icon="❤️" title="Tensi" value={tensiField} status={tensiData.status} textColor={tensiData.color} dotPos={tensiData.pos} />
                        <RangkumanCard icon="🩸" title="Gula Darah" value={gulaDisplayData.nilai} status={gulaDisplayData.status} textColor={gulaDisplayData.color} dotPos={gulaDisplayData.pos} />
                        <RangkumanCard icon="⚖️" title="IMT / Gizi" value={imtValue} status={imtStatus} textColor={imtColor} dotPos={imtPos} />
                        <RangkumanCard icon="🫁" title="TB/Paru" value={tbValue} status={tbStatus} textColor={tbColor} dotPos={tbPos} />
                    </div>

                    <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                        <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-800">Kesimpulan & Edukasi</h3>
                        <p className="text-sm font-semibold leading-relaxed text-slate-700">{data.kesimpulan_dokter || data.pos5?.keterangan || 'Tidak ada catatan klinis khusus. Pasien dalam batas normal. Tetap pertahankan pola hidup sehat.'}</p>
                    </section>

                    {!canPrintOfficialReport && (
                        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                            Rapor ini masih mode pratinjau. Cetak/unduh rapor resmi aktif setelah pemeriksaan difinalisasi di Pos 7.
                        </section>
                    )}

                    <h3 className="mb-3 text-sm font-black text-slate-900">Hasil Pemeriksaan Detail</h3>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full border-collapse text-[12px]">
                            <thead>
                                <tr className="bg-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-600">
                                    <th className="border-b border-slate-300 px-4 py-3 font-black">Nama Pemeriksaan</th>
                                    <th className="border-b border-slate-300 px-4 py-3 font-black">Hasil</th>
                                    <th className="border-b border-slate-300 px-4 py-3 font-black">Nilai Normal</th>
                                    <th className="border-b border-slate-300 px-4 py-3 font-black">Satuan</th>
                                    <th className="border-b border-slate-300 px-4 py-3 font-black">Rekomendasi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {printRows.map((row, idx) => row.isHeader ? (
                                    <tr key={`web-section-${idx}`}>
                                        <td colSpan="5" className="border-b border-slate-100 bg-white px-4 pb-2 pt-5 text-[11px] font-black text-slate-900">{row.name}</td>
                                    </tr>
                                ) : (
                                    <tr key={`web-row-${idx}`} className="align-top hover:bg-slate-50">
                                        <td className="border-b border-slate-100 px-4 py-2.5 font-semibold text-slate-700">{row.name}</td>
                                        <td className={`border-b border-slate-100 px-4 py-2.5 font-bold ${getResultTextColor(row.val)}`}>{row.val}</td>
                                        <td className="border-b border-slate-100 px-4 py-2.5 text-slate-600">{row.normal || '-'}</td>
                                        <td className="border-b border-slate-100 px-4 py-2.5 text-slate-600">{row.unit || '-'}</td>
                                        <td className="border-b border-slate-100 px-4 py-2.5 leading-relaxed text-slate-600">{row.recommendation || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-3 md:hidden">
                        {printRows.map((row, idx) => row.isHeader ? (
                            <h4 key={`mobile-section-${idx}`} className="pt-4 text-[12px] font-black uppercase tracking-wide text-slate-900">{row.name}</h4>
                        ) : (
                            <article key={`mobile-row-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{row.name}</p>
                                <p className={`mt-2 text-sm font-black leading-snug ${getResultTextColor(row.val)}`}>{row.val}</p>
                                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                                    <div>
                                        <p className="font-black uppercase text-slate-400">Nilai Normal</p>
                                        <p className="mt-1 font-semibold text-slate-700">{row.normal || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="font-black uppercase text-slate-400">Satuan</p>
                                        <p className="mt-1 font-semibold text-slate-700">{row.unit || '-'}</p>
                                    </div>
                                </div>
                                {row.recommendation && (
                                    <p className="mt-3 border-t border-slate-100 pt-3 text-[12px] font-semibold leading-relaxed text-slate-600">{row.recommendation}</p>
                                )}
                            </article>
                        ))}
                    </div>
                </div>

                <div className="fixed bottom-6 left-0 z-40 flex w-full justify-center px-4 md:hidden">
                    <button
                        onClick={handlePrint}
                        disabled={!canPrintOfficialReport}
                        className="flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-6 py-4 text-sm font-black text-white shadow-2xl transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        CETAK LAPORAN (PDF)
                    </button>
                </div>
            </div>

            {/* --- TAMPILAN CETAK A4 --- */}
            <div className="rapor-print-area hidden font-sans mx-auto text-slate-800">
                {printPages.map((pageRows, pageIndex) => (
                    <section key={`print-page-${pageIndex}`} className="print-sheet">
                        <div className="print-page-header">
                            <div className="flex items-center gap-6">
                                <div className="bg-white p-2 rounded-xl shrink-0"><img src={LOGO_MALIMPUNG} alt="Logo" className="w-12 h-12 object-contain" /></div>
                                <div>
                                    <h1 className="text-xl font-black tracking-wider uppercase mb-1">Rapor Kesehatan</h1>
                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-90">Tanggal diperbarui: {tglString}, {waktuString}</p>
                                </div>
                            </div>
                            <div className="text-right text-[8px] font-black uppercase tracking-widest">
                                <p>Puskesmas Malimpung</p>
                                <p className="mt-1 opacity-80">CKG Terintegrasi</p>
                            </div>
                        </div>

                        <div className="print-page-footer">
                            <div className="w-[82%]">
                                <p className="text-[8px] font-bold leading-relaxed opacity-95">
                                    Hasil pemeriksaan merupakan hasil yang dikeluarkan dan dipertanggungjawabkan oleh Puskesmas Malimpung.<br/>Didukung oleh program layanan Cek Kesehatan Gratis.
                                </p>
                                <p className="mt-1 text-[8px] font-black uppercase tracking-widest opacity-90">Halaman {pageIndex + 1} / {printPages.length}</p>
                            </div>
                            <div className="bg-white p-1 rounded border-2 border-white">
                                {qrCodeUrl ? <img src={qrCodeUrl} alt="QR" className="w-[17mm] h-[17mm]" /> : <div className="w-[17mm] h-[17mm] bg-slate-100" />}
                            </div>
                        </div>

                        {pageIndex === 0 && (
                            <>
                                <div className="flex items-center gap-5 mb-4 print-avoid-break">
                                    <div className="w-14 h-14 bg-amber-100 border-2 border-amber-200 rounded-full flex items-center justify-center text-3xl shrink-0">{data.pasien_snapshot?.j_kelamin === 'P' ? '👩' : '👨'}</div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-wide text-slate-800">{data.pasien_snapshot?.nama || 'Anonim'}</h2>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">NIK: {data.patientNIK}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 mb-5 print-avoid-break">
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TGL LAHIR</p><p className="text-xs font-black text-slate-800">{data.pasien_snapshot?.tgl_lahir || '-'}</p></div>
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">KATEGORI USIA</p><p className="text-xs font-black text-slate-800 capitalize">{data.kategori_usia_satusehat} ({data.umur_saat_periksa} Thn)</p></div>
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">LOKASI MCU</p><p className="text-xs font-black text-slate-800">PKM Malimpung</p></div>
                                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ALAMAT ASAL</p><p className="text-xs font-black text-slate-800 truncate">{data.pasien_snapshot?.alamat || [data.pasien_snapshot?.dusun, data.pasien_snapshot?.desa].filter(Boolean).join(', ') || '-'}</p></div>
                                </div>

                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2">1. RANGKUMAN INDIKATOR KRITIS</h3>
                                <div className="grid grid-cols-4 gap-3 mb-5 print-avoid-break">
                                    <RangkumanCard icon="❤️" title="Tensi" value={tensiField} status={tensiData.status} textColor={tensiData.color} dotPos={tensiData.pos} />
                                    <RangkumanCard icon="🩸" title="Gula Darah" value={gulaDisplayData.nilai} status={gulaDisplayData.status} textColor={gulaDisplayData.color} dotPos={gulaDisplayData.pos} />
                                    <RangkumanCard icon="⚖️" title="IMT / Gizi" value={imtValue} status={imtStatus} textColor={imtColor} dotPos={imtPos} />
                                    <RangkumanCard icon="🫁" title="TB/Paru" value={tbValue} status={tbStatus} textColor={tbColor} dotPos={tbPos} />
                                </div>
                            </>
                        )}

                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2">{pageIndex === 0 ? '2.' : ''} HASIL PEMERIKSAAN DETAIL</h3>
                        <table className="print-detail-table">
                            <thead><tr><th className="w-[31%]">Nama Pemeriksaan</th><th className="w-[17%]">Hasil</th><th className="w-[13%]">Nilai Normal</th><th className="w-[9%]">Satuan</th><th>Rekomendasi</th></tr></thead>
                            <tbody>
                                {pageRows.map((row, idx) => row.isHeader ? (
                                    <tr key={`section-page-${pageIndex}-${idx}`} className="print-section-row"><td colSpan="5">{row.name}</td></tr>
                                ) : (
                                    <tr key={`row-page-${pageIndex}-${idx}`}><td className="font-bold text-slate-700">{row.name}</td><td className="font-black text-slate-800">{row.val}</td><td>{row.normal || '-'}</td><td>{row.unit || '-'}</td><td>{row.recommendation || '-'}</td></tr>
                                ))}
                                {pageIndex === printPages.length - 1 && (
                                    <tr><td className="font-bold text-rose-700 bg-rose-50/30">Kesimpulan Dokter</td><td colSpan="4" className="font-black italic bg-rose-50/30">{data.kesimpulan_dokter || 'Dalam batas normal/Tidak ada keluhan'}</td></tr>
                                )}
                            </tbody>
                        </table>

                        {pageIndex === printPages.length - 1 && (
                            <div className="print-avoid-break mt-8">
                                <div className="w-full border-t border-dashed border-slate-300 mb-5"></div>
                                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-6">TIM MEDIS & VALIDASI PEMERIKSAAN</h3>
                                {isKunjunganRumah ? (
                                    <div className="mx-auto w-[45%] text-center"><p className="text-[6px] text-slate-400 uppercase mb-8">Petugas/Nakes Kunjungan Rumah</p><p className="border-t border-slate-300 pt-2 text-[8px] font-black uppercase text-slate-800">{data.dokter_pemeriksa || data.petugas_pos7 || data.petugas || fallbackPetugas || '_____'}</p></div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-1 items-end px-2">
                                        <div className="text-center"><p className="text-[6px] text-slate-400 uppercase mb-7">POS 1<br/>PENDAFTARAN</p><p className="border-t border-slate-200 pt-1 text-[7px] font-black uppercase text-slate-800">{data.petugas_pos1 || data.petugas || '_____'}</p></div>
                                        <div className="text-center"><p className="text-[6px] text-slate-400 uppercase mb-7">POS 2<br/>FISIK/ANTRO</p><p className="border-t border-slate-200 pt-1 text-[7px] font-black uppercase text-slate-800">{data.petugas_pos2 || data.pos2?.petugas || data.petugas || '_____'}</p></div>
                                        <div className="text-center"><p className="text-[6px] text-slate-400 uppercase mb-7">POS 3<br/>INDERA/GIGI</p><p className="border-t border-slate-200 pt-1 text-[7px] font-black uppercase text-slate-800">{data.petugas_pos3 || data.pos3?.petugas || data.petugas || '_____'}</p></div>
                                        <div className="text-center"><p className="text-[6px] text-slate-400 uppercase mb-7">POS 4<br/>LABORATORIUM</p><p className="border-t border-slate-200 pt-1 text-[7px] font-black uppercase text-slate-800">{data.petugas_pos4 || data.pos4?.petugas || data.petugas || '_____'}</p></div>
                                        <div className="text-center"><p className="text-[6px] text-slate-400 uppercase mb-7">POS 5<br/>SKRINING PTM</p><p className="border-t border-slate-200 pt-1 text-[7px] font-black uppercase text-slate-800">{data.petugas_pos5 || data.pos5?.petugas || data.petugas || '_____'}</p></div>
                                        <div className="text-center"><p className="text-[6px] text-slate-400 uppercase mb-7">POS 6<br/>JIWA/LANSIA</p><p className="border-t border-slate-200 pt-1 text-[7px] font-black uppercase text-slate-800">{data.petugas_pos6 || data.pos6?.petugas || data.petugas || '_____'}</p></div>
                                        <div className="text-center"><p className="text-[6px] text-slate-400 uppercase mb-7">POS 7<br/>KESIMPULAN DOKTER</p><p className="border-t border-slate-200 pt-1 text-[7px] font-black uppercase text-slate-800">{data.dokter_pemeriksa || fallbackPetugas || data.petugas || '_____'}</p></div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
}

export default RaporDigital;
