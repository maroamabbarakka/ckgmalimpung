import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportToPKGExcel, exportClusterExcel, exportToPKG_PDF, exportClusterPDF } from './utils/exportPKG';
import { STATUS_MAPPING } from './utils/constants';
import { useAuth } from './auth/AuthContext';
import { writeAuditLog } from './services/auditService';
import { maskNik } from './utils/privacy';
import QueueStatusBadge from './design-system/components/QueueStatusBadge';
import {
  calculateBottleneck,
  calculateDashboardMetrics,
  calculateDataQuality,
  deleteDashboardVisits,
  subscribeDashboardVisits,
  updateDashboardVisit
} from './features/dashboard/dashboardService';

// =====================================================================
// IMPORT STANDAR VITE: HANYA RESPONSIVE, TANPA WIDTH PROVIDER
// =====================================================================
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// =====================================================================
// WRAPPER AUTO-WIDTH: MENGISOLIR MASALAH LEBAR LAYAR PADA VITE
// =====================================================================
const AutoWidthGrid = (props) => {
    const [width, setWidth] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect;
            if (rect && rect.width > 0) {
                setWidth(rect.width);
            }
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="w-full h-full">
            {width > 0 && <ResponsiveGridLayout width={width} {...props} />}
        </div>
    );
};

// =====================================================================
// KOMPONEN UI STATIS
// =====================================================================
const CardStat = ({ title, value, subtitle, gradient, icon }) => (
    <div className={`h-full w-full p-5 lg:p-6 rounded-[1.5rem] text-white shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br ${gradient} border border-white/20`}>
        <div className="absolute -right-2 -top-2 opacity-20 text-6xl md:text-8xl pointer-events-none transform rotate-12">{icon}</div>
        <div className="relative z-10">
            <p className="text-[10px] md:text-xs font-black opacity-90 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black drop-shadow-md leading-none">{value ?? 0}</h3>
        </div>
        <p className="text-[10px] font-bold mt-2 bg-black/10 px-2.5 py-1 rounded-lg inline-block self-start border border-white/10 relative z-10">{subtitle}</p>
    </div>
);

const CardStatClickable = ({ title, value, subtitle, gradient, icon, onClick }) => (
    <div onClick={onClick} className={`h-full w-full p-4 lg:p-5 rounded-[1.5rem] text-white shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br ${gradient} cursor-pointer transform transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-95 group border border-white/20`}>
        <div className="absolute -right-2 -top-2 opacity-20 text-5xl md:text-6xl pointer-events-none transform rotate-12 transition-transform duration-500 group-hover:rotate-0">{icon}</div>
        <div className="relative z-10">
            <p className="text-[9px] lg:text-[10px] font-black opacity-90 uppercase tracking-widest mb-0.5 truncate">{title}</p>
            <h3 className="text-2xl lg:text-3xl xl:text-4xl font-black drop-shadow-md leading-none">{value ?? 0}</h3>
        </div>
        <div className="flex justify-between items-end relative z-10 mt-2">
            <p className="text-[8px] lg:text-[9px] font-bold bg-black/10 px-1.5 py-1 rounded-md border border-white/10 truncate max-w-[75%]">{subtitle}</p>
            <span className="bg-white/30 rounded-full w-6 h-6 flex items-center justify-center text-[10px] transition-colors group-hover:bg-white/50 shadow-inner">🔍</span>
        </div>
    </div>
);

const ProgressBarQueue = ({ label, count, colorClass }) => {
    const safeCount = count ?? 0;
    const percentage = Math.min((safeCount / Math.max(20, safeCount)) * 100, 100);
    const isDanger = safeCount >= 15;
    return (
        <div className="space-y-1.5 w-full">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isDanger ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>{safeCount} Org</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div style={{ width: `${percentage}%` }} className={`h-full transition-all duration-700 ${isDanger ? 'bg-red-500' : colorClass}`}></div>
            </div>
        </div>
    );
};

const ProgressBarAge = ({ label, count, total, colorClass }) => {
    const safeCount = count ?? 0;
    const safeTotal = total > 0 ? total : 1;
    const percentage = (safeCount / safeTotal) * 100;
    return (
        <div className="space-y-1.5 w-full">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <span className="text-[10px] font-black text-slate-800">{safeCount} Org ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div style={{ width: `${percentage}%` }} className={`h-full ${colorClass}`}></div>
            </div>
        </div>
    );
};

const DashboardInsightPanel = ({ insights = [] }) => (
    <section className="mx-4 mb-4 lg:mx-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Yang perlu diperhatikan hari ini</p>
                <h3 className="text-base font-black text-slate-900 md:text-lg">Prioritas Operasional</h3>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkas untuk keputusan cepat</p>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            {insights.map((item) => (
                <div
                    key={item.label}
                    className={`rounded-2xl border px-4 py-3 ${
                        item.tone === 'rose'
                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                            : item.tone === 'amber'
                                ? 'border-amber-200 bg-amber-50 text-amber-800'
                                : item.tone === 'blue'
                                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    }`}
                >
                    <p className="text-2xl font-black leading-none">{item.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest">{item.label}</p>
                    <p className="mt-1 text-[11px] font-bold leading-snug opacity-80">{item.detail}</p>
                </div>
            ))}
        </div>
    </section>
);

const extractDashboardValue = (posData, keywords, questionMap = {}) => {
    if (!posData) return null;
    const key = Object.keys(posData).find(k => {
        const keyText = String(k).toLowerCase();
        const questionText = String(questionMap[k] || '').toLowerCase();
        return keywords.some(kw => keyText.includes(kw) || questionText.includes(kw));
    });
    return key ? posData[key] : null;
};

const getVisitBloodPressure = (visit) => {
    const td = String(visit.pos2?.td || extractDashboardValue(visit.pos2, ['tekanan darah'], visit.pos2_question_map) || '');
    const sys = extractDashboardValue(visit.pos2, ['sistolik'], visit.pos2_question_map) || (td.includes('/') ? td.split('/')[0] : td);
    const dia = extractDashboardValue(visit.pos2, ['diastolik'], visit.pos2_question_map) || (td.includes('/') ? td.split('/')[1] : '');
    return { sys, dia, label: sys ? `${sys}/${dia || '-'}` : '-' };
};

const getVisitGlucose = (visit) => {
    const gds = visit.pos4?.gds || extractDashboardValue(visit.pos4, ['gula darah sewaktu', 'gds'], visit.pos4_question_map) || visit.pos2?.gds || extractDashboardValue(visit.pos2, ['gula darah sewaktu', 'gds'], visit.pos2_question_map);
    const gdp = visit.pos4?.gdp || extractDashboardValue(visit.pos4, ['gula darah puasa', 'gdp'], visit.pos4_question_map) || visit.pos2?.gdp || extractDashboardValue(visit.pos2, ['gula darah puasa', 'gdp'], visit.pos2_question_map);
    return { gds, gdp, label: gds || gdp || '-' };
};

const POS_QUEUE_OPTIONS = [
  { key: 'pos1', value: STATUS_MAPPING.POS1, label: 'Pos 1 (Registrasi)', trafficLabel: 'Pos 1: Registrasi', colorClass: 'bg-blue-500' },
  { key: 'pos2', value: STATUS_MAPPING.POS2, label: 'Pos 2 (Antropometri)', trafficLabel: 'Pos 2: Antropometri', colorClass: 'bg-indigo-500' },
  { key: 'pos3', value: STATUS_MAPPING.POS3, label: 'Pos 3 (Pemeriksaan)', trafficLabel: 'Pos 3: Pemeriksaan', colorClass: 'bg-rose-500' },
  { key: 'pos4', value: STATUS_MAPPING.POS4, label: 'Pos 4 (Lab & Infeksi)', trafficLabel: 'Pos 4: Lab & Infeksi', colorClass: 'bg-blue-600' },
  { key: 'pos5', value: STATUS_MAPPING.POS5, label: 'Pos 5 (Skrining Khusus)', trafficLabel: 'Pos 5: Skrining Khusus', colorClass: 'bg-fuchsia-500' },
  { key: 'pos6', value: STATUS_MAPPING.POS6, label: 'Pos 6 (Diagnosis)', trafficLabel: 'Pos 6: Diagnosis', colorClass: 'bg-cyan-500' },
  { key: 'pos7', value: STATUS_MAPPING.POS7, label: 'Pos 7 (Rapor)', trafficLabel: 'Pos 7: Rapor', colorClass: 'bg-emerald-500' },
];

const createEmptyPerPosStats = () => POS_QUEUE_OPTIONS.reduce((acc, pos) => ({ ...acc, [pos.key]: 0 }), {});

const getPosKeyFromStatus = (status) => {
  const match = String(status || '').trim().match(/pos\s*([1-7])/i);
  return match ? `pos${match[1]}` : null;
};

const normalizeEditableQueueStatus = (status) => {
  if (status === STATUS_MAPPING.SELESAI) return STATUS_MAPPING.SELESAI;
  const posKey = getPosKeyFromStatus(status);
  return POS_QUEUE_OPTIONS.find(pos => pos.key === posKey)?.value || STATUS_MAPPING.POS1;
};

const getBottleneckLabel = (status) => {
  if (status === 'UNKNOWN') return 'Status kosong';
  return POS_QUEUE_OPTIONS.find(pos => pos.value === status)?.trafficLabel || status;
};

// =====================================================================
// KONFIGURASI TATA LETAK DESKTOP (MATEMATIKA 24 KOLOM)
// Mobile tidak lagi menggunakan konfigurasi ini
// =====================================================================
const defaultLayouts = {
  lg: [
    { i: 'traffic', x: 0, y: 0, w: 6, h: 7, minW: 4, minH: 5 },
    { i: 'umur', x: 0, y: 7, w: 6, h: 5, minW: 4, minH: 3 },
    { i: 'demografi', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },

    { i: 'tot-antrian', x: 12, y: 0, w: 6, h: 4, minW: 5, minH: 3 },
    { i: 'tot-selesai', x: 18, y: 0, w: 6, h: 4, minW: 5, minH: 3 },

    { i: 'stat-hipertensi', x: 6, y: 4, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'stat-diabetes', x: 9, y: 4, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'stat-obesitas', x: 12, y: 4, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'stat-paru', x: 15, y: 4, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'stat-mental', x: 18, y: 4, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'stat-indera', x: 21, y: 4, w: 3, h: 4, minW: 2, minH: 3 },

    { i: 'ekspor', x: 6, y: 8, w: 18, h: 4, minW: 10, minH: 2 },
    { i: 'quality', x: 0, y: 12, w: 12, h: 5, minW: 8, minH: 4 },
    { i: 'bottleneck', x: 12, y: 12, w: 12, h: 5, minW: 8, minH: 4 },
    { i: 'tabel', x: 0, y: 17, w: 24, h: 8, minW: 12, minH: 6 }
  ]
};

// =====================================================================

// =====================================================================
// KOMPONEN UTAMA DASHBOARD
// =====================================================================
function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated: authIsAuthenticated, hasRole, signOut } = useAuth();
  const isAuthenticated = authIsAuthenticated;
  const isAdmin = hasRole('admin');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDesa, setFilterDesa] = useState('Semua');

  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'waktu_ambil_tiket', direction: 'desc' });
  const [editingVisit, setEditingVisit] = useState(null);
  const [editForm, setEditForm] = useState({ nama: '', nik: '', status_antrian: '', keterangan_akhir: '' });

  const [pesan, setPesan] = useState('');

  const [layouts, setLayouts] = useState(() => {
    try {
        const saved = localStorage.getItem("dashboardLayout_v21");
        return saved ? JSON.parse(saved) : defaultLayouts;
    } catch { return defaultLayouts; }
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [popupConfig, setPopupConfig] = useState({ isOpen: false, type: '', title: '' });

  const [stats, setStats] = useState({
    total: 0, selesai: 0, antri: 0,
    perPos: createEmptyPerPosStats(),
    gender: { L: 0, P: 0 }, usia: {},
    klinis: { hipertensi: 0, hiperglikemia: 0, obesitas: 0, paru_ppok: 0, mental: 0, indera: 0 },
  });

  // --- DETEKSI LAYAR MOBILE ---

  // --- DETEKSI LAYAR MOBILE ---
  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLayoutChange = (layout, allLayouts) => {
    // Hindari menyimpan layout saat isMobile (karena RGL tidak aktif secara penuh)
    if (isMobile) return;
    setLayouts(allLayouts);
    localStorage.setItem("dashboardLayout_v21", JSON.stringify(allLayouts));
  };

  const toggleEditMode = () => {
      if (!isAdmin) return;
      setIsEditMode(!isEditMode);
      setPopupConfig({isOpen: false, type: '', title: ''});
      if (!isEditMode) setPesan("🛠️ Mode Kustomisasi Aktif: Silakan atur lebar dan posisi panel.");
      else setPesan("💾 Tata letak berhasil dikunci.");
      setTimeout(() => setPesan(""), 4000);
  };

  const resetLayout = () => {
    if (!isAdmin) return;
    if(window.confirm("Kembalikan tata letak dashboard ke Standar Pabrik?")){
        setLayouts(defaultLayouts);
        localStorage.removeItem("dashboardLayout_v21");
        setIsEditMode(false);
        setPesan("🔄 Tata letak berhasil di-reset penuh.");
        setTimeout(() => setPesan(""), 3000);
    }
  };

  // --- FETCHING DATA ---
  useEffect(() => {
    const unsubscribe = subscribeDashboardVisits((data) => {
      setVisits(data);
      kalkulasiStatistik(data);
      setLoading(false);
    }, (error) => {
      console.error("Firebase Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- KALKULASI STATISTIK KLINIS PTM ---
  const kalkulasiStatistik = (data) => {
    let s = {
        total: data.length, selesai: 0, antri: 0,
        perPos: createEmptyPerPosStats(),
        gender: { L: 0, P: 0 }, usia: {},
        klinis: { hipertensi: 0, hiperglikemia: 0, obesitas: 0, paru_ppok: 0, mental: 0, indera: 0 }
    };

    data.forEach(v => {
        const posKey = getPosKeyFromStatus(v.status_antrian);
        if (posKey && s.perPos[posKey] !== undefined) s.perPos[posKey]++;
        if (v.status_antrian === 'Selesai') s.selesai++; else s.antri++;
        if (v.pasien_snapshot?.j_kelamin === 'L') s.gender.L++;
        if (v.pasien_snapshot?.j_kelamin === 'P') s.gender.P++;

        const rawKat = v.kategori_usia_satusehat || 'Dewasa';
        const kat = ['SD', 'SMP', 'SMA'].includes(rawKat) ? 'Anak/Siswa' : rawKat;
        s.usia[kat] = (s.usia[kat] || 0) + 1;

        const tdRaw = String(v.pos2?.td || extractDashboardValue(v.pos2, ['tekanan darah'], v.pos2_question_map) || '');
        const sysRaw = extractDashboardValue(v.pos2, ['sistolik'], v.pos2_question_map) || (tdRaw.includes('/') ? tdRaw.split('/')[0] : tdRaw);
        const diaRaw = extractDashboardValue(v.pos2, ['diastolik'], v.pos2_question_map) || (tdRaw.includes('/') ? tdRaw.split('/')[1] : '');
        const sys = parseInt(sysRaw);
        const dia = parseInt(diaRaw);
        if ((!isNaN(sys) && sys >= 140) || (!isNaN(dia) && dia >= 90)) s.klinis.hipertensi++;

        const gds = parseInt(v.pos4?.gds || extractDashboardValue(v.pos4, ['gula darah sewaktu', 'gds'], v.pos4_question_map) || v.pos2?.gds || extractDashboardValue(v.pos2, ['gula darah sewaktu', 'gds'], v.pos2_question_map) || 0);
        const gdp = parseInt(v.pos4?.gdp || extractDashboardValue(v.pos4, ['gula darah puasa', 'gdp'], v.pos4_question_map) || v.pos2?.gdp || extractDashboardValue(v.pos2, ['gula darah puasa', 'gdp'], v.pos2_question_map) || 0);
        if (gds >= 200 || gdp >= 126) s.klinis.hiperglikemia++;

        const tbRaw = v.pos2?.tb || extractDashboardValue(v.pos2, ['tinggi badan'], v.pos2_question_map);
        const bbRaw = v.pos2?.bb || extractDashboardValue(v.pos2, ['berat badan'], v.pos2_question_map);
        if (kat !== 'Bayi' && kat !== 'Balita' && tbRaw && bbRaw) {
            const tb = parseFloat(tbRaw); const bb = parseFloat(bbRaw);
            if(tb > 0 && bb > 0) {
                const imt = bb / Math.pow(tb/100, 2);
                if (imt >= 25.0) s.klinis.obesitas++;
            }
        }

        const p4 = v.pos4 || {}; const p5 = v.pos5 || {};
        if (p4.ppok?.nafas_pendek === 'Ya' || p5.ppok?.nafas_pendek === 'Ya' || p4.merokok?.batuk_lama === 'Ya' || p5.merokok?.batuk_lama === 'Ya' || p4.resiko_ca_paru?.riw_merokok === 'Ya' || p4.resiko_tb?.batuk_lama === '>2Mg' || p5.resiko_tb?.batuk === 'Ya' || extractDashboardValue(p5, ['batuk'], v.pos5_question_map) === 'Ya') s.klinis.paru_ppok++;

        const p3 = v.pos3 || {}; const p6 = v.pos6 || {}; const skilas = p3.skilas || p6.skilas || {};
        const isMental = Object.values(p3.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '') ||
                         Object.values(p6.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '') ||
                         Object.values(p3.jiwa_sdq || {}).some(val => String(val) === 'Ya') ||
                         Object.values(p6.jiwa_sdq || {}).some(val => String(val) === 'Ya') ||
                         skilas.dep_sedih === 'Ya' || skilas.dep_minat_turun === 'Ya' || skilas.depl_tak_berdaya === 'Ya';
        if (isMental) s.klinis.mental++;

        const visusStr = String(p3.mata?.visus || extractDashboardValue(p3, ['visus', 'snellen'], v.pos3_question_map) || '');
        if ((visusStr && !['6/6', 'normal'].includes(visusStr.toLowerCase())) || p3.telinga?.gg_pendengaran === 'Ya' || p3.telinga?.infeksi === 'Ya' || extractDashboardValue(p3, ['pendengaran'], v.pos3_question_map) === 'Ya') s.klinis.indera++;
    });
    setStats(s);
  };

  const filteredVisits = useMemo(() => {
    let result = visits.filter(v => {
      const name = String(v.pasien_snapshot?.nama || '').toLowerCase();
      const nik = String(v.patientNIK || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchSearch = name.includes(search) || nik.includes(search);
      const matchDesa = filterDesa === 'Semua' || v.pasien_snapshot?.desa === filterDesa;
      return matchSearch && matchDesa;
    });

    result.sort((a, b) => {
      let valA, valB;
      switch (sortConfig.key) {
        case 'identitas':
          valA = String(a.pasien_snapshot?.nama || '').toLowerCase();
          valB = String(b.pasien_snapshot?.nama || '').toLowerCase();
          break;
        case 'kategori':
          valA = String(a.kategori_usia_satusehat || '').toLowerCase();
          valB = String(b.kategori_usia_satusehat || '').toLowerCase();
          break;
        case 'klinis':
          valA = String(getVisitBloodPressure(a).label).toLowerCase();
          valB = String(getVisitBloodPressure(b).label).toLowerCase();
          break;
        case 'antrian':
          valA = String(a.status_antrian || '').toLowerCase();
          valB = String(b.status_antrian || '').toLowerCase();
          break;
        default:
          valA = a.waktu_ambil_tiket?.toMillis ? a.waktu_ambil_tiket.toMillis() : 0;
          valB = b.waktu_ambil_tiket?.toMillis ? b.waktu_ambil_tiket.toMillis() : 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [visits, searchTerm, filterDesa, sortConfig]);

  const completedFilteredVisits = useMemo(() => {
    return filteredVisits.filter(v => v.status_antrian === STATUS_MAPPING.SELESAI);
  }, [filteredVisits]);

  const decisionMetrics = useMemo(() => calculateDashboardMetrics(filteredVisits), [filteredVisits]);
  const dataQuality = useMemo(() => calculateDataQuality(filteredVisits), [filteredVisits]);
  const bottleneckRows = useMemo(() => {
    const bottleneck = calculateBottleneck(filteredVisits);
    return Object.entries(bottleneck)
      .map(([status, count]) => ({ status, label: getBottleneckLabel(status), count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredVisits]);
  const maxBottleneckCount = bottleneckRows[0]?.count || 1;
  const insightRows = useMemo(() => {
    const qualityIssues = dataQuality.missingNik + dataQuality.invalidNik + dataQuality.missingBirthDate + dataQuality.invalidBirthDate + dataQuality.missingGender + dataQuality.invalidGender + dataQuality.missingVillage + dataQuality.invalidWorkflow + dataQuality.finalizedWithoutDoctor + dataQuality.duplicateIdentityYear;
    const topBottleneck = bottleneckRows[0];
    return [
      {
        value: decisionMetrics.inProgress,
        label: 'Belum final',
        detail: decisionMetrics.inProgress > 0 ? 'Pasien masih berjalan di alur layanan.' : 'Semua pasien terfilter sudah final.',
        tone: decisionMetrics.inProgress > 0 ? 'amber' : 'emerald'
      },
      {
        value: topBottleneck?.count || 0,
        label: topBottleneck ? topBottleneck.label : 'Bottleneck',
        detail: topBottleneck ? 'Pos dengan antrean tertahan terbanyak.' : 'Belum ada antrean tertahan.',
        tone: (topBottleneck?.count || 0) >= 10 ? 'rose' : (topBottleneck?.count || 0) > 0 ? 'blue' : 'emerald'
      },
      {
        value: qualityIssues,
        label: 'Masalah data',
        detail: qualityIssues > 0 ? 'Cek identitas, workflow, atau finalisasi dokter.' : 'Data terfilter tampak lengkap.',
        tone: qualityIssues > 0 ? 'rose' : 'emerald'
      },
      {
        value: stats.klinis.hipertensi + stats.klinis.hiperglikemia + stats.klinis.paru_ppok + stats.klinis.mental,
        label: 'Risiko dominan',
        detail: 'Gabungan tensi, gula, paru, dan mental untuk pemantauan cepat.',
        tone: (stats.klinis.hipertensi + stats.klinis.hiperglikemia + stats.klinis.paru_ppok + stats.klinis.mental) > 0 ? 'amber' : 'emerald'
      }
    ];
  }, [bottleneckRows, dataQuality, decisionMetrics, stats]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // OPTIMASI: useMemo untuk popup pasien
  const popupPatients = useMemo(() => {
      if (!popupConfig.isOpen) return [];

      return visits.filter(v => {
          if (popupConfig.type === 'hipertensi') {
              const bp = getVisitBloodPressure(v);
              return parseInt(bp.sys || 0) >= 140 || parseInt(bp.dia || 0) >= 90;
          }
          if (popupConfig.type === 'diabetes') {
              const glucose = getVisitGlucose(v);
              return parseInt(glucose.gds || 0) >= 200 || parseInt(glucose.gdp || 0) >= 126;
          }
          if (popupConfig.type === 'obesitas') {
              const kat = v.kategori_usia_satusehat;
              if (kat !== 'Bayi' && kat !== 'Balita' && v.pos2?.tb && v.pos2?.bb) {
                  const tb = parseFloat(v.pos2.tb); const bb = parseFloat(v.pos2.bb);
                  if (tb > 0 && bb > 0) return (bb / Math.pow(tb/100, 2)) >= 25.0;
              }
              return false;
          }
          if (popupConfig.type === 'paru_ppok') return v.pos4?.ppok?.nafas_pendek === 'Ya' || v.pos4?.merokok?.batuk_lama === 'Ya' || v.pos4?.resiko_ca_paru?.riw_merokok === 'Ya' || v.pos4?.resiko_tb?.batuk_lama === '>2Mg';
          if (popupConfig.type === 'mental') {
              const p3 = v.pos3 || {}; const skilas = p3.skilas || {};
              return Object.values(p3.jiwa_srq20 || {}).some(val => String(val) !== 'Tidak' && String(val) !== 'Tdk' && val !== undefined && val !== '') || Object.values(p3.jiwa_sdq || {}).some(val => String(val) === 'Ya') || skilas.dep_sedih === 'Ya';
          }
          if (popupConfig.type === 'indera') {
              const visusStr = String(v.pos3?.mata?.visus || '');
              return (visusStr && !['6/6', 'normal'].includes(visusStr.toLowerCase())) || v.pos3?.telinga?.gg_pendengaran === 'Ya' || v.pos3?.telinga?.infeksi === 'Ya';
          }
          return false;
      });
  }, [visits, popupConfig]);

  const popupDetailsInfo = {
      'hipertensi': { icon: '🩺', title: 'Pasien Hipertensi (TD ≥ 140)' },
      'diabetes': { icon: '🩸', title: 'Pasien Diabetes (Gula Tinggi)' },
      'obesitas': { icon: '⚖️', title: 'Pasien Overweight & Obesitas' },
      'paru_ppok': { icon: '🫁', title: 'Risiko Paru, PPOK & Perokok' },
      'mental': { icon: '🧠', title: 'Indikasi Gangguan Emosional' },
      'indera': { icon: '👁️', title: 'Gangguan Indera Mata / Telinga' }
  };
  const currentPopupInfo = popupDetailsInfo[popupConfig.type] || { icon: '📋', title: 'Detail Data Pasien' };

  // =====================================================================
  // FUNGSI EKSPOR FLAT
  // =====================================================================
  const exportExcelKategori = async (kategori) => {
      await exportClusterExcel(completedFilteredVisits, kategori);
      await writeAuditLog({
          action: `Export Excel klaster ${kategori}`,
          module: 'Dashboard',
          after: { kategori, total: completedFilteredVisits.length }
      });
  };

  const exportPdfKategori = async (kategori) => {
      await exportClusterPDF(completedFilteredVisits, kategori);
      await writeAuditLog({
          action: `Export PDF klaster ${kategori}`,
          module: 'Dashboard',
          after: { kategori, total: completedFilteredVisits.length }
      });
  };

  const exportExcelKolektif = async () => {
      await exportToPKGExcel(completedFilteredVisits);
      await writeAuditLog({
          action: 'Export Excel kolektif',
          module: 'Dashboard',
          after: { total: completedFilteredVisits.length }
      });
  };

  const exportPdfKolektif = async () => {
      await exportToPKG_PDF(completedFilteredVisits);
      await writeAuditLog({
          action: 'Export PDF kolektif',
          module: 'Dashboard',
          after: { total: completedFilteredVisits.length }
      });
  };

  // --- HANDLER LAINNYA ---
  const handleSelectAll = (e) => {
      if (e.target.checked) setSelectedRows(filteredVisits.map(v => v.id));
      else setSelectedRows([]);
  };

  const handleSelectRow = (id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);

  const handleBulkDelete = async () => {
      if (!isAdmin) return;
      if (selectedRows.length === 0) return;
      if (!window.confirm(`Yakin menghapus ${selectedRows.length} data secara permanen?`)) return;
      try {
          await deleteDashboardVisits(selectedRows);
          await writeAuditLog({
              action: 'Hapus data kunjungan massal',
              module: 'Dashboard',
              before: { visitIds: selectedRows },
              after: { totalDeleted: selectedRows.length }
          });
          setSelectedRows([]); alert("Data kunjungan dihapus. Master pasien tetap disimpan untuk menjaga riwayat pasien.");
      } catch (e) { alert("Gagal: " + e.message); }
  };

  const openEditModal = (visit) => {
      if (!isAdmin) return;
      setEditingVisit(visit);
      setEditForm({
          nama: visit.pasien_snapshot?.nama || '',
          nik: visit.patientNIK || '',
          status_antrian: normalizeEditableQueueStatus(visit.status_antrian),
          keterangan_akhir: visit.kesimpulan_dokter || visit.pos5?.keterangan || visit.pos4?.keterangan || visit.pos3?.keterangan || ''
      });
  };

  const handleSaveEdit = async () => {
      if (!isAdmin) return;
      try {
          const nikTrimmed = String(editForm.nik || '').trim();
          if (nikTrimmed && !nikTrimmed.startsWith('NONIK') && !/^\d{16}$/.test(nikTrimmed)) {
              alert("NIK harus 16 digit angka, atau gunakan format NONIK untuk pasien tanpa NIK.");
              return;
          }
          const after = {
              patientNIK: nikTrimmed,
              pasienName: editForm.nama,
              status_antrian: editForm.status_antrian,
              kesimpulan_dokter: editForm.keterangan_akhir
          };
          await updateDashboardVisit(editingVisit.id, {
              patientNIK: after.patientNIK,
              "pasien_snapshot.nama": after.pasienName,
              status_antrian: after.status_antrian,
              petugas_aktif: null,
              kesimpulan_dokter: after.kesimpulan_dokter,
              "pos4.keterangan": after.kesimpulan_dokter
          });
          await writeAuditLog({
              action: 'Edit data kunjungan',
              module: 'Dashboard',
              visitId: editingVisit.id,
              patientKey: editingVisit.patient_identity_key || nikTrimmed || editingVisit.patientNIK,
              before: {
                  patientNIK: editingVisit.patientNIK || '',
                  pasienName: editingVisit.pasien_snapshot?.nama || '',
                  status_antrian: editingVisit.status_antrian || '',
                  kesimpulan_dokter: editingVisit.kesimpulan_dokter || editingVisit.pos5?.keterangan || editingVisit.pos4?.keterangan || editingVisit.pos3?.keterangan || ''
              },
              after
          });
          setEditingVisit(null); alert("✅ Data diperbarui.");
      } catch (e) { alert("Gagal: " + e.message); }
  };

  const handleLogout = () => { signOut(); navigate('/'); };

  const handlePublicRestrictedDetail = () => {
      setPesan("Detail pasien disembunyikan pada akses publik. Silakan masuk sebagai Administrator untuk melihat daftar nama dan rapor individual.");
      setTimeout(() => setPesan(""), 5000);
  };

  // =====================================================================
  // OBJEK WIDGETS (MENCEGAH DUPLIKASI KODE UNTUK DESKTOP & MOBILE)
  // =====================================================================
  const widgets = {
    'traffic': (
        <div key="traffic" className={`bg-white rounded-[1.5rem] shadow-sm border p-6 flex flex-col h-full ${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}`}>
            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><span>🚦</span> Traffic Real-Time</h3>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
                {POS_QUEUE_OPTIONS.map(pos => (
                    <ProgressBarQueue key={pos.key} label={pos.trafficLabel} count={stats.perPos[pos.key]} colorClass={pos.colorClass} />
                ))}
            </div>
        </div>
    ),
    'umur': (
        <div key="umur" className={`bg-white rounded-[1.5rem] shadow-sm border p-6 flex flex-col h-full ${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}`}>
            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><span>📊</span> Proporsi Sasaran</h3>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
                <ProgressBarAge label="Bayi & Balita" count={(stats.usia['Bayi']||0) + (stats.usia['Balita']||0)} total={stats.total} colorClass="bg-pink-400" />
                <ProgressBarAge label="Anak & Siswa" count={stats.usia['Anak/Siswa'] || 0} total={stats.total} colorClass="bg-amber-400" />
                <ProgressBarAge label="Usia Produktif" count={stats.usia['Dewasa'] || 0} total={stats.total} colorClass="bg-emerald-400" />
                <ProgressBarAge label="Lansia (60+)" count={stats.usia['Lansia'] || 0} total={stats.total} colorClass="bg-orange-400" />
            </div>
        </div>
    ),
    'demografi': (
        <div key="demografi" className={`bg-white rounded-[1.5rem] shadow-sm border p-6 flex flex-col justify-center h-full ${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}`}>
            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] mb-4">🚻 Gender</h3>
            <div className="flex justify-between text-[11px] font-black mb-2">
                <span className="text-blue-600">PRIA ({stats.gender.L})</span>
                <span className="text-pink-600">WANITA ({stats.gender.P})</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden border border-slate-200">
                <div style={{ width: `${stats.total ? (stats.gender.L/stats.total)*100 : 0}%` }} className="h-full bg-blue-500 shadow-inner"></div>
                <div style={{ width: `${stats.total ? (stats.gender.P/stats.total)*100 : 0}%` }} className="h-full bg-pink-500 shadow-inner"></div>
            </div>
        </div>
    ),
    'quality': (
        <div key="quality" className={`bg-white rounded-[1.5rem] shadow-sm border p-6 flex flex-col h-full ${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
                <div>
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em]">Kualitas Data</h3>
                    <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validasi kelengkapan operasional</p>
                </div>
                <div className={`rounded-2xl px-3 py-2 text-right ${decisionMetrics.incomplete > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    <p className="text-2xl font-black leading-none">{decisionMetrics.incomplete}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest">Belum Lengkap</p>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[10px] font-black uppercase tracking-widest">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><p className="text-slate-400">NIK Bermasalah</p><p className="mt-1 text-xl text-slate-800">{dataQuality.missingNik + dataQuality.invalidNik}</p></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><p className="text-slate-400">Tgl Lahir</p><p className="mt-1 text-xl text-slate-800">{dataQuality.missingBirthDate + dataQuality.invalidBirthDate}</p></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><p className="text-slate-400">Gender</p><p className="mt-1 text-xl text-slate-800">{dataQuality.missingGender + dataQuality.invalidGender}</p></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><p className="text-slate-400">Desa</p><p className="mt-1 text-xl text-slate-800">{dataQuality.missingVillage}</p></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><p className="text-slate-400">Workflow</p><p className="mt-1 text-xl text-slate-800">{dataQuality.invalidWorkflow}</p></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3"><p className="text-slate-400">Duplikat Tahun</p><p className="mt-1 text-xl text-slate-800">{dataQuality.duplicateIdentityYear}</p></div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 md:col-span-3"><p className="text-slate-400">Final tanpa dokter</p><p className="mt-1 text-xl text-slate-800">{dataQuality.finalizedWithoutDoctor}</p></div>
            </div>
        </div>
    ),
    'bottleneck': (
        <div key="bottleneck" className={`bg-white rounded-[1.5rem] shadow-sm border p-6 flex flex-col h-full ${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
                <div>
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em]">Bottleneck Antrian</h3>
                    <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status dengan beban terbanyak</p>
                </div>
                <div className={`rounded-2xl px-3 py-2 text-right ${maxBottleneckCount >= 10 ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>
                    <p className="text-2xl font-black leading-none">{bottleneckRows[0]?.count || 0}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest">Tertahan</p>
                </div>
            </div>
            {bottleneckRows.length === 0 ? (
                <div className="flex-1 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">Belum ada data</div>
            ) : (
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                    {bottleneckRows.slice(0, 4).map(row => (
                        <div key={row.status} className="space-y-1.5">
                            <div className="flex justify-between items-end gap-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{row.label}</span>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${row.count >= 10 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>{row.count} Org</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                <div style={{ width: `${Math.max(8, (row.count / maxBottleneckCount) * 100)}%` }} className={`h-full transition-all duration-700 ${row.count >= 10 ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    ),
    'tot-antrian': (
        <div key="tot-antrian" className={`h-full ${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}`}>
            <CardStat title="Total Antrian" value={stats.total} subtitle="Pasien Terdaftar" gradient="from-blue-600 to-indigo-700" icon="👥" />
        </div>
    ),
    'tot-selesai': (
        <div key="tot-selesai" className={`h-full ${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}`}>
            <CardStat title="Selesai Skrining" value={stats.selesai} subtitle="Rapor Diterbitkan" gradient="from-emerald-600 to-teal-700" icon="✅" />
        </div>
    ),
    'stat-hipertensi': (
        <div key="stat-hipertensi" className={`h-full ${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}`}>
            <CardStatClickable title="Hipertensi" value={stats.klinis.hipertensi} subtitle="Tensi >= 140" gradient="from-rose-500 to-pink-600" icon="🩺" onClick={() => isAdmin ? setPopupConfig({isOpen: true, type: 'hipertensi'}) : handlePublicRestrictedDetail()} />
        </div>
    ),
    'stat-diabetes': (
        <div key="stat-diabetes" className={`h-full ${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}`}>
            <CardStatClickable title="Gula Tinggi" value={stats.klinis.hiperglikemia} subtitle="GDS >= 200" gradient="from-orange-500 to-amber-600" icon="🩸" onClick={() => isAdmin ? setPopupConfig({isOpen: true, type: 'diabetes'}) : handlePublicRestrictedDetail()} />
        </div>
    ),
    'stat-obesitas': (
        <div key="stat-obesitas" className={`h-full ${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}`}>
            <CardStatClickable title="Obesitas" value={stats.klinis.obesitas} subtitle="IMT >= 25" gradient="from-amber-500 to-yellow-600" icon="⚖️" onClick={() => isAdmin ? setPopupConfig({isOpen: true, type: 'obesitas'}) : handlePublicRestrictedDetail()} />
        </div>
    ),
    'stat-paru': (
        <div key="stat-paru" className={`h-full ${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}`}>
            <CardStatClickable title="Risiko Paru" value={stats.klinis.paru_ppok} subtitle="PPOK/TB/Rokok" gradient="from-cyan-500 to-sky-600" icon="🫁" onClick={() => isAdmin ? setPopupConfig({isOpen: true, type: 'paru_ppok'}) : handlePublicRestrictedDetail()} />
        </div>
    ),
    'stat-mental': (
        <div key="stat-mental" className={`h-full ${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}`}>
            <CardStatClickable title="Mental Jiwa" value={stats.klinis.mental} subtitle="Risiko Emosional" gradient="from-indigo-500 to-purple-600" icon="🧠" onClick={() => isAdmin ? setPopupConfig({isOpen: true, type: 'mental'}) : handlePublicRestrictedDetail()} />
        </div>
    ),
    'stat-indera': (
        <div key="stat-indera" className={`h-full ${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}`}>
            <CardStatClickable title="Indera" value={stats.klinis.indera} subtitle="Mata & Telinga" gradient="from-teal-500 to-emerald-600" icon="👁️" onClick={() => isAdmin ? setPopupConfig({isOpen: true, type: 'indera'}) : handlePublicRestrictedDetail()} />
        </div>
    ),
    'ekspor': isAdmin ? (
        <div key="ekspor" className={`bg-white rounded-[1.5rem] shadow-sm border p-4 lg:p-6 flex flex-col justify-center h-full ${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 mb-4 gap-3">
                <h3 className="font-black text-[11px] text-slate-800 uppercase tracking-widest">📂 UNDUH LAPORAN</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* KOLEKTIF */}
                <div className="flex flex-col gap-2 bg-slate-100/80 p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-lg leading-none">📥</span>
                        <span className="font-black text-[10px] text-slate-800 uppercase tracking-widest">Data Kolektif</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={exportExcelKolektif} className="w-full bg-white hover:bg-green-500 hover:text-white border border-slate-200 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm">UNDUH EXCEL</button>
                        <button onClick={exportPdfKolektif} className="w-full bg-white hover:bg-red-500 hover:text-white border border-slate-200 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm">UNDUH PDF</button>
                    </div>
                </div>

                {/* KLASTER */}
                {['Balita', 'Anak/Siswa', 'Dewasa', 'Lansia'].map(k => (
                    <div key={k} className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-lg leading-none">{k === 'Balita' ? '🍼' : k === 'Anak/Siswa' ? '🎒' : k === 'Dewasa' ? '💼' : '🧓'}</span>
                            <span className="font-black text-[10px] text-slate-700 uppercase tracking-widest">{k}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => exportExcelKategori(k)} className="w-full bg-white hover:bg-green-500 hover:text-white border border-slate-200 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm">UNDUH EXCEL</button>
                            <button onClick={() => exportPdfKategori(k)} className="w-full bg-white hover:bg-red-500 hover:text-white border border-slate-200 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm">UNDUH PDF</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ) : (
        <div key="ekspor" className="bg-slate-50 rounded-[1.5rem] shadow-inner border border-slate-200 p-6 flex flex-col justify-center items-center h-full text-slate-400">
            <span className="text-3xl mb-2 opacity-50">🔒</span>
            <p className="text-xs font-black uppercase tracking-widest text-center text-slate-500">Ekspor Terkunci<br/><span className="text-[9px] font-bold text-slate-400">Fitur Khusus Administrator</span></p>
        </div>
    ),
    'tabel': isAdmin ? (
        <div key="tabel" className={`bg-white rounded-[2.5rem] shadow-xl border overflow-hidden flex flex-col h-full min-h-[400px] ${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}`}>
            <div className="p-5 border-b flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50/80 backdrop-blur-md sticky top-0 z-20">
                <div className="relative w-full lg:w-80">
                    <input type="text" placeholder="Cari NIK / Nama / Antrian..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 text-xs font-bold focus:border-blue-500 outline-none transition-all shadow-inner" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                </div>
                {selectedRows.length > 0 && (
                    <div className="flex gap-2 w-full lg:w-auto">
                        <button onClick={handleBulkDelete} className="flex-1 lg:flex-none bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition">HAPUS ({selectedRows.length})</button>
                        <button onClick={() => setSelectedRows([])} className="bg-white text-slate-500 border border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase">BATAL</button>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar shadow-inner">
                <div className="md:hidden divide-y divide-slate-100 bg-white">
                    {filteredVisits.length === 0 ? (
                        <div className="p-10 text-center text-slate-300 font-black uppercase tracking-widest italic">Tidak ada data ditemukan</div>
                    ) : (
                        filteredVisits.map(v => (
                            <div key={v.id} className={`p-4 ${selectedRows.includes(v.id) ? 'bg-blue-50' : 'bg-white'}`}>
                                <div className="flex items-start gap-3">
                                    <input type="checkbox" checked={selectedRows.includes(v.id)} onChange={() => handleSelectRow(v.id)} className="mt-1 w-5 h-5 rounded border-slate-300 cursor-pointer shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-black text-slate-800 text-base leading-tight break-words">{v.pasien_snapshot?.nama || 'Tanpa Nama'}</p>
                                        <p className="text-[11px] font-mono text-slate-400 mt-1 break-all">NIK: {maskNik(v.patientNIK)}</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{v.kategori_usia_satusehat || 'Dewasa'} · {v.umur_saat_periksa || 0} THN</span>
                                            <QueueStatusBadge status={v.status_antrian} className="rounded-lg px-2.5 py-1 text-[10px]" />
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] font-black">
                                            <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-rose-600">Tensi: {getVisitBloodPressure(v).label}</span>
                                            <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-orange-600">Gula: {getVisitGlucose(v).label}</span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-2">
                                        <button type="button" aria-label="Buka rapor digital" title="Buka rapor digital" onClick={() => window.open(`/rapor/${v.id}`, '_blank')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-teal-600 shadow-sm">🖨️</button>
                                        <button type="button" aria-label="Edit data pasien" title="Edit data pasien" onClick={() => openEditModal(v)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">✏️</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <table className="hidden md:table w-full text-left text-xs border-collapse min-w-[800px]">
                    <thead className="bg-white border-b-2 border-slate-100 sticky top-0 z-10 shadow-sm">
                        <tr className="font-black uppercase text-slate-400 text-[10px] tracking-widest">
                            <th className="px-4 py-3 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={selectedRows.length === filteredVisits.length && filteredVisits.length > 0} className="w-4 h-4 rounded border-slate-300 cursor-pointer" /></th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition" onClick={() => requestSort('identitas')}>Identitas Pasien {sortConfig.key === 'identitas' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}</th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition" onClick={() => requestSort('kategori')}>Kategori Umur {sortConfig.key === 'kategori' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}</th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition" onClick={() => requestSort('klinis')}>Status Klinis Dasar {sortConfig.key === 'klinis' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}</th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition" onClick={() => requestSort('antrian')}>Posisi Antrian {sortConfig.key === 'antrian' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredVisits.length === 0 ? (
                            <tr><td colSpan="6" className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">Tidak ada data ditemukan</td></tr>
                        ) : (
                            filteredVisits.map(v => (
                                <tr key={v.id} className={`hover:bg-blue-50/40 transition-colors ${selectedRows.includes(v.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-2 text-center"><input type="checkbox" checked={selectedRows.includes(v.id)} onChange={() => handleSelectRow(v.id)} className="w-4 h-4 rounded border-slate-300 cursor-pointer" /></td>
                                    <td className="px-4 py-2">
                                        <p className="font-black text-slate-800 text-sm">{v.pasien_snapshot?.nama}</p>
                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 tracking-tighter">NIK: {maskNik(v.patientNIK)}</p>
                                    </td>
                                    <td className="px-4 py-2">
                                        <p className="font-bold text-slate-700 text-xs capitalize">{v.kategori_usia_satusehat || 'Dewasa'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{v.umur_saat_periksa || 0} Tahun</p>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <span className="bg-white border border-slate-200 px-2 py-1 rounded-md font-bold text-rose-600 text-[10px] shadow-sm leading-none">🩺 {getVisitBloodPressure(v).label}</span>
                                            <span className="bg-white border border-slate-200 px-2 py-1 rounded-md font-bold text-orange-600 text-[10px] shadow-sm leading-none">🩸 {getVisitGlucose(v).label}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <QueueStatusBadge status={v.status_antrian} className="px-3 py-1.5 text-[9px] shadow-sm" />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => window.open(`/rapor/${v.id}`, '_blank')} className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-teal-600 shadow-sm hover:bg-teal-600 hover:text-white transition">🖨️</button>
                                            <button onClick={() => openEditModal(v)} className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition">✏️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    ) : (
        <div key="tabel" className="bg-slate-50 rounded-[2.5rem] shadow-inner border border-slate-200 overflow-hidden flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 p-8">
            <span className="text-6xl mb-4 opacity-50">🔒</span>
            <h3 className="text-sm md:text-base font-black uppercase tracking-widest text-center text-slate-600">Daftar Pasien Disembunyikan</h3>
            <p className="text-[10px] md:text-xs text-center mt-3 max-w-md font-bold text-slate-400 leading-relaxed">
                Sesuai kebijakan privasi dan perlindungan data rekam medis, detail identitas (Nama/NIK) dan riwayat klinis individu tidak dapat diakses secara publik.
            </p>
            <p className="text-[10px] md:text-xs text-center mt-1 font-bold text-slate-400 leading-relaxed">
                Silakan masuk menggunakan akun <span className="text-blue-500">Administrator</span> untuk membuka kunci data ini.
            </p>
        </div>
    )
  };

  if (loading) return <div className="fixed inset-0 bg-slate-50 flex flex-col justify-center items-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="mt-4 font-black text-blue-900 tracking-widest animate-pulse">MEMUAT SISTEM...</p></div>;

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8fafc] flex flex-col h-screen w-screen overflow-hidden font-sans">

      {/* HEADER PUTIH ATAS */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex justify-between items-center shrink-0 shadow-sm print-hidden sticky top-0 z-50">
          <div className="flex items-center gap-2 md:gap-3">
              <span className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm shadow-sm">📊</span>
              <h1 className="font-black text-slate-800 text-sm md:text-base tracking-widest uppercase hidden sm:block">Master Command Center</h1>
          </div>
          <div className="flex items-center gap-2">
              {!isMobile && isAdmin && (
                  <button onClick={toggleEditMode} className={`px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition flex items-center gap-1.5 border shadow-sm ${isEditMode ? 'bg-amber-500 text-white border-amber-600 animate-pulse' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                      {isEditMode ? '💾 KUNCI TATA LETAK' : '🛠️ KUSTOMISASI'}
                  </button>
              )}
              <div className="w-px h-5 bg-slate-300 mx-1 hidden md:block"></div>
              <button onClick={() => navigate('/')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition flex items-center gap-1.5 hidden md:flex"><span>🏠</span> Beranda</button>
              {isAuthenticated ? (
                  <button onClick={handleLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition flex items-center gap-1.5 hidden md:flex"><span>🚪</span> Keluar</button>
              ) : (
                  <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition flex items-center gap-1.5 hidden md:flex"><span>🔑</span> Masuk Admin</button>
              )}
          </div>
      </header>

      {/* DASHBOARD KONTEN AREA */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative">
          <div className="dashboard-container">

              {/* BANNER HITAM */}
          <div className="m-4 lg:m-6 bg-slate-900 rounded-2xl px-5 py-4 md:px-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="relative z-10 flex items-center gap-4">
                  <div className="hidden md:flex w-16 h-16 bg-white rounded-2xl items-center justify-center border-4 border-emerald-400 p-1.5 animate-pulse shadow-lg shadow-emerald-500/50 shrink-0">
                      <img src="/logo_pinrang.png" alt="Logo Pinrang" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-center md:text-left">
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md leading-none">Dashboard Data TERSANJUNG</h2>
                      <p className="text-emerald-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Live Monitoring • Puskesmas Malimpung</p>
                  </div>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center shrink-0">

                  <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 w-full sm:w-auto">
                      <span className="text-xs mr-1">🌍</span>
                      <select value={filterDesa} onChange={(e) => setFilterDesa(e.target.value)} className="w-full sm:w-48 bg-transparent text-white py-2 font-bold text-xs outline-none cursor-pointer">
                          <option value="Semua" className="text-slate-900">Seluruh Wilayah Kerja</option>
                          <option value="Desa Malimpung" className="text-slate-900">Desa Malimpung</option>
                          <option value="Desa Padang Loang" className="text-slate-900">Desa Padang Loang</option>
                          <option value="Kelurahan Maccirinna" className="text-slate-900">Kel. Maccirinna</option>
                      </select>
                  </div>

                  {!isMobile && isAdmin && (
                      <button onClick={resetLayout} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 border border-rose-500 active:scale-95 shrink-0">
                          🔄 RESET LAYOUT
                      </button>
                  )}
              </div>
          </div>

          {pesan && <div className="mx-4 lg:mx-6 mb-4 p-3 bg-blue-600 text-white rounded-2xl font-black text-xs text-center shadow-xl animate-bounce shrink-0">{pesan}</div>}
          <DashboardInsightPanel insights={insightRows} />

          {/* AREA WIDGET (CONDITIONAL RENDERING) */}
          <div className={`mx-4 lg:mx-6 mb-10 ${isEditMode && !isMobile ? "bg-slate-200/50 rounded-[2rem] border-2 border-dashed border-amber-400 p-2" : ""}`}>

              {isMobile ? (
                  // =====================================================================
                  // TAMPILAN MOBILE: NATIVE FLEXBOX (Performa Sangat Tinggi)
                  // =====================================================================
                  <div className="flex flex-col gap-4 w-full">
                      <div className="h-28">{widgets['tot-antrian']}</div>
                      <div className="h-28">{widgets['tot-selesai']}</div>
                      {widgets['traffic']}
                      {widgets['umur']}
                      {widgets['demografi']}
                      {widgets['quality']}
                      {widgets['bottleneck']}
                      {/* Grid khusus untuk 6 Kartu Klinik di Mobile */}
                      <div className="grid grid-cols-2 gap-3 h-56">
                          {widgets['stat-hipertensi']}
                          {widgets['stat-diabetes']}
                          {widgets['stat-obesitas']}
                          {widgets['stat-paru']}
                          {widgets['stat-mental']}
                          {widgets['stat-indera']}
                      </div>
                      {widgets['ekspor']}
                      {widgets['tabel']}
                  </div>
              ) : (
                  // =====================================================================
                  // TAMPILAN DESKTOP: REACT-GRID-LAYOUT (Drag & Drop)
                  // =====================================================================
                  <div className="min-h-[500px]">
                      <AutoWidthGrid
                          className="layout"
                          layouts={layouts}
                          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                          cols={{ lg: 24, md: 24, sm: 24 }}
                          rowHeight={40}
                          onLayoutChange={handleLayoutChange}
                          isDraggable={isEditMode}
                          isResizable={isEditMode}
                          margin={[16, 16]}
                          useCSSTransforms={true}
                      >
                          {/* Render semua value dari objek widgets */}
                          {Object.keys(widgets).map(key => (
                              <div key={key}>{widgets[key]}</div>
                          ))}
                      </AutoWidthGrid>
                  </div>
              )}

          </div>
        </div>

      </div>

      {/* POPUP DETAIL PASIEN KLINIS */}
      {isAdmin && popupConfig.isOpen && (
          <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-md flex justify-center items-center p-6 print-hidden">
              <div className="bg-white rounded-[3rem] w-full max-w-4xl p-8 shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up border border-white/20">
                  <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-100 pb-5">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{currentPopupInfo.icon}</div>
                        <div>
                            <h3 className="font-black text-2xl text-slate-800 tracking-tight">{currentPopupInfo.title}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daftar Pasien Hasil Skrining Risiko Tinggi</p>
                        </div>
                      </div>
                      <button onClick={() => setPopupConfig({isOpen: false, type: '', title: ''})} className="w-12 h-12 bg-slate-100 text-slate-500 hover:bg-rose-600 hover:text-white rounded-full flex items-center justify-center transition-all font-black shadow-inner">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 rounded-[2rem] p-4 border-2 border-slate-100 shadow-inner custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {popupPatients.map(p => (
                              <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-500 transition-colors cursor-pointer" onClick={() => window.open(`/rapor/${p.id}`, '_blank')}>
                                  <div className="flex justify-between">
                                      <div>
                                          <p className="font-black text-slate-800 text-base">{p.pasien_snapshot?.nama}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.kategori_usia_satusehat} • {p.umur_saat_periksa} THN</p>
                                      </div>
                                      <span className="text-2xl group-hover:translate-x-1 transition-transform">➔</span>
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                      {popupConfig.type === 'hipertensi' && <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black border border-rose-200">🩺 TD: {getVisitBloodPressure(p).label}</span>}
                                      {popupConfig.type === 'diabetes' && <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-lg text-[10px] font-black border border-orange-200">🩸 Gula: {getVisitGlucose(p).label}</span>}
                                      {popupConfig.type === 'obesitas' && <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black border border-amber-200">⚖️ IMT: {(parseFloat(p.pos2?.bb) / Math.pow(parseFloat(p.pos2?.tb)/100, 2)).toFixed(1)}</span>}
                                  </div>
                              </div>
                          ))}
                          {popupPatients.length === 0 && <div className="col-span-2 text-center py-10 text-slate-400 font-bold uppercase tracking-widest">Tidak ada pasien.</div>}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL EDIT */}
      {isAdmin && editingVisit && (
          <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 print-hidden">
              <div className="bg-white rounded-[2rem] w-full max-w-lg p-6 md:p-8 shadow-2xl animate-fade-in-up">
                  <h3 className="font-black text-lg mb-4 border-b pb-2 text-slate-800">✏️ Edit Rekam Medis</h3>
                  <div className="space-y-3">
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Pasien</label><input type="text" value={editForm.nama} onChange={e => setEditForm({...editForm, nama: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold mt-1" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NIK</label><input type="text" value={editForm.nik} onChange={e => setEditForm({...editForm, nik: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-mono mt-1" /></div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Antrian</label>
                          <select value={editForm.status_antrian} onChange={e => setEditForm({...editForm, status_antrian: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold mt-1 cursor-pointer">
                              {POS_QUEUE_OPTIONS.map(pos => (
                                  <option key={pos.key} value={pos.value}>{pos.label}</option>
                              ))}
                              <option value={STATUS_MAPPING.SELESAI}>Selesai</option>
                          </select>
                      </div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revisi Keterangan</label><textarea value={editForm.keterangan_akhir} onChange={e => setEditForm({...editForm, keterangan_akhir: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1" rows="3"></textarea></div>
                  </div>
                  <div className="flex gap-2 mt-5">
                      <button onClick={() => setEditingVisit(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition">Batal</button>
                      <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm hover:bg-blue-700 transition">Simpan</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}


export default Dashboard;
