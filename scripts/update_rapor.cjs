const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const LOGO_MALIMPUNG = "/logo_malimpung.png";

const extractValue = (posData, keywords, questionMap = {}) => {
    if (!posData) return null;
    const key = Object.keys(posData).find(k => {
        const keyText = k.toLowerCase();
        const questionText = String(questionMap[k] || '').toLowerCase();
        return keywords.some(kw => keyText.includes(kw) || questionText.includes(kw));
    });
    return key ? posData[key] : null;
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
        if (val < 100) return { nilai: \`\${val} mg/dL\`, status: 'Normal', color: 'text-emerald-600', pos: 30, bar: 'bg-emerald-500' };
        if (val >= 100 && val <= 125) return { nilai: \`\${val} mg/dL\`, status: 'Prediabetes', color: 'text-yellow-600', pos: 60, bar: 'bg-yellow-500' };
        return { nilai: \`\${val} mg/dL\`, status: 'Diabetes', color: 'text-rose-600', pos: 85, bar: 'bg-rose-500' };
    }
    if (gds && String(gds).trim() !== '') {
        const val = parseFloat(gds); if (isNaN(val)) return { nilai: '-', status: 'Invalid', color: 'text-slate-500', pos: 0 };
        if (val < 140) return { nilai: \`\${val} mg/dL\`, status: 'Normal', color: 'text-emerald-600', pos: 30, bar: 'bg-emerald-500' };
        if (val >= 140 && val <= 199) return { nilai: \`\${val} mg/dL\`, status: 'Prediabetes', color: 'text-yellow-600', pos: 60, bar: 'bg-yellow-500' };
        return { nilai: \`\${val} mg/dL\`, status: 'Diabetes', color: 'text-rose-600', pos: 85, bar: 'bg-rose-500' };
    }
    return { nilai: '-', status: 'Tidak Diperiksa', color: 'text-slate-500', pos: 0, bar: 'bg-slate-300' };
};

const RangkumanCardPrint = ({ icon, title, value, status, textColor, dotPos, barColor }) => (
    <div className="border border-slate-300 rounded-xl p-3 bg-white flex flex-col justify-between h-full">
        <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-lg shrink-0">{icon}</div>
            <div>
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{title}</h4>
                <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
                <p className={\`text-[9px] font-black uppercase mt-1 \${textColor}\`}>{status}</p>
            </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 relative mt-auto">
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-slate-700 rounded-full shadow-md transition-all" style={{ left: \`calc(\${dotPos}% - 6px)\` }}></div>
        </div>
    </div>
);

function RaporDigital() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRapor = async () => {
            try {
                const docSnap = await getDoc(doc(db, "visits", id));
                if (docSnap.exists()) setData(docSnap.data()); else setData(null);
            } catch (error) { console.error(error); } finally { setLoading(false); }
        }; fetchRapor();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-slate-50 flex justify-center items-center font-bold text-[#0f766e] animate-pulse">Menyusun Rapor Kesehatan...</div>;
    if (!data) return <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-500 font-bold gap-4"><span className="text-5xl mb-2">📄❓</span> Data Rapor tidak ditemukan.</div>;

    // --- EKSTRAKSI DATA ---
    const bb = extractValue(data.pos2, ['berat badan'], data.pos2_question_map) || '-';
    const tb = extractValue(data.pos2, ['tinggi badan'], data.pos2_question_map) || '-';
    const lp = extractValue(data.pos2, ['lingkar perut'], data.pos2_question_map) || '-';
    const imtValFull = extractValue(data.pos2, ['imt'], data.pos2_question_map) || '-';
    const tensiField = extractValue(data.pos2, ['sistolik'], data.pos2_question_map) ? \`\${extractValue(data.pos2, ['sistolik'], data.pos2_question_map)}/\${extractValue(data.pos2, ['diastolik'], data.pos2_question_map)}\` : '-';
    const tensiData = evalTensi(tensiField);
    
    const isMataNormal = !extractValue(data.pos3, ['snellen', 'e-tumbling', 'visus'], data.pos3_question_map)?.toLowerCase().includes('gangguan');
    const telinga = extractValue(data.pos3, ['serumen'], data.pos3_question_map) === 'Ya' || extractValue(data.pos3, ['pendengaran'], data.pos3_question_map) === 'Ya' ? 'Terdapat Gangguan' : 'Batas Normal';
    const gigi = extractValue(data.pos3, ['karies'], data.pos3_question_map) === 'Ya' || extractValue(data.pos3, ['goyang'], data.pos3_question_map) === 'Ya' ? 'Terdapat Masalah Gigi/Mulut' : 'Batas Normal';
    
    const gds = extractValue(data.pos4, ['gula darah sewaktu', 'gds'], data.pos4_question_map);
    const gdp = extractValue(data.pos4, ['gula darah puasa', 'gdp'], data.pos4_question_map);
    const gulaData = evalGula(gds, gdp);
    const kolesterol = extractValue(data.pos4, ['kolesterol total'], data.pos4_question_map) || '-';
    const asamUrat = extractValue(data.pos4, ['asam urat'], data.pos4_question_map) || '-';

    const tbParuRaw = extractValue(data.pos5, ['batuk', 'tb', 'tbc'], data.pos5_question_map);
    const tbParu = (tbParuRaw && tbParuRaw.toLowerCase() === 'ya') ? 'Risiko/Suspek' : 'Aman';
    const jiwaValue = extractValue(data.pos6, ['depresi', 'cemas', 'minicog', 'mini-cog'], data.pos6_question_map);
    const jiwaSistem = (jiwaValue && jiwaValue !== 'Tidak' && !jiwaValue.toLowerCase().includes('normal')) ? 'Indikasi Risiko Kognitif/Emosi' : 'Batas Normal';

    const tglPeriksa = new Date(data.waktu_ambil_tiket?.toDate() || Date.now());
    const tglString = tglPeriksa.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}).toUpperCase();
    const tglPanjang = tglPeriksa.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
    const waktuString = tglPeriksa.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) + ' WITA';
    
    const currentUrl = window.location.href;
    const qrCodeUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(currentUrl)}&margin=4\`;

    // Generate comprehensive web table data
    const getWebTableRows = () => {
        let rows = [];
        const processPos = (posData, mapData, catName) => {
            if(!posData) return;
            const keys = Object.keys(posData).filter(k => !k.startsWith('waktu_') && k !== 'petugas');
            if(keys.length === 0) return;
            
            rows.push({ isHeader: true, name: catName });
            
            keys.forEach(k => {
                const val = posData[k];
                if (!val || val.toString().trim() === '') return;
                let name = mapData && mapData[k] ? mapData[k] : k;
                
                let color = 'text-slate-700';
                let status = '';
                const vLower = val.toString().toLowerCase();
                
                if (vLower === 'tidak' || vLower === 'negatif' || vLower.includes('normal') || vLower.includes('sehat')) {
                    color = 'text-emerald-600 font-bold';
                    status = '✅ (Aman)';
                } else if (vLower === 'ya' || vLower.includes('positif') || vLower.includes('gangguan') || vLower.includes('risiko')) {
                    color = 'text-rose-600 font-bold';
                    status = '⚠️ (Perhatian)';
                }
                
                rows.push({ isHeader: false, name, val, color, status });
            });
        };
        processPos(data.pos2, data.pos2_question_map, "Fisik & Antropometri");
        processPos(data.pos3, data.pos3_question_map, "Kesehatan Indera & Mulut");
        processPos(data.pos4, data.pos4_question_map, "Profil Darah & Lab");
        processPos(data.pos5, data.pos5_question_map, "Skrining Penyakit Menular & Kanker");
        processPos(data.pos6, data.pos6_question_map, "Kesehatan Jiwa, Kognitif & Lansia");
        return rows;
    };
    const webRows = getWebTableRows();

    return (
        <div className="min-h-screen bg-slate-100 font-sans relative">
            
            <style type="text/css" media="print">
            {\`
                @page { size: A4 portrait; margin: 0; }
                body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .print-hidden { display: none !important; }
                .rapor-print-area { 
                    display: flex !important; position: absolute; left: 0; top: 0; 
                    width: 210mm; height: 296mm; margin: 0; padding: 0;
                    background-color: white !important; flex-direction: column;
                }
                table { border-collapse: collapse; width: 100%; font-size: 10px; }
                th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
                th { background-color: #f8fafc !important; font-weight: 900; color: #475569; text-transform: uppercase; font-size: 8px; letter-spacing: 1px; }
                td { color: #1e293b; font-weight: 600; }
            \`}
            </style>

            {/* --- TAMPILAN MOBILE & WEB KOMPREHENSIF --- */}
            <div className="print-hidden pb-32">
                {/* Modern Banner */}
                <div className="bg-gradient-to-br from-[#0f766e] to-[#0d5953] text-white pt-8 pb-12 px-6 shadow-md relative overflow-hidden rounded-b-[2.5rem]">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-start relative z-10 mb-8">
                        <Link to="/" className="bg-white/10 backdrop-blur-md p-3 rounded-2xl hover:bg-white/20 transition"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg></Link>
                        <div className="bg-white p-2 rounded-2xl shadow-lg"><img src={LOGO_MALIMPUNG} alt="Logo" className="h-8 w-auto object-contain" /></div>
                    </div>
                    
                    <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex items-center gap-5">
                        <div className="w-16 h-16 bg-white text-slate-800 rounded-full flex items-center justify-center text-4xl shadow-inner shrink-0">{data.pasien_snapshot?.j_kelamin === 'P' ? '👩' : '👨'}</div>
                        <div>
                            <h1 className="text-xl font-black leading-tight uppercase tracking-wide">{data.pasien_snapshot?.nama || 'Anonim'}</h1>
                            <p className="text-teal-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-90">{data.patientNIK}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{tglPanjang}</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{data.kategori_usia_satusehat}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-20 space-y-5">
                    {/* Ringkasan Dokter Web */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                         <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                             <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-sm">✍️</div>
                             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kesimpulan & Edukasi</h3>
                         </div>
                         <p className="text-sm font-bold text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-2xl">
                             "{data.kesimpulan_dokter || data.pos5?.keterangan || 'Tidak ada catatan klinis khusus. Pasien dalam batas normal. Tetap pertahankan pola hidup sehat.'}"
                         </p>
                    </div>

                    <h3 className="font-black text-slate-800 text-sm mt-8 mb-2 px-2 flex items-center gap-2"><span>📋</span> Laporan Pemeriksaan Komprehensif</h3>
                    
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        {webRows.map((row, idx) => {
                            if (row.isHeader) {
                                return (
                                    <div key={idx} className="bg-slate-50 px-5 py-3 border-y border-slate-200 first:border-t-0 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-[#0f766e] rounded-full"></div>
                                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{row.name}</h4>
                                    </div>
                                );
                            }
                            return (
                                <div key={idx} className="px-5 py-3.5 border-b border-slate-100 last:border-0 flex flex-col md:flex-row md:justify-between md:items-center gap-1 hover:bg-slate-50 transition">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase md:w-1/2 leading-snug">{row.name}</p>
                                    <div className="md:w-1/2 md:text-right">
                                        <span className={\`text-sm \${row.color}\`}>{row.val}</span>
                                        {row.status && <span className={\`ml-2 text-[10px] \${row.color}\`}>{row.status}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="fixed bottom-6 left-0 w-full flex justify-center z-40 px-4">
                    <button onClick={() => window.print()} className="w-full max-w-sm bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black text-sm shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 border border-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        CETAK LAPORAN (PDF)
                    </button>
                </div>
            </div>

            {/* --- TAMPILAN CETAK A4 (GAMBAR 3 EXACT MATCH) --- */}
            <div className="rapor-print-area hidden font-sans mx-auto text-slate-800">
                {/* 1. Header Banner */}
                <div className="bg-[#148f77] text-white px-10 py-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-2 rounded-xl shrink-0"><img src={LOGO_MALIMPUNG} alt="Logo" className="w-14 h-14 object-contain" /></div>
                        <div>
                            <h1 className="text-2xl font-black tracking-wider uppercase mb-1">Laporan Medical Check-Up (MCU)</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">PUSKESMAS MALIMPUNG • TGL TERBIT: {tglString}, {waktuString}</p>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-6 flex-1 flex flex-col">
                    {/* 2. Profil Pasien Header */}
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 bg-amber-100 border-2 border-amber-200 rounded-full flex items-center justify-center text-3xl shrink-0">{data.pasien_snapshot?.j_kelamin === 'P' ? '👩' : '👨'}</div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wide text-slate-800">{data.pasien_snapshot?.nama || 'Anonim'}</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">NIK: {data.patientNIK}</p>
                        </div>
                    </div>

                    {/* 3. Info Cards Row */}
                    <div className="grid grid-cols-4 gap-4 bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 mb-8">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TGL LAHIR</p>
                            <p className="text-xs font-black text-slate-800">{data.pasien_snapshot?.tgl_lahir || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">KATEGORI USIA</p>
                            <p className="text-xs font-black text-slate-800 capitalize">{data.kategori_usia_satusehat} ({data.umur_saat_periksa} Thn)</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">LOKASI MCU</p>
                            <p className="text-xs font-black text-slate-800">PKM Malimpung</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ALAMAT ASAL</p>
                            <p className="text-xs font-black text-slate-800 truncate">{data.pasien_snapshot?.alamat || '-'}</p>
                        </div>
                    </div>

                    {/* 4. Rangkuman Indikator Kritis */}
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">1. RANGKUMAN INDIKATOR KRITIS</h3>
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <RangkumanCardPrint icon="❤️" title="Tekanan Darah" value={tensiField} status={\`(\${tensiData.status})\`} textColor={tensiData.color} dotPos={tensiData.pos} />
                        <RangkumanCardPrint icon="🩸" title="Gula Darah" value={gulaData.nilai} status={\`(\${gulaData.status})\`} textColor={gulaData.color} dotPos={gulaData.pos} />
                        <RangkumanCardPrint icon="⚖️" title="IMT / Status Gizi" value={imtValFull.split(' ')[0]} status={\`(\${imtValFull.split(' ').slice(1).join(' ').replace(/[()]/g,'')})\`} textColor={imtValFull.includes('GEMUK') || imtValFull.includes('OBESITAS') ? 'text-rose-600' : 'text-emerald-600'} dotPos={imtValFull.includes('NORMAL') ? 40 : 85} />
                        <RangkumanCardPrint icon="🫁" title="Risiko Paru/TB" value={tbParu === 'Risiko/Suspek' ? 'Risiko' : 'Aman'} status="" textColor={tbParu === 'Risiko/Suspek' ? 'text-rose-600' : 'text-emerald-600'} dotPos={tbParu === 'Risiko/Suspek' ? 85 : 15} />
                    </div>

                    {/* 5. Tabel Grid Kiri & Kanan */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">2. PARAMETER FISIK & LAB</h3>
                            <table>
                                <thead>
                                    <tr><th className="w-[45%]">Pemeriksaan</th><th>Hasil</th><th>Rujukan</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td className="font-bold">Tensi (mmHg)</td><td className={\`font-black \${tensiData.color}\`}>{tensiField}</td><td>120/80</td></tr>
                                    <tr><td className="font-bold">Gula Darah</td><td className={\`font-black \${gulaData.color}\`}>{gulaData.nilai.split(' ')[0]}</td><td>&lt;140</td></tr>
                                    <tr><td className="font-bold">Kolesterol</td><td className="font-black">{kolesterol}</td><td>&lt;200</td></tr>
                                    <tr><td className="font-bold">Asam Urat</td><td className="font-black">{asamUrat}</td><td>&lt;7.0</td></tr>
                                    <tr><td className="font-bold">Tinggi/Berat</td><td className="font-black">{tb}/{bb}</td><td>Propor.</td></tr>
                                    <tr><td className="font-bold">LP (cm)</td><td className="font-black">{lp}</td><td>L&lt;90|P&lt;80</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">3. TINJAUAN KLINIS & SISTEMIK</h3>
                            <table>
                                <thead>
                                    <tr><th className="w-[40%]">Sistem/Organ</th><th>Status Skrining Akhir</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td className="font-bold">Mata / Visus</td><td className={\`font-bold \${isMataNormal ? 'text-emerald-700' : 'text-rose-700'}\`}>{isMataNormal ? 'Batas Normal' : 'Terdapat Gangguan'}</td></tr>
                                    <tr><td className="font-bold">Telinga</td><td className={\`font-bold \${telinga === 'Batas Normal' ? 'text-emerald-700' : 'text-rose-700'}\`}>{telinga}</td></tr>
                                    <tr><td className="font-bold">Kesehatan Gigi</td><td className={\`font-bold \${gigi === 'Batas Normal' ? 'text-emerald-700' : 'text-rose-700'}\`}>{gigi}</td></tr>
                                    <tr><td className="font-bold">Kognitif/Mental</td><td className={\`font-bold \${jiwaSistem === 'Batas Normal' ? 'text-emerald-700' : 'text-orange-600'}\`}>{jiwaSistem}</td></tr>
                                    <tr><td className="font-bold text-rose-700 bg-rose-50/30">Diagnosis Akhir</td><td className="font-black italic bg-rose-50/30">{data.kesimpulan_dokter || 'Dalam batas normal/Tidak ada keluhan'}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="mt-auto">
                         <div className="w-full border-t border-dashed border-slate-300 mb-6"></div>
                         <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-8">TIM MEDIS & VALIDASI PEMERIKSAAN</h3>
                         <div className="flex justify-between items-end px-4">
                             <div className="text-center"><p className="text-[7px] text-slate-400 uppercase mb-8">POS 1 (PENDAFTARAN)</p><p className="text-[9px] font-black uppercase text-slate-800">{data.petugas || 'PETUGAS'}</p></div>
                             <div className="text-center"><p className="text-[7px] text-slate-400 uppercase mb-8">POS 2 (ANTROPOMETRI & LAB)</p><p className="text-[9px] font-black uppercase text-slate-800">{data.petugas || 'PETUGAS'}</p></div>
                             <div className="text-center"><p className="text-[7px] text-slate-400 uppercase mb-8">POS 3 (PEMERIKSAAN KLINIS)</p><p className="text-[9px] font-black uppercase text-slate-800">{data.petugas || 'PETUGAS'}</p></div>
                             <div className="text-center"><p className="text-[7px] text-slate-400 uppercase mb-8">POS 4 (SKRINING AKHIR)</p><p className="text-[9px] font-black uppercase text-slate-800">{data.dokter_pemeriksa || 'DOKTER'}</p></div>
                         </div>
                    </div>
                </div>

                {/* 6. Footer QR Code */}
                <div className="bg-[#148f77] text-white px-10 py-5 flex items-center justify-between mt-auto shrink-0">
                    <div className="w-[85%]">
                        <p className="text-[9px] font-bold leading-relaxed opacity-90 pr-10">
                            Laporan MCU ini sah dan terintegrasi dengan Rekam Medis Elektronik (RME) Puskesmas Malimpung.<br/>Digunakan untuk pemantauan kesehatan rutin pada program Posbindu CKG Terintegrasi.
                        </p>
                    </div>
                    <div className="bg-white p-1 rounded border-2 border-white"><img src={qrCodeUrl} alt="QR" className="w-[20mm] h-[20mm]" /></div>
                </div>
            </div>
        </div>
    );
}

export default RaporDigital;
`;

fs.writeFileSync('RaporDigital.jsx', code);
console.log('RaporDigital.jsx completely replaced with comprehensive web view and exact A4 layout!');
