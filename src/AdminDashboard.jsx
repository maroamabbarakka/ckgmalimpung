import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import PusatBantuan from './components/PusatBantuan';
import ConnectionStatus from './components/system/ConnectionStatus';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { STATUS_MAPPING } from './utils/constants';
import { exportClusterExcel, exportClusterPDF, exportToPKGExcel, exportToPKG_PDF, exportJsonToExcel } from './utils/exportPKG';
import { openIntegratedHtmlReport } from './utils/htmlReport';
import { logActivity } from './utils/logger';
import { maskNik } from './utils/privacy';
import { safeBack } from './utils/navigation';
import { syncUserProfileFromStaff } from './services/userProfileService';
import {
  deleteSchool,
  fetchCollectionBackup,
  removeDuplicateSchools,
  resetStaffPin,
  saveSchool,
  saveStaff,
  subscribeActivityLogs,
  subscribeAdminSchools,
  subscribeAdminStaff,
  subscribeAdminVisits,
  toggleStaffActive
} from './services/adminService';

const LOGO_PINRANG = '/logo_pinrang.png';
const LOGO_MALIMPUNG = '/logo_malimpung.png';

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const DESA_OPTIONS = ['Semua', 'Desa Malimpung', 'Desa Padang Loang', 'Kelurahan Maccirinna', 'Luar Wilayah'];
const CLUSTER_OPTIONS = ['Semua', 'Bayi/Balita', 'Anak/Siswa', 'Dewasa', 'Lansia'];
const AVAILABLE_ROLES = [
  { id: 'petugas', label: 'Petugas Umum', desc: 'Akses pendaftaran dan pencatatan dasar.' },
  { id: 'ttlm', label: 'Analis (TTLM)', desc: 'Akses ke modul laboratorium dan input hasil.' },
  { id: 'perawat', label: 'Perawat', desc: 'Akses anamnesa dan tindakan keperawatan.' },
  { id: 'perawat_bidan', label: 'Bidan', desc: 'Akses KIA, KB, dan tindakan kebidanan.' },
  { id: 'dokter', label: 'Dokter', desc: 'Akses diagnosa, resep, dan rekam medis penuh.' },
  { id: 'apoteker', label: 'Apoteker', desc: 'Akses manajemen obat dan penyerahan resep.' },
  { id: 'admin', label: 'Administrator', desc: 'Otoritas penuh pada pengaturan sistem dan SDM.' }
];



const TARGET_DUSUN_MINIMUM = 20;

const toDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value.toMillis) return new Date(value.toMillis());
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const getVisitDate = (visit) => {
  const fromTimestamp = toDate(visit.waktu_ambil_tiket || visit.waktu_selesai_total || visit.lastUpdated);
  if (fromTimestamp) return fromTimestamp;
  if (visit.tanggal_pelaksanaan) {
    const parsed = new Date(`${visit.tanggal_pelaksanaan}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const dateKey = (date) => {
  if (!date) return 'Tanpa Tanggal';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value || 0);

const formatWaktu = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getCluster = (visit) => {
  const raw = String(visit.kategori_usia_satusehat || '').toLowerCase();
  if (raw.includes('bayi') || raw.includes('balita')) return 'Bayi/Balita';
  if (raw.includes('anak') || raw.includes('remaja') || raw.includes('siswa') || ['sd', 'smp', 'sma'].includes(raw)) return 'Anak/Siswa';
  if (raw.includes('lansia')) return 'Lansia';
  return 'Dewasa';
};

const getDesa = (visit) => visit.pasien_snapshot?.desa || visit.desa_pelaksanaan || 'Belum Diisi';
const getDusun = (visit) => visit.pasien_snapshot?.dusun || visit.tempat_pelaksanaan || 'Belum Diisi';
const isCompleted = (visit) => visit.status_antrian === STATUS_MAPPING.SELESAI || visit.status_antrian === 'Selesai';
const isAttended = (visit) => Boolean(visit.patientNIK || visit.pasien_snapshot?.nama || isCompleted(visit) || visit.status_antrian !== STATUS_MAPPING.POS1);
const extractVisitValue = (posData, keywords, questionMap = {}) => {
  if (!posData) return null;
  const key = Object.keys(posData).find((itemKey) => {
    const keyText = String(itemKey).toLowerCase();
    const questionText = String(questionMap[itemKey] || '').toLowerCase();
    return keywords.some((keyword) => keyText.includes(keyword) || questionText.includes(keyword));
  });
  return key ? posData[key] : null;
};

const getVisitAnthropometry = (visit) => ({
  tb: visit.pos2?.tb || extractVisitValue(visit.pos2, ['tinggi badan'], visit.pos2_question_map),
  bb: visit.pos2?.bb || extractVisitValue(visit.pos2, ['berat badan'], visit.pos2_question_map),
  lp: visit.pos2?.lp || extractVisitValue(visit.pos2, ['lingkar perut'], visit.pos2_question_map)
});

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const visitMatchesSchool = (visit, school) => {
  // Hanya hubungkan data anak sekolah
  if (getCluster(visit) !== 'Anak/Siswa' && getCluster(visit) !== 'Bayi/Balita') return false;

  const haystack = normalizeText(JSON.stringify(visit));
  const schoolName = normalizeText(school.name);
  const npsn = normalizeText(school.npsn);
  
  // Hindari false positive dari kata-kata umum jika schoolName terlalu pendek
  if (schoolName && schoolName.length < 4) return false;
  
  return (
    (schoolName && haystack.includes(schoolName)) ||
    (npsn && npsn !== '-' && npsn.length > 3 && haystack.includes(npsn))
  );
};

const getRiskStats = (visits) => {
  const stats = {
    hipertensi: 0,
    hiperglikemia: 0,
    obesitas: 0,
    paru: 0,
    mental: 0,
    indera: 0
  };

  visits.forEach((visit) => {
    const td = String(visit.pos2?.td || extractVisitValue(visit.pos2, ['tekanan darah'], visit.pos2_question_map) || '');
    const systolic = parseInt(extractVisitValue(visit.pos2, ['sistolik'], visit.pos2_question_map) || td.split('/')[0], 10);
    const diastolic = parseInt(extractVisitValue(visit.pos2, ['diastolik'], visit.pos2_question_map) || td.split('/')[1], 10);
    if ((!Number.isNaN(systolic) && systolic >= 140) || (!Number.isNaN(diastolic) && diastolic >= 90)) stats.hipertensi += 1;

    const gds = parseInt(visit.pos4?.gds || extractVisitValue(visit.pos4, ['gula darah sewaktu', 'gds'], visit.pos4_question_map) || visit.pos2?.gds || extractVisitValue(visit.pos2, ['gula darah sewaktu', 'gds'], visit.pos2_question_map) || 0, 10);
    const gdp = parseInt(visit.pos4?.gdp || extractVisitValue(visit.pos4, ['gula darah puasa', 'gdp'], visit.pos4_question_map) || visit.pos2?.gdp || extractVisitValue(visit.pos2, ['gula darah puasa', 'gdp'], visit.pos2_question_map) || 0, 10);
    if (gds >= 200 || gdp >= 126) stats.hiperglikemia += 1;

    const { tb: tbRaw, bb: bbRaw } = getVisitAnthropometry(visit);
    const tb = parseFloat(tbRaw || 0);
    const bb = parseFloat(bbRaw || 0);
    if (tb > 0 && bb > 0 && !['Bayi/Balita'].includes(getCluster(visit))) {
      const imt = bb / Math.pow(tb / 100, 2);
      if (imt >= 25) stats.obesitas += 1;
    }

    const p3 = visit.pos3 || {};
    const p4 = visit.pos4 || {};
    const p5 = visit.pos5 || {};
    const p6 = visit.pos6 || {};
    const skilas = p3.skilas || p6.skilas || {};

    if (
      p4.ppok?.nafas_pendek === 'Ya' ||
      p5.ppok?.nafas_pendek === 'Ya' ||
      p4.resiko_ca_paru?.riw_merokok === 'Ya' ||
      p4.resiko_tb?.batuk_lama === '>2Mg' ||
      p5.resiko_tb?.batuk === 'Ya'
    ) {
      stats.paru += 1;
    }

    const mental =
      Object.values(p3.jiwa_srq20 || {}).some((value) => String(value) !== 'Tidak' && String(value) !== 'Tdk' && value !== '') ||
      Object.values(p6.jiwa_srq20 || {}).some((value) => String(value) !== 'Tidak' && String(value) !== 'Tdk' && value !== '') ||
      Object.values(p3.jiwa_sdq || {}).some((value) => String(value) === 'Ya') ||
      skilas.dep_sedih === 'Ya' ||
      skilas.dep_minat_turun === 'Ya';
    if (mental) stats.mental += 1;

    const visus = String(p3.mata?.visus || '').toLowerCase();
    if ((visus && !['6/6', 'normal'].includes(visus)) || p3.telinga?.gg_pendengaran === 'Ya' || p3.telinga?.infeksi === 'Ya') {
      stats.indera += 1;
    }
  });

  return stats;
};

const SelectField = ({ label, value, onChange, options, disabled = false }) => (
  <label className="block">
    <span className="block text-[11px] font-semibold text-slate-950 mb-2">{label}</span>
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full h-11 rounded-lg border border-slate-300 px-3 text-xs font-semibold outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${disabled ? 'bg-slate-200 text-slate-500' : 'bg-white text-slate-700'}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const SummaryMetric = ({ label, value, helper }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-teal-100">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
    {helper && <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>}
  </div>
);



function AdminDashboard({ initialMenu = 'wilayah' }) {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [openMonth, setOpenMonth] = useState(new Date().getMonth());
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolList, setSchoolList] = useState([]);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editSchool, setEditSchool] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffPosFilter, setStaffPosFilter] = useState('Semua');
  const [staffStatusFilter, setStaffStatusFilter] = useState('Semua');
  const [logSearch, setLogSearch] = useState('');
  const [simpegTab, setSimpegTab] = useState('staff');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [selectedRiskPatient, setSelectedRiskPatient] = useState(null);
  const [selectedSchoolPatients, setSelectedSchoolPatients] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarGroupsOpen, setSidebarGroupsOpen] = useState({
    umum: true,
    sekolah: true,
    klaster2: true,
    klaster3: true,
    sarana: true,
    notif: true
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isGlobalFilterOpen, setIsGlobalFilterOpen] = useState(false);
  const [currentDateMs] = useState(() => Date.now());
  const [hasNewNotif, setHasNewNotif] = useState(true);
  const [filters, setFilters] = useState({
    tahun: 'Semua',
    bulan: 'Semua',
    jenjang: 'Semua',
    sekolah: 'Semua',
    kelas: 'Semua',
    usia: 'Semua'
  });
  const { user, signOut } = useAuth();

  const userName = user?.nama || 'Administrator';
  
  const getHeaderTitle = () => {
    switch(activeMenu) {
      case 'pendaftaran': return { title: 'Dashboard Pendaftaran CKG', subtitle: 'Informasi dan Statistik Pendaftaran', color: 'text-blue-600' };
      case 'kehadiran': return { title: 'Dashboard Kehadiran CKG', subtitle: 'Pemantauan Kehadiran Peserta', color: 'text-emerald-600' };
      case 'laporan': return { title: 'Laporan & Ekspor Data CKG', subtitle: 'Unduh laporan format Excel terpadu', color: 'text-amber-600' };
      case 'wilayah': return { title: 'Pemetaan Wilayah & Analitik Demografi', subtitle: 'Pusat pemantauan sebaran indikator kesehatan dan PTM', color: 'text-teal-600' };
      case 'sekolah': return { title: 'Data Sarana Binaan', subtitle: 'Manajemen Data Fasilitas dan Sarana', color: 'text-indigo-600' };
      case 'simpeg': return { title: 'Sistem Informasi Manajemen Pegawai', subtitle: 'Manajemen Nakes & Backup Database', color: 'text-purple-600' };
      case 'profil': return { title: 'Profil Administrator', subtitle: 'Pengaturan Akun dan Keamanan', color: 'text-rose-600' };
      case 'privasi': return { title: 'Kebijakan Privasi', subtitle: 'Ketentuan Penggunaan dan Privasi', color: 'text-slate-700' };
      case 'bantuan': return { title: 'Pusat Bantuan', subtitle: 'Dokumentasi, FAQ, dan Petunjuk Penggunaan', color: 'text-slate-800' };
      default: return null;
    }
  };
  const headerInfo = getHeaderTitle();
  const activeFilterCount = Object.values(filters).filter((value) => value !== 'Semua').length;
  const filterSummary = [
    filters.tahun,
    filters.bulan,
    'Malimpung',
    activeFilterCount ? `${activeFilterCount} filter aktif` : 'Semua data'
  ].filter(Boolean).join(' · ');

  useEffect(() => {
    // Membatasi pengambilan data hingga 2500 kunjungan terakhir untuk mencegah Firebase Out of Quota
    const unsubscribe = subscribeAdminVisits(
      (data) => {
        setVisits(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeSchools = subscribeAdminSchools(setSchoolList);

    const unsubscribeStaff = subscribeAdminStaff((data) => {
      setStaffList(data);
      setStaffLoading(false);
    });

    const unsubscribeLogs = subscribeActivityLogs((data) => {
      setActivityLogs(data);
      setLogsLoading(false);
    });

    return () => {
      unsubscribeStaff();
      unsubscribeLogs();
      unsubscribeSchools();
    };
  }, []);

  const enrichedVisits = useMemo(() => visits.map((visit) => ({ ...visit, _date: getVisitDate(visit) })), [visits]);

  const filteredVisits = useMemo(() => {
    return enrichedVisits.filter((visit) => {
      const visitDate = visit._date;
      const matchTahun = filters.tahun === 'Semua' || String(visitDate?.getFullYear()) === filters.tahun;
      const matchBulan = filters.bulan === 'Semua' || visitDate?.getMonth() === MONTHS.indexOf(filters.bulan);
      
      let matchJenjang = true;
      if (filters.jenjang !== 'Semua') {
          const k = String(visit.pos1?.kelas || '');
          let j = '';
          if (k) {
              const ki = parseInt(k);
              if (ki <= 6) j = 'SD/MI/Sederajat';
              else if (ki <= 9) j = 'SMP/MTs/Sederajat';
              else if (ki <= 12) j = 'SMA/MA/Sederajat';
          }
          matchJenjang = (j === filters.jenjang);
      }

      const matchSekolah = filters.sekolah === 'Semua' || visit.pos1?.sekolah === filters.sekolah;
      const matchKelas = filters.kelas === 'Semua' || String(visit.pos1?.kelas) === filters.kelas.replace('Kelas ', '');
      
      let matchUsia = true;
      if (filters.usia !== 'Semua') {
          const ageNum = visit._age !== undefined ? visit._age : -1;
          const u = filters.usia;
          if(u.includes('Tahun')) {
              const target = parseInt(u);
              matchUsia = (ageNum === target);
          } else if(u.includes('Bulan') || u.includes('Hari')) {
              matchUsia = (ageNum === 0);
          } else if(u === 'Lansia') {
              matchUsia = ageNum > 20 || getCluster(visit) === 'Lansia';
          }
      }

      return matchTahun && matchBulan && matchJenjang && matchSekolah && matchKelas && matchUsia;
    });
  }, [enrichedVisits, filters]);

  const analytics = useMemo(() => {
    const total = filteredVisits.length;
    const hadir = filteredVisits.filter(isAttended).length;
    const selesai = filteredVisits.filter(isCompleted).length;
    const laki = filteredVisits.filter((visit) => visit.pasien_snapshot?.j_kelamin === 'L').length;
    const perempuan = filteredVisits.filter((visit) => visit.pasien_snapshot?.j_kelamin === 'P').length;
    const risks = getRiskStats(filteredVisits);
    const riskPatients = {
      hipertensi: [],
      hiperglikemia: [],
      obesitas: [],
      paru: [],
      mental: [],
      indera: []
    };

    filteredVisits.forEach((visit) => {
      const td = String(visit.pos2?.td || extractVisitValue(visit.pos2, ['tekanan darah'], visit.pos2_question_map) || '');
      const systolic = parseInt(extractVisitValue(visit.pos2, ['sistolik'], visit.pos2_question_map) || td.split('/')[0], 10);
      const diastolic = parseInt(extractVisitValue(visit.pos2, ['diastolik'], visit.pos2_question_map) || td.split('/')[1], 10);
      if ((!Number.isNaN(systolic) && systolic >= 140) || (!Number.isNaN(diastolic) && diastolic >= 90)) riskPatients.hipertensi.push(visit);

      const gds = parseInt(visit.pos4?.gds || extractVisitValue(visit.pos4, ['gula darah sewaktu', 'gds'], visit.pos4_question_map) || visit.pos2?.gds || extractVisitValue(visit.pos2, ['gula darah sewaktu', 'gds'], visit.pos2_question_map) || 0, 10);
      const gdp = parseInt(visit.pos4?.gdp || extractVisitValue(visit.pos4, ['gula darah puasa', 'gdp'], visit.pos4_question_map) || visit.pos2?.gdp || extractVisitValue(visit.pos2, ['gula darah puasa', 'gdp'], visit.pos2_question_map) || 0, 10);
      if (gds >= 200 || gdp >= 126) riskPatients.hiperglikemia.push(visit);

      const { tb: tbRaw, bb: bbRaw } = getVisitAnthropometry(visit);
      const tb = parseFloat(tbRaw || 0);
      const bb = parseFloat(bbRaw || 0);
      if (tb > 0 && bb > 0 && !['Bayi/Balita'].includes(getCluster(visit))) {
        const imt = bb / Math.pow(tb / 100, 2);
        if (imt >= 25) riskPatients.obesitas.push(visit);
      }

      const p3 = visit.pos3 || {};
      const p4 = visit.pos4 || {};
      const p5 = visit.pos5 || {};
      const p6 = visit.pos6 || {};
      const skilas = p3.skilas || p6.skilas || {};

      if (
        p4.ppok?.nafas_pendek === 'Ya' ||
        p5.ppok?.nafas_pendek === 'Ya' ||
        p4.resiko_ca_paru?.riw_merokok === 'Ya' ||
        p4.resiko_tb?.batuk_lama === '>2Mg' ||
        p5.resiko_tb?.batuk === 'Ya'
      ) {
        riskPatients.paru.push(visit);
      }

      const mental =
        Object.values(p3.jiwa_srq20 || {}).some((value) => String(value) !== 'Tidak' && String(value) !== 'Tdk' && value !== '') ||
        Object.values(p6.jiwa_srq20 || {}).some((value) => String(value) !== 'Tidak' && String(value) !== 'Tdk' && value !== '') ||
        Object.values(p3.jiwa_sdq || {}).some((value) => String(value) === 'Ya') ||
        skilas.dep_sedih === 'Ya' ||
        skilas.dep_minat_turun === 'Ya';
      if (mental) riskPatients.mental.push(visit);

      const visus = String(p3.mata?.visus || '').toLowerCase();
      if ((visus && !['6/6', 'normal'].includes(visus)) || p3.telinga?.gg_pendengaran === 'Ya' || p3.telinga?.infeksi === 'Ya') {
        riskPatients.indera.push(visit);
      }
    });


    const trendMap = new Map();
    filteredVisits.forEach((visit) => {
      const key = dateKey(visit._date);
      const current = trendMap.get(key) || { tanggal: key, pendaftar: 0, hadir: 0, selesai: 0 };
      current.pendaftar += 1;
      if (isAttended(visit)) current.hadir += 1;
      if (isCompleted(visit)) current.selesai += 1;
      trendMap.set(key, current);
    });

    const byCluster = CLUSTER_OPTIONS.filter((item) => item !== 'Semua').map((cluster) => ({
      name: cluster,
      value: filteredVisits.filter((visit) => getCluster(visit) === cluster).length
    }));

    const byPos = ['Pos 1', 'Pos 2', 'Pos 3', 'Pos 4', 'Pos 5', 'Pos 6', 'Pos 7', 'Selesai'].map((label) => ({
      name: label,
      value:
        label === 'Selesai'
          ? selesai
          : filteredVisits.filter((visit) => String(visit.status_antrian || '').toLowerCase().includes(label.toLowerCase())).length
    }));

    return {
      total,
      hadir,
      selesai,
      belumHadir: Math.max(total - hadir, 0),
      laki,
      perempuan,
      risks,
      riskPatients,
      trend: Array.from(trendMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
      byCluster,
      byPos,
      completionRate: total ? (selesai / total) * 100 : 0,
      attendanceRate: total ? (hadir / total) * 100 : 0
    };
  }, [filteredVisits]);

  const wilayahAnalytics = useMemo(() => {
    const byDusunMap = new Map();
    
    // Inisialisasi semua wilayah agar tetap tampil meski kosong
    const SEMUA_DUSUN = [
      { name: "Dusun Palita", desa: "Desa Malimpung" },
      { name: "Dusun Malimpung", desa: "Desa Malimpung" },
      { name: "Dusun Pajalele", desa: "Desa Malimpung" },
      { name: "Dusun Padang", desa: "Desa Padang Loang" },
      { name: "Dusun Banga", desa: "Desa Padang Loang" },
      { name: "Lingkungan Dioang", desa: "Kelurahan Maccirinna" },
      { name: "Lingkungan Bulu Dua", desa: "Kelurahan Maccirinna" },
      { name: "Lingkungan Paraungan", desa: "Kelurahan Maccirinna" }
    ];

    SEMUA_DUSUN.forEach(d => {
       byDusunMap.set(d.name, {
          name: d.name, desa: d.desa,
          total: 0, hadir: 0, selesai: 0,
          hipertensi: 0, diabetes: 0, obesitas: 0, paru: 0, mental: 0, indera: 0
       });
    });

    const ageGroups = {
       'Balita (0-5)': 0,
       'Anak (6-11)': 0,
       'Remaja (12-18)': 0,
       'Dewasa (19-59)': 0,
       'Lansia (60+)': 0
    };

    filteredVisits.forEach((visit) => {
      const key = getDusun(visit);
      const desa = getDesa(visit);
      const current =
        byDusunMap.get(key) || {
          name: key,
          desa,
          total: 0,
          hadir: 0,
          selesai: 0,
          hipertensi: 0,
          diabetes: 0,
          obesitas: 0,
          paru: 0,
          mental: 0,
          indera: 0
        };

      current.total += 1;
      if (isAttended(visit)) current.hadir += 1;
      if (isCompleted(visit)) current.selesai += 1;

      const risks = getRiskStats([visit]);
      current.hipertensi += risks.hipertensi;
      current.diabetes += risks.hiperglikemia;
      current.obesitas += risks.obesitas;
      current.paru += risks.paru;
      current.mental += risks.mental;
      current.indera += risks.indera;
      byDusunMap.set(key, current);

      let umurStr = visit.pos1?.umur || extractVisitValue(visit.pos1, ['umur'], visit.pos1_question_map) || visit.pasien_snapshot?.umur;
      if (!umurStr && visit.pasien_snapshot?.tgl_lahir) {
        const diffMs = currentDateMs - new Date(visit.pasien_snapshot.tgl_lahir).getTime();
        umurStr = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
      }
      const umur = parseInt(umurStr, 10);
      if (!isNaN(umur)) {
        if (umur <= 5) ageGroups['Balita (0-5)']++;
        else if (umur <= 11) ageGroups['Anak (6-11)']++;
        else if (umur <= 18) ageGroups['Remaja (12-18)']++;
        else if (umur <= 59) ageGroups['Dewasa (19-59)']++;
        else ageGroups['Lansia (60+)']++;
      }
    });

    const byDusun = Array.from(byDusunMap.values())
      .map((item) => ({
        ...item,
        risikoTotal: item.hipertensi + item.diabetes + item.obesitas + item.paru + item.mental + item.indera,
        gap: Math.max(TARGET_DUSUN_MINIMUM - item.total, 0),
        coverage: Math.min((item.total / TARGET_DUSUN_MINIMUM) * 100, 100)
      }))
      .sort((a, b) => b.risikoTotal - a.risikoTotal || b.gap - a.gap || b.total - a.total);

    const byDesa = DESA_OPTIONS.filter((desa) => desa !== 'Semua').map((desa) => {
      const visitsInDesa = filteredVisits.filter((visit) => getDesa(visit) === desa);
      const risks = getRiskStats(visitsInDesa);
      return {
        name: desa.replace('Desa ', '').replace('Kelurahan ', ''),
        total: visitsInDesa.length,
        hipertensi: risks.hipertensi,
        diabetes: risks.hiperglikemia,
        obesitas: risks.obesitas,
        paru: risks.paru,
        mental: risks.mental,
        indera: risks.indera
      };
    });

    const search = normalizeText(schoolSearch);
    const schools = schoolList.filter((school) => {
      if (!search) return true;
      return [school.name, school.level, school.desa, school.address].some((value) => normalizeText(value).includes(search));
    }).map((school) => {
      const matchedVisits = filteredVisits.filter((visit) => visitMatchesSchool(visit, school));
      const desaVisits = filteredVisits.filter((visit) => getDesa(visit) === school.desa && getCluster(visit) === 'Anak/Siswa');
      return {
        ...school,
        screened: matchedVisits.length,
        desaStudentScreened: desaVisits.length,
        status: matchedVisits.length > 0 ? 'Terdeteksi di data' : desaVisits.length > 0 ? 'Perlu verifikasi sekolah' : 'Perlu follow-up',
        patients: matchedVisits
      };
    });

    return {
      byDusun,
      byDesa,
      ageGroups,
      schools,
      priorityDusun: byDusun.filter((item) => item.gap > 0 || item.risikoTotal > 0).slice(0, 8)
    };
  }, [filteredVisits, schoolSearch, schoolList, currentDateMs]);

  const filteredStaff = useMemo(() => {
    const search = normalizeText(staffSearch);
    return staffList.filter((staff) => {
      const matchPos = staffPosFilter === 'Semua' || staff.pos === staffPosFilter;
      const matchStatus = staffStatusFilter === 'Semua' || staff.status === staffStatusFilter || (staffStatusFilter === 'MAGANG' && staff.status === 'KONSULTAN IT');
      const matchSearch =
        !search ||
        normalizeText(staff.nama).includes(search) ||
        normalizeText(staff.username).includes(search) ||
        normalizeText(Array.isArray(staff.role) ? staff.role.join(' ') : staff.role).includes(search) ||
        normalizeText(staff.status_detail || '').includes(search);
      return matchPos && matchStatus && matchSearch;
    });
  }, [staffList, staffPosFilter, staffStatusFilter, staffSearch]);

  const filteredLogs = useMemo(() => {
    const search = normalizeText(logSearch);
    if (!search) return activityLogs;
    return activityLogs.filter((log) =>
      [log.nama, log.user, log.aksi, log.modul].some((value) => normalizeText(value).includes(search))
    );
  }, [activityLogs, logSearch]);



  const cleanDuplicates = async () => {
    if (!window.confirm('Bersihkan data ganda? (Total db: ' + schoolList.length + ')')) return;
    try {
      const deletedCount = await removeDuplicateSchools();
      alert(`Berhasil membersihkan ${deletedCount} data ganda!`);
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  
    
  const openSchoolForm = (school = null) => {
    setEditSchool(
      school || { name: '', level: 'SD', desa: 'Desa Malimpung', address: '', npsn: '-', source: 'Admin Input' }
    );
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (e) => {
    e.preventDefault();
    try {
      const schoolName = editSchool.name;
      if (editSchool.id) {
        await saveSchool(editSchool);
        await logActivity(`Edit Sekolah: ${schoolName}`, 'Admin Dashboard');
      } else {
        await saveSchool(editSchool);
        await logActivity(`Tambah Sekolah: ${schoolName}`, 'Admin Dashboard');
      }
      setIsSchoolModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data sekolah.');
    }
  };

  const handleDeleteSchool = async (schoolId) => {
    if (!window.confirm('Yakin ingin menghapus data sekolah ini secara permanen?')) return;
    try {
      await deleteSchool(schoolId);
      await logActivity('Hapus Sekolah', 'Admin Dashboard');
      setIsSchoolModalOpen(false);
      setEditSchool(null);
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus data sekolah.');
    }
  };

  const openStaffForm = (staff = null) => {
    setEditStaff(
      staff
        ? { ...staff, role: Array.isArray(staff.role) ? staff.role : [staff.role].filter(Boolean), permissions: staff.permissions || {} }
        : { nama: '', status: 'ASN', pos: 'BELUM DITUGASKAN', role: ['petugas'], permissions: {}, username: '', pin: '123456' }
    );
    setIsStaffModalOpen(true);
  };

  const openActiveUserProfile = () => {
const activeUsername = normalizeText(user?.username);
  const activeName = normalizeText(user?.nama);
    const activeStaff = staffList.find((staff) =>
      (activeUsername && normalizeText(staff.username) === activeUsername) ||
      (activeName && normalizeText(staff.nama) === activeName)
    );

    setIsProfileOpen(false);
    setActiveMenu('simpeg');
    setSimpegTab('staff');

    if (activeStaff) {
      openStaffForm(activeStaff);
    } else {
      alert('Profil pengguna aktif belum ditemukan di data staff.');
    }
  };

  const toggleSidebarGroup = (key) => {
    setSidebarGroupsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdminNav = (menuId, options = {}) => {
    if (options.simpegTab) setSimpegTab(options.simpegTab);
    if (options.filters) setFilters((prev) => ({ ...prev, ...options.filters }));
    setActiveMenu(menuId);
    setSidebarOpen(false);
  };



  
  const handlePermissionToggle = (permKey, action, fallbackValue) => {
    setEditStaff((prev) => {
      const currentPerms = prev.permissions || {};
      const rowPerm = currentPerms[permKey] || {};
      const currentValue = rowPerm[action] !== undefined ? rowPerm[action] : fallbackValue;
      
      return {
        ...prev,
        permissions: {
          ...currentPerms,
          [permKey]: {
            ...rowPerm,
            [action]: !currentValue
          }
        }
      };
    });
  };

  const handleRoleToggle = (roleId) => {
    setEditStaff((prev) => {
      const current = prev.role || [];
      return {
        ...prev,
        role: current.includes(roleId) ? current.filter((item) => item !== roleId) : [...current, roleId]
      };
    });
  };

  const handleSaveStaff = async (event) => {
    event.preventDefault();
    if (!editStaff.role || editStaff.role.length === 0) return alert('Pilih minimal 1 hak akses.');
    const username = String(editStaff.username || '').toLowerCase().replace(/\s/g, '');
    const duplicate = staffList.some((staff) => staff.username === username && staff.id !== editStaff.id);
    if (duplicate) return alert('Username tersebut sudah digunakan pegawai lain.');

    try {
      const payload = { ...editStaff, username };
      if (payload.id) {
        await saveStaff(payload);
        const syncResult = await syncUserProfileFromStaff(payload);
        await logActivity(`Mengubah data profil/hak akses pegawai: ${payload.nama}`, 'Admin Dashboard');
        if (!syncResult.synced && syncResult.reason === 'user-profile-not-found') {
          alert('Data staff tersimpan. Profil Firebase Auth belum ditemukan; jalankan migrasi Auth agar hak akses produksi ikut tersinkron.');
        }
      } else {
        await saveStaff(payload);
        await logActivity(`Menambahkan pegawai baru: ${payload.nama}`, 'Admin Dashboard');
        alert('Data staff tersimpan. Buat akun Firebase Auth atau jalankan migrasi Auth agar pegawai bisa login di mode produksi.');
      }
      setIsStaffModalOpen(false);
    } catch (error) {
      alert(`Gagal menyimpan data: ${error.message}`);
    }
  };

  const handleToggleStaffActive = async (staff) => {
    const actionText = staff.isActive ? 'menonaktifkan' : 'mengaktifkan';
    if (!window.confirm(`Yakin ingin ${actionText} akun ${staff.nama}?`)) return;
    try {
      const newStatus = await toggleStaffActive(staff);
      const syncResult = await syncUserProfileFromStaff({ ...staff, isActive: newStatus });
      await logActivity(`Mengubah status akun ${staff.nama} menjadi ${newStatus ? 'Aktif' : 'Non-Aktif'}`, 'Admin Dashboard');
      if (!syncResult.synced && syncResult.reason === 'user-profile-not-found') {
        alert('Status staff tersimpan. Profil Firebase Auth belum ditemukan; jalankan migrasi Auth agar status produksi ikut tersinkron.');
      }
    } catch (error) {
      alert(`Gagal mengubah status: ${error.message}`);
    }
  };

  const handleResetPIN = async (staff) => {
    if (!window.confirm(`Reset PIN legacy ${staff.nama} menjadi 123456? Untuk akun Firebase Auth, reset password tetap dilakukan dari Firebase Console.`)) return;
    try {
      await resetStaffPin(staff.id);
      await logActivity(`Mereset PIN pegawai: ${staff.nama}`, 'Admin Dashboard');
      alert('PIN legacy berhasil direset menjadi 123456. Jika login produksi memakai Firebase Auth, reset password akun Auth dari Firebase Console.');
    } catch (error) {
      alert(`Gagal mereset PIN: ${error.message}`);
    }
  };

  const handleBackup = async (collectionName) => {
    setBackupLoading(collectionName);
    try {
      const data = await fetchCollectionBackup(collectionName);
      if (data.length === 0) {
        alert(`Tabel ${collectionName} kosong.`);
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Backup_${collectionName.toUpperCase()}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      await logActivity(`Mengunduh backup tabel ${collectionName}`, 'Admin Dashboard');
    } catch (error) {
      alert(`Gagal backup: ${error.message}`);
    } finally {
      setBackupLoading(null);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const completedVisits = filteredVisits.filter(isCompleted);

  const handleOpenIntegratedReport = async (visits, context = 'terfilter') => {
    openIntegratedHtmlReport(visits, filters);
    await logActivity(`Membuka laporan HTML terpadu ${context} (${visits.length} data)`, 'Admin Dashboard');
  };

  const handleExportPkgExcel = async (visits, context = 'terfilter') => {
    await exportToPKGExcel(visits);
    await logActivity(`Export PKG Excel ${context} (${visits.length} data)`, 'Admin Dashboard');
  };

  const handleExportPkgPdf = async (visits, context = 'terfilter') => {
    await exportToPKG_PDF(visits);
    await logActivity(`Export PKG PDF ${context} (${visits.length} data)`, 'Admin Dashboard');
  };

  const handleExportClusterExcel = async (visits, cluster, context = 'terfilter') => {
    await exportClusterExcel(visits, cluster);
    await logActivity(`Export Excel klaster ${cluster} ${context} (${visits.length} data)`, 'Admin Dashboard');
  };

  const handleExportClusterPdf = async (visits, cluster, context = 'terfilter') => {
    await exportClusterPDF(visits, cluster);
    await logActivity(`Export PDF klaster ${cluster} ${context} (${visits.length} data)`, 'Admin Dashboard');
  };

  const sidebarItemClass = (isActive, isDisabled = false) =>
    `flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] font-semibold transition ${
      isDisabled
        ? 'cursor-not-allowed text-slate-300'
        : isActive
          ? 'bg-cyan-50 text-teal-700'
          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
    }`;

  const sidebarSubItemClass = (isActive, isDisabled = false) =>
    `block w-full rounded-md px-8 py-1.5 text-left text-[11px] font-semibold transition ${
      isDisabled
        ? 'cursor-not-allowed text-slate-300'
        : isActive
          ? 'bg-cyan-50 text-teal-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
    }`;

  const renderSidebarGroup = (groupKey, icon, title, children) => (
    <div className="py-1">
      <button
        type="button"
        onClick={() => toggleSidebarGroup(groupKey)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-black text-slate-900 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <span className="w-4 text-center text-slate-700">{icon}</span>
          {title}
        </span>
        <span className="text-xs text-slate-500">{sidebarGroupsOpen[groupKey] ? '^' : '⌄'}</span>
      </button>
      {sidebarGroupsOpen[groupKey] && <div className="space-y-0.5 pb-1">{children}</div>}
    </div>
  );

  const renderAdminNavItem = ({ id, label, icon, simpegTab: targetSimpegTab, filters: targetFilters, indent = false, disabled = false }) => (
    <button
      key={`${id}-${targetSimpegTab || label}`}
      type="button"
      disabled={disabled}
      onClick={() => !disabled && handleAdminNav(id, { simpegTab: targetSimpegTab, filters: targetFilters })}
      className={indent ? sidebarSubItemClass(activeMenu === id && (!targetSimpegTab || simpegTab === targetSimpegTab), disabled) : sidebarItemClass(activeMenu === id && (!targetSimpegTab || simpegTab === targetSimpegTab), disabled)}
    >
      <span className="flex items-center gap-2">
         {icon && <span className="w-4 text-center text-slate-700">{icon}</span>}
         {label}
      </span>
    </button>
  );


  return (
    <div className="admin-shell fixed inset-0 z-[70] bg-white text-slate-950 font-sans overflow-y-auto">
      <div className="fixed right-3 top-3 z-[80] hidden md:block">
        <ConnectionStatus />
      </div>
            {sidebarOpen && (
        <div className="fixed inset-0 z-[15] bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-slate-200 bg-white shadow-[8px_0_24px_rgba(15,23,42,0.07)] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 flex' : '-translate-x-full hidden lg:flex'} lg:translate-x-0`}>
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <img src={LOGO_PINRANG} alt="Pinrang" className="h-8 w-auto drop-shadow-sm" />
              <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-8 w-auto drop-shadow-sm" />
            </div>
            <div className="mt-2">
              <p className="text-lg font-black leading-none tracking-tight text-teal-700">TERSANJUNG</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Admin CKG Malimpung</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="border-t border-slate-200 py-3">
            {renderSidebarGroup('analitik', <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>, 'Analitik CKG', [
              renderAdminNavItem({ id: 'wilayah', label: 'Pemetaan & Demografi', indent: true })
            ])}

            {renderSidebarGroup('umum', <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>, 'CKG Umum', [
              renderAdminNavItem({ id: 'pendaftaran', label: 'Dashboard Pendaftaran', indent: true }),
              renderAdminNavItem({ id: 'kehadiran', label: 'Dashboard Kehadiran', indent: true }),
              renderAdminNavItem({ id: 'laporan', label: 'Laporan CKG', indent: true })
            ])}

            {renderSidebarGroup('sarana', <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>, 'Sarana Puskesmas', [
              renderAdminNavItem({ id: 'simpeg', label: 'Manajemen Nakes', simpegTab: 'staff' }),
              renderAdminNavItem({ id: 'sekolah', label: 'Sarana Binaan' }),
              renderAdminNavItem({ id: 'simpeg', label: 'Backup Database', simpegTab: 'backup' })
            ])}


            <div className="mt-2 space-y-1 border-t border-slate-200 pt-3">
              <button type="button" onClick={openActiveUserProfile} className={sidebarItemClass(false)}>
                <span className="flex items-center gap-2">
                   <span className="w-4 text-center text-slate-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                   </span>
                   Ganti Password
                </span>
              </button>
              {renderAdminNavItem({ id: 'privasi', label: 'Ketentuan umum dan Kebijakan privasi', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.963 11.963 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> })}
              {renderAdminNavItem({ id: 'bantuan', label: 'Pusat Bantuan', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> })}
            </div>
          </div>
        </div>
        <div className="mt-auto border-t border-slate-200 p-4 bg-white space-y-1">
          <button type="button" onClick={() => safeBack(navigate, '/dashboard')} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-colors block">
            <span className="flex items-center gap-2">← Kembali ke Beranda</span>
          </button>
          <button type="button" onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors block">
            <span className="flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
               Keluar Sistem
            </span>
          </button>
        </div>
      </aside>

      <main className="admin-main flex min-h-screen flex-col bg-slate-50 lg:pl-64">
        {/* Header mobile & title */}
        <header className="admin-topbar sticky top-0 z-50 flex min-h-[5rem] items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm lg:px-8 transition-all">
          <div className="flex items-center gap-4 py-2">
            <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <button type="button" onClick={() => safeBack(navigate, '/dashboard')} className="lg:hidden min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 shadow-sm">
              Kembali
            </button>
            
            {/* Dynamic Title Moved to Header */}
            <div className="admin-title-block flex flex-col justify-center animate-in fade-in slide-in-from-left-4 duration-500">
               <h1 className={`text-xl md:text-2xl font-black leading-tight tracking-tight ${headerInfo?.color || 'text-slate-900'}`}>
                  {headerInfo?.title || 'Master Command Center'}
               </h1>
               <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-0.5">
                  {headerInfo?.subtitle || 'Dashboard Eksekutif TERSANJUNG'}
               </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 relative">
             {/* Notification Bell */}
             <div className="relative">
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all relative group">
                   <svg className="w-5 h-5 group-hover:animate-swing" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                   {hasNewNotif && (
                   <span className="absolute top-2 right-2.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                   </span>
                   )}
                </button>
                
                {isNotifOpen && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                   <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                         <h3 className="font-black text-slate-800 text-sm">Log Aktivitas Sistem</h3>
                         <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Live</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                         <div className="p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer flex gap-3 border-b border-slate-50">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">📝</div>
                            <div>
                               <p className="text-xs font-bold text-slate-700">Data kunjungan baru sinkronisasi</p>
                               <p className="text-[10px] text-slate-400 mt-0.5">2 menit yang lalu</p>
                            </div>
                         </div>
                         <div className="p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer flex gap-3 border-b border-slate-50">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">⚠️</div>
                            <div>
                               <p className="text-xs font-bold text-slate-700">Peringatan: 5 Pasien Hipertensi baru terdeteksi</p>
                               <p className="text-[10px] text-slate-400 mt-0.5">15 menit yang lalu</p>
                            </div>
                         </div>
                      </div>
                      <div onClick={() => { setHasNewNotif(false); setIsNotifOpen(false); setActiveMenu('log'); }} className="p-3 bg-slate-50 text-center border-t border-slate-100 cursor-pointer hover:bg-slate-100 transition">
                         <span className="text-xs font-bold text-teal-600">Lihat Semua Aktivitas</span>
                      </div>
                   </div>
                   </>
                )}
             </div>

             {/* User Profile */}
             <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all focus:outline-none">
                   <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-black shadow-sm text-sm border-2 border-white">
                      {userName.charAt(0).toUpperCase()}
                   </div>
                   <div className="hidden md:flex flex-col items-start text-left">
                      <span className="text-sm font-black text-slate-800 leading-none max-w-[150px] truncate">{userName}</span>
                      <span className="text-[10px] font-bold text-slate-500 mt-1">Puskesmas Malimpung</span>
                   </div>
                   <svg className="w-4 h-4 text-slate-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {isProfileOpen && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                   <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2">
                      <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center text-center">
                         <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-black shadow-md text-xl border-2 border-white mb-2">
                            {userName.charAt(0).toUpperCase()}
                         </div>
                         <span className="text-sm font-black text-slate-800">{userName}</span>
                         <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full mt-1">Administrator CKG</span>
                      </div>
                      <div className="p-2">
                         <button onClick={openActiveUserProfile} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            Profil dan izin akses
                          </button>
                         <button onClick={() => { setActiveMenu('simpeg'); setSimpegTab('roles'); setIsProfileOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Pengaturan Sistem
                         </button>
                      </div>
                      <div className="p-2 border-t border-slate-100">
                         <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            Keluar Sistem
                         </button>
                      </div>
                   </div>
                   </>
                )}
             </div>
          </div>
        </header>

        <div className="admin-content flex-1 p-4 lg:p-8">
          
          {/* Global Filter Bar */}
          {['pendaftaran', 'kehadiran', 'laporan', 'wilayah'].includes(activeMenu) && (
             <div className={`admin-filter-panel mb-8 border-b border-slate-200 pb-6 animate-in slide-in-from-top-4 ${isGlobalFilterOpen ? 'is-open' : ''}`}>
             <div className="admin-filter-summary">
                <div>
                  <p className="admin-filter-eyebrow">Filter Data</p>
                  <p className="admin-filter-text">{filterSummary}</p>
                </div>
                <button type="button" onClick={() => setIsGlobalFilterOpen((value) => !value)} className="admin-filter-toggle">
                  {isGlobalFilterOpen ? 'Tutup' : 'Ubah'}
                </button>
             </div>
             <div className="admin-filter-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Tahun</label>
                   <select value={filters.tahun} onChange={e => setFilters({...filters, tahun: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      {['2026', '2025', '2024'].map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Bulan</label>
                   <select value={filters.bulan} onChange={e => setFilters({...filters, bulan: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Provinsi</label>
                   <select disabled className="border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <option>Sulawesi Selatan</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Kabupaten/Kota</label>
                   <select disabled className="border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <option>Kab. Pinrang</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Kecamatan</label>
                   <select disabled className="border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <option>Patampanua</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Puskesmas</label>
                   <select disabled className="border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <option>MALIMPUNG</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Jenjang Pendidikan</label>
                   <select value={filters.jenjang} onChange={e => setFilters({...filters, jenjang: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      <option value="SD/MI/Sederajat">SD/MI/Sederajat</option>
                      <option value="SMP/MTs/Sederajat">SMP/MTs/Sederajat</option>
                      <option value="SMA/MA/Sederajat">SMA/MA/Sederajat</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Sekolah</label>
                   <select value={filters.sekolah} onChange={e => setFilters({...filters, sekolah: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      {/* Dynamic schools will be populated, for now statically show option to select */}
                      {[...new Set(enrichedVisits.map(v => v.pos1?.sekolah).filter(Boolean))].map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                   </select>
                </div>
             </div>
             
             <div className="admin-filter-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Kelas</label>
                   <select value={filters.kelas} onChange={e => setFilters({...filters, kelas: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      {['1','2','3','4','5','6','7','8','9','10','11','12'].map(k => <option key={k} value={`Kelas ${k}`}>Kelas {k}</option>)}
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Usia</label>
                   <select value={filters.usia} onChange={e => setFilters({...filters, usia: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      <option value="0 - 28 Hari">0 - 28 Hari</option>
                      <option value="1 - 4 Bulan">1 - 4 Bulan</option>
                      <option value="5 - 11 Bulan">5 - 11 Bulan</option>
                      {[...Array(20).keys()].map(i => <option key={i+1} value={`${i+1} Tahun`}>{i+1} Tahun</option>)}
                      <option value="Lansia">Lebih dari 20 Tahun</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <button onClick={() => setFilters({tahun:'Semua',bulan:'Semua',jenjang:'Semua',sekolah:'Semua',kelas:'Semua',usia:'Semua'})} className="admin-reset-filter bg-[#00b8ac] hover:bg-[#009c91] text-white text-xs font-bold py-2.5 rounded-lg border-none shadow-sm transition h-[38px]">
                      Reset Filter
                   </button>
                </div>
             </div>
          </div>
          )}
          {activeMenu === 'laporan' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                  
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                          <span className="text-5xl mb-4">📄</span>
                          <h3 className="text-lg font-black text-slate-900 mb-2">Laporan HTML Terpadu</h3>
                          <p className="text-xs text-slate-500 mb-6 px-4">Laporan dinamis sesuai filter aktif: ringkasan eksekutif, capaian, tren, risiko, wilayah prioritas, dan rekomendasi tindak lanjut.</p>
                          <button onClick={() => handleOpenIntegratedReport(filteredVisits, 'filter aktif')} className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all">Buka Laporan Digital</button>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl shadow-md border border-emerald-400 p-6 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 opacity-10 text-8xl -mt-6 -mr-4 transform rotate-12">📊</div>
                          <span className="text-5xl mb-4 relative z-10">📥</span>
                          <h3 className="text-lg font-black text-white mb-2 relative z-10">Ekspor Data Raw (Excel)</h3>
                          <p className="text-xs text-emerald-100 mb-6 px-4 relative z-10">Unduh master data tabel kunjungan dalam format MS Excel yang sesuai dengan format pelaporan SIMPUS.</p>
                          <button onClick={() => handleExportPkgExcel(filteredVisits, 'filter aktif')} className="w-full sm:w-auto bg-white text-teal-700 hover:bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all relative z-10 flex items-center gap-2 justify-center">
                              <span className="text-lg">📊</span> Unduh Kolektif Excel
                          </button>
                          <button onClick={() => handleExportPkgPdf(filteredVisits, 'filter aktif')} className="mt-3 w-full sm:w-auto bg-white text-red-700 hover:bg-red-50 border border-red-100 px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all relative z-10 flex items-center gap-2 justify-center">
                              <span className="text-lg">PDF</span> Unduh Kolektif PDF
                          </button>
                      </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-4">
                      <h4 className="font-black text-slate-800 mb-4 uppercase tracking-widest text-xs">Unduh Berdasarkan Klaster</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {['Balita', 'Anak/Siswa', 'Dewasa', 'Lansia'].map(k => (
                              <div key={k} className="flex flex-col items-center gap-2 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                  <span className="text-2xl group-hover:scale-110 transition-transform">{k === 'Balita' ? '🍼' : k === 'Anak/Siswa' ? '🎒' : k === 'Dewasa' ? '💼' : '🧓'}</span>
                                  <span className="font-bold text-slate-700 text-xs">{k}</span>
                                  <button onClick={() => handleExportClusterExcel(filteredVisits, k, 'filter aktif')} className="w-full rounded-lg bg-white px-3 py-2 text-[10px] font-black text-teal-700 ring-1 ring-teal-100 hover:bg-teal-50">Excel</button>
                                  <button onClick={() => handleExportClusterPdf(filteredVisits, k, 'filter aktif')} className="w-full rounded-lg bg-white px-3 py-2 text-[10px] font-black text-red-700 ring-1 ring-red-100 hover:bg-red-50">PDF</button>
                              </div>
                          ))}
                      </div>
                  </div>
              </section>
          )}

          
          {activeMenu === 'pendaftaran' && (() => {
        // Data calculations specific to Dashboard Pendaftaran
        const totalUmum = filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa').length;
        const totalSekolah = filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa').length;
        
        // Tren Harian (Umum vs Sekolah)
        const trendMap = new Map();
        filteredVisits.forEach(v => {
            const date = dateKey(v._date);
            if (!trendMap.has(date)) trendMap.set(date, { tanggal: date, Umum: 0, Sekolah: 0 });
            if (getCluster(v) === 'Anak/Siswa') trendMap.get(date).Sekolah++;
            else trendMap.get(date).Umum++;
        });
        const trenPendaftar = Array.from(trendMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-30); // Last 30 days
        
        // Klaster Usia
        const bayi = filteredVisits.filter(v => getCluster(v) === 'Bayi/Balita').length;
        const anakSekolah = totalSekolah;
        const dewasa = filteredVisits.filter(v => getCluster(v) === 'Dewasa').length;
        const lansia = filteredVisits.filter(v => getCluster(v) === 'Lansia').length;
        const totalSemua = analytics.total || 1; // Prevent div by zero

        // Klaster Pendidikan
        const sd = filteredVisits.filter(v => ['1','2','3','4','5','6'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const smp = filteredVisits.filter(v => ['7','8','9'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const sma = filteredVisits.filter(v => ['10','11','12'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const totalSiswa = Math.max(sd + smp + sma, 1);

        return (
            <section className="space-y-8 animate-in fade-in duration-500 bg-slate-50 p-2 sm:p-6 rounded-2xl">
                <div className="mb-2 flex flex-col border-b border-slate-200 pb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pemantauan Pendaftaran CKG</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Rangkuman demografi, rasio, dan tren pendaftar.</p>
                </div>

                {/* Baris 1: Total & Tren */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                      <div>
                         <h3 className="text-sm font-bold text-slate-800">Total Pendaftar</h3>
                         <p className="text-4xl font-black text-slate-950 mt-1">{formatNumber(analytics.total)} <span className="text-sm font-semibold text-slate-500">Orang</span></p>
                      </div>
                      <div className="h-64 mt-4 relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={[{ name: 'Laki-Laki', value: analytics.laki }, { name: 'Perempuan', value: analytics.perempuan }]} cx="50%" cy="50%" innerRadius={0} outerRadius={90} dataKey="value">
                                  <Cell fill="#3b82f6" />
                                  <Cell fill="#f43f5e" />
                               </Pie>
                               <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-black text-xs pointer-events-none drop-shadow-md flex justify-between w-32 px-4">
                            <span className={analytics.laki === 0 ? 'hidden' : ''}>{((analytics.laki/totalSemua)*100).toFixed(1)}%</span>
                            <span className={analytics.perempuan === 0 ? 'hidden' : ''}>{((analytics.perempuan/totalSemua)*100).toFixed(1)}%</span>
                         </div>
                      </div>
                   </div>

                   <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Tren Pendaftar Harian (Umum vs Sekolah)</h3>
                      <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trenPendaftar}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(5)} />
                               <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                               <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                               <Bar dataKey="Umum" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} barSize={16} />
                               <Bar dataKey="Sekolah" stackId="a" fill="#eab308" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                {/* Baris 2: Klaster Usia & Sekolah */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                      {/* Pendaftar Berdasarkan Klaster Usia */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Pendaftar berdasarkan klaster usia</h3>
                         
                         {/* CSS Stacked Bar */}
                         <div className="w-full h-6 rounded-full overflow-hidden flex mb-6 shadow-inner border border-slate-100">
                            <div style={{ width: `${(bayi/totalSemua)*100}%` }} className="bg-pink-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(anakSekolah/totalSemua)*100}%` }} className="bg-amber-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(dewasa/totalSemua)*100}%` }} className="bg-sky-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(lansia/totalSemua)*100}%` }} className="bg-purple-500 h-full transition-all duration-500"></div>
                         </div>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-400"></span>Bayi/Balita</span><span className="font-black text-slate-900">{formatNumber(bayi)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400"></span>Anak/Siswa</span><span className="font-black text-slate-900">{formatNumber(anakSekolah)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-400"></span>Dewasa</span><span className="font-black text-slate-900">{formatNumber(dewasa)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span>Lansia</span><span className="font-black text-slate-900">{formatNumber(lansia)}</span></div>
                         </div>
                      </div>

                      {/* Pendaftar Berdasarkan Klaster Sekolah */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Pendaftar berdasarkan jenjang sekolah</h3>
                         
                         <div className="w-full h-6 rounded-full overflow-hidden flex mb-6 shadow-inner border border-slate-100">
                            <div style={{ width: `${(sd/totalSiswa)*100}%` }} className="bg-rose-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(smp/totalSiswa)*100}%` }} className="bg-teal-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(sma/totalSiswa)*100}%` }} className="bg-blue-500 h-full transition-all duration-500"></div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-semibold text-slate-600">
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SD/MI/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(sd)} ({(sd/totalSiswa*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['1','2','3','4','5','6'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-400"></span>SD Kelas {k}</span> <span className="font-bold text-slate-800">{filteredVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SMP/MTs/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(smp)} ({(smp/totalSiswa*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['7','8','9'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-400"></span>SMP Kelas {k}</span> <span className="font-bold text-slate-800">{filteredVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SMA/MA/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(sma)} ({(sma/totalSiswa*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['10','11','12'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>SMA Kelas {k}</span> <span className="font-bold text-slate-800">{filteredVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Total Pemeriksaan Khusus (Panel Kanan) */}
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Total Pemeriksaan Khusus</h3>
                      
                      <div className="mb-8">
                         <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG UMUM</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{formatNumber(totalUmum)} <span className="text-xs font-semibold text-slate-500 tracking-normal">Orang</span></p>
                         <p className="text-[10px] text-slate-400 mb-4">Pendaftar berdasarkan skrining (seluruh periode)</p>
                         
                         <div className="space-y-3">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Hipertensi & Diabetes</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(analytics.risks?.hipertensi + analytics.risks?.hiperglikemia || 0)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Obesitas (IMT)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(analytics.risks?.obesitas || 0)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Kanker Paru / TB / PPOK</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(analytics.risks?.paru || 0)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Fungsi Indera & Keswa</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber((analytics.risks?.indera || 0) + (analytics.risks?.mental || 0))}</span>
                            </div>
                         </div>
                      </div>

                      <div>
                         <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG SEKOLAH</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{formatNumber(totalSekolah)} <span className="text-xs font-semibold text-slate-500 tracking-normal">Orang</span></p>
                         <p className="text-[10px] text-slate-400 mb-4">Pendaftar berdasarkan skrining (seluruh periode)</p>
                         
                         <div className="space-y-3">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Fisik Dasar Siswa</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(totalSekolah)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Ketajaman Indera Siswa</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos3?.mata).length)}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Tabel Agregat Umum */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Umum</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pendaftaran Cek Kesehatan Gratis Umum</p>
                   </div>
                   <button 
                      onClick={() => {
                         const getL = (cond) => filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Laki-Laki' && cond(v)).length;
                         const getP = (cond) => filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Perempuan' && cond(v)).length;
                         
                         const cBayi = v => getCluster(v) === 'Bayi/Balita';
                         const cAnak = v => v.pos1?.kategoriUmur === 'Usia sekolah 7-12 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 13-15 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 16 s.d <18 tahun';
                         const cDewasa = v => getCluster(v) === 'Dewasa';
                         const cLansia = v => getCluster(v) === 'Lansia';

                         const data = [{
                            Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                            'Total Pendaftar': totalUmum, 
                            'Total Bayi': bayi, 'Bayi Perempuan': getP(cBayi), 'Bayi Laki-Laki': getL(cBayi),
                            'Total Anak': getP(cAnak) + getL(cAnak), 'Anak Perempuan': getP(cAnak), 'Anak Laki-Laki': getL(cAnak),
                            'Total Dewasa': dewasa, 'Dewasa Perempuan': getP(cDewasa), 'Dewasa Laki-Laki': getL(cDewasa),
                            'Total Lansia': lansia, 'Lansia Perempuan': getP(cLansia), 'Lansia Laki-Laki': getL(cLansia)
                         }];
                         exportJsonToExcel(data, "Agregat Umum", "Tabel_Agregat_Umum.xlsx");
                      }}
                      className="bg-[#16b3ac] hover:bg-[#11928c] text-white text-[13px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition border-none"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4">
                      {(() => {
                         const getL = (cond) => filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Laki-Laki' && cond(v)).length;
                         const getP = (cond) => filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Perempuan' && cond(v)).length;
                         
                         const cBayi = v => getCluster(v) === 'Bayi/Balita';
                         const cAnak = v => v.pos1?.kategoriUmur === 'Usia sekolah 7-12 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 13-15 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 16 s.d <18 tahun';
                          return (
                         <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                               <tr className="bg-[#f3f4f6] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-y border-[#e5e7eb]">
                                  <th className="px-4 py-3 font-semibold">Provinsi</th>
                                  <th className="px-4 py-3 font-semibold">Kabko</th>
                                  <th className="px-4 py-3 font-semibold">Kecamatan</th>
                                  <th className="px-4 py-3 font-semibold">Puskesmas</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Pendaftar</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Bayi</th>
                                  <th className="px-4 py-3 font-semibold text-center">Bayi Perempuan</th>
                                  <th className="px-4 py-3 font-semibold text-center">Bayi Laki - Laki</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Anak</th>
                                  <th className="px-4 py-3 font-semibold text-center">Anak Perempuan</th>
                                  <th className="px-4 py-3 font-semibold text-center">Anak Laki - Laki</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Dewasa</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Lansia</th>
                               </tr>
                            </thead>
                            <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                               <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3">Sulawesi Selatan</td>
                                  <td className="px-4 py-3">Kab. Pinrang</td>
                                  <td className="px-4 py-3">Patampanua</td>
                                  <td className="px-4 py-3 uppercase">MALIMPUNG</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(totalUmum)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(bayi)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getP(cBayi))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getL(cBayi))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getP(cAnak) + getL(cAnak))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getP(cAnak))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getL(cAnak))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(dewasa)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(lansia)}</td>
                               </tr>
                            </tbody>
                         </table>
                         );
                      })()}
                   </div>
                </div>

                {/* Tabel Agregat Sekolah */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Sekolah</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pendaftaran Cek Kesehatan Gratis Sekolah</p>
                   </div>
                   <button 
                      onClick={() => {
                         const data = [];
                         const allSekolah = [...new Set(filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa').map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                         
                         allSekolah.forEach(namaSekolah => {
                            ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                               const visits = filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                               const count = visits.length;
                               if(count > 0) {
                                  let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                                  const selesaiCount = visits.filter(v => v.pos6).length;
                                  data.push({
                                     Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                                     'Jenjang Pendidikan': jenjang,
                                     'Nama Sekolah': namaSekolah,
                                     Kelas: 'Kelas ' + k,
                                     'Total Pendaftar': count,
                                     'Sudah Melengkapi Skrining Mandiri': selesaiCount,
                                     'Perlu Skrining Mandiri': count - selesaiCount,
                                     'Jumlah Peserta': count
                                  });
                               }
                            });
                         });
                         
                         exportJsonToExcel(data, "Agregat Sekolah", "Tabel_Agregat_Sekolah.xlsx");
                      }}
                      className="bg-[#16b3ac] hover:bg-[#11928c] text-white text-[13px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition border-none"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                         <thead>
                            <tr className="bg-[#f3f4f6] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-y border-[#e5e7eb]">
                               <th className="px-4 py-3 font-semibold">Provinsi</th>
                               <th className="px-4 py-3 font-semibold">Kobko</th>
                               <th className="px-4 py-3 font-semibold">Kecamatan</th>
                               <th className="px-4 py-3 font-semibold">Puskesmas</th>
                               <th className="px-4 py-3 font-semibold">Jenjang Pendidikan</th>
                               <th className="px-4 py-3 font-semibold">Nama Sekolah</th>
                               <th className="px-4 py-3 font-semibold text-center">Kelas</th>
                               <th className="px-4 py-3 font-semibold text-center">Total Pendaftar</th>
                               <th className="px-4 py-3 font-semibold text-center">Sudah Melengkapi Skrining Mandiri</th>
                               <th className="px-4 py-3 font-semibold text-center">Perlu Skrining Mandiri</th>
                               <th className="px-4 py-3 font-semibold text-center">Jumlah Peserta</th>
                            </tr>
                         </thead>
                         <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                            {(() => {
                               const rows = [];
                               const allSekolah = [...new Set(filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa').map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                               
                               allSekolah.forEach(namaSekolah => {
                                  ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                                     const visits = filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                                     const count = visits.length;
                                     if(count > 0) {
                                        let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                                        const selesaiCount = visits.filter(v => v.pos6).length;
                                        rows.push(
                                           <tr key={`${namaSekolah}-${k}`} className="hover:bg-slate-50 transition-colors">
                                              <td className="px-4 py-3">Sulawesi Selatan</td>
                                              <td className="px-4 py-3">Kab. Pinrang</td>
                                              <td className="px-4 py-3">Patampanua</td>
                                              <td className="px-4 py-3 uppercase">MALIMPUNG</td>
                                              <td className="px-4 py-3">{jenjang}</td>
                                              <td className="px-4 py-3">{namaSekolah}</td>
                                              <td className="px-4 py-3 text-center">Kelas {k}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(count)}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(selesaiCount)}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(count - selesaiCount)}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(count)}</td>
                                           </tr>
                                        );
                                     }
                                  });
                               });
                               
                               if(rows.length === 0) {
                                   return <tr><td colSpan="11" className="px-4 py-8 text-center text-slate-400">Belum ada data pendaftar sekolah.</td></tr>;
                               }
                               return rows;
                            })()}
                         </tbody>
                      </table>
                   </div>
                </div>
            </section>
        );
    })()}
          
{activeMenu === 'kehadiran' && (() => {
        // Data calculations specific to Dashboard Kehadiran
        const hadirVisits = filteredVisits.filter(v => isAttended(v));
        const totalHadir = hadirVisits.length;
        const totalSelesai = hadirVisits.filter(v => isCompleted(v)).length;
        const totalBelumSelesai = totalHadir - totalSelesai;
        
        const hadirUmum = hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa').length;
        const hadirSekolah = hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa').length;
        
        // Tren Harian (Hadir vs Selesai)
        const trendMap = new Map();
        filteredVisits.forEach(v => {
            const date = dateKey(v._date);
            if (!trendMap.has(date)) trendMap.set(date, { tanggal: date, Hadir: 0, Selesai: 0 });
            if (isAttended(v)) trendMap.get(date).Hadir++;
            if (isCompleted(v)) trendMap.get(date).Selesai++;
        });
        const trenKehadiran = Array.from(trendMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-30);
        
        // Klaster Usia
        const bayiHadir = hadirVisits.filter(v => getCluster(v) === 'Bayi/Balita').length;
        const anakSekolahHadir = hadirSekolah;
        const dewasaHadir = hadirVisits.filter(v => getCluster(v) === 'Dewasa').length;
        const lansiaHadir = hadirVisits.filter(v => getCluster(v) === 'Lansia').length;
        const totalSemuaHadir = totalHadir || 1; 

        // Klaster Pendidikan
        const sdHadir = hadirVisits.filter(v => ['1','2','3','4','5','6'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const smpHadir = hadirVisits.filter(v => ['7','8','9'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const smaHadir = hadirVisits.filter(v => ['10','11','12'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const totalSiswaHadir = Math.max(sdHadir + smpHadir + smaHadir, 1);

        return (
            <section className="space-y-8 animate-in fade-in duration-500 bg-slate-50 p-2 sm:p-6 rounded-2xl">
                

                {/* Baris 1: Total & Tren */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                      <div>
                         <h3 className="text-sm font-bold text-slate-800">Total Kehadiran</h3>
                         <p className="text-4xl font-black text-slate-950 mt-1">{formatNumber(totalHadir)} <span className="text-sm font-semibold text-slate-500">Orang</span></p>
                         <p className="text-[10px] text-slate-400 mt-1">Dari {formatNumber(analytics.total)} Total Pendaftar</p>
                      </div>
                      <div className="h-64 mt-4 relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={[{ name: 'Selesai Layanan', value: totalSelesai }, { name: 'Belum Selesai', value: totalBelumSelesai }]} cx="50%" cy="50%" innerRadius={0} outerRadius={90} dataKey="value">
                                  <Cell fill="#10b981" />
                                  <Cell fill="#f59e0b" />
                               </Pie>
                               <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-black text-xs pointer-events-none drop-shadow-md flex justify-between w-32 px-4">
                            <span className={totalSelesai === 0 ? 'hidden' : ''}>{((totalSelesai/totalSemuaHadir)*100).toFixed(1)}%</span>
                            <span className={totalBelumSelesai === 0 ? 'hidden' : ''}>{((totalBelumSelesai/totalSemuaHadir)*100).toFixed(1)}%</span>
                         </div>
                      </div>
                   </div>

                   <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Tren Kehadiran & Penyelesaian Harian</h3>
                      <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trenKehadiran}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(5)} />
                               <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                               <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                               <Bar dataKey="Hadir" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                               <Bar dataKey="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                {/* Baris 2: Klaster Usia & Sekolah */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Kehadiran berdasarkan klaster usia</h3>
                         <div className="w-full h-6 rounded-full overflow-hidden flex mb-6 shadow-inner border border-slate-100">
                            <div style={{ width: `${(bayiHadir/totalSemuaHadir)*100}%` }} className="bg-pink-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(anakSekolahHadir/totalSemuaHadir)*100}%` }} className="bg-amber-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(dewasaHadir/totalSemuaHadir)*100}%` }} className="bg-sky-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(lansiaHadir/totalSemuaHadir)*100}%` }} className="bg-purple-500 h-full transition-all duration-500"></div>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-400"></span>Bayi/Balita</span><span className="font-black text-slate-900">{formatNumber(bayiHadir)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400"></span>Anak/Siswa</span><span className="font-black text-slate-900">{formatNumber(anakSekolahHadir)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-400"></span>Dewasa</span><span className="font-black text-slate-900">{formatNumber(dewasaHadir)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span>Lansia</span><span className="font-black text-slate-900">{formatNumber(lansiaHadir)}</span></div>
                         </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Kehadiran berdasarkan jenjang sekolah</h3>
                         <div className="w-full h-6 rounded-full overflow-hidden flex mb-6 shadow-inner border border-slate-100">
                            <div style={{ width: `${(sdHadir/totalSiswaHadir)*100}%` }} className="bg-rose-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(smpHadir/totalSiswaHadir)*100}%` }} className="bg-teal-400 h-full transition-all duration-500"></div>
                            <div style={{ width: `${(smaHadir/totalSiswaHadir)*100}%` }} className="bg-blue-500 h-full transition-all duration-500"></div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-semibold text-slate-600">
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SD/MI/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(sdHadir)} ({(sdHadir/totalSiswaHadir*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['1','2','3','4','5','6'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-400"></span>SD Kelas {k}</span> <span className="font-bold text-slate-800">{hadirVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SMP/MTs/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(smpHadir)} ({(smpHadir/totalSiswaHadir*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['7','8','9'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-400"></span>SMP Kelas {k}</span> <span className="font-bold text-slate-800">{hadirVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SMA/MA/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(smaHadir)} ({(smaHadir/totalSiswaHadir*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['10','11','12'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>SMA Kelas {k}</span> <span className="font-bold text-slate-800">{hadirVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Tingkat Penyelesaian Layanan</h3>
                      
                      <div className="mb-8">
                         <span className="px-2 py-1 bg-teal-100 text-teal-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG UMUM (HADIR)</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{formatNumber(hadirUmum)} <span className="text-xs font-semibold text-slate-500 tracking-normal">Orang</span></p>
                         
                         <div className="space-y-3 mt-4">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Pos 2 (Antropometri)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos2).length)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Pos 3 (Fisik Dasar)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos3).length)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Pos 4 (Laboratorium)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos4).length)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Pos 5 (Diagnosa Klinis)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos5).length)}</span>
                            </div>
                         </div>
                      </div>

                      <div>
                         <span className="px-2 py-1 bg-teal-100 text-teal-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG SEKOLAH (HADIR)</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{formatNumber(hadirSekolah)} <span className="text-xs font-semibold text-slate-500 tracking-normal">Orang</span></p>
                         
                         <div className="space-y-3 mt-4">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Skrining Mandiri</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos6).length)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Skrining Fisik UKS</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos3).length)}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Tabel Agregat Kehadiran Umum */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Kehadiran Umum</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pemantauan kehadiran Cek Kesehatan Gratis Umum</p>
                   </div>
                   <button 
                      onClick={() => {
                         const getL = (cond) => hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Laki-Laki' && cond(v)).length;
                         const getP = (cond) => hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Perempuan' && cond(v)).length;
                         const cBayi = v => getCluster(v) === 'Bayi/Balita';
                         const cAnak = v => v.pos1?.kategoriUmur === 'Usia sekolah 7-12 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 13-15 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 16 s.d <18 tahun';
                         const cDewasa = v => getCluster(v) === 'Dewasa';
                         const cLansia = v => getCluster(v) === 'Lansia';

                         const data = [{
                            Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                            'Total Hadir': hadirUmum, 
                            'Total Bayi Hadir': bayiHadir, 'Bayi P Hadir': getP(cBayi), 'Bayi L Hadir': getL(cBayi),
                            'Total Anak Hadir': getP(cAnak) + getL(cAnak), 'Anak P Hadir': getP(cAnak), 'Anak L Hadir': getL(cAnak),
                            'Total Dewasa Hadir': dewasaHadir, 'Dewasa P Hadir': getP(cDewasa), 'Dewasa L Hadir': getL(cDewasa),
                            'Total Lansia Hadir': lansiaHadir, 'Lansia P Hadir': getP(cLansia), 'Lansia L Hadir': getL(cLansia)
                         }];
                         exportJsonToExcel(data, "Kehadiran Umum", "Tabel_Kehadiran_Umum.xlsx");
                      }}
                      className="bg-[#16b3ac] hover:bg-[#11928c] text-white text-[13px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition border-none"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4">
                      {(() => {
                         const getL = (cond) => hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Laki-Laki' && cond(v)).length;
                         const getP = (cond) => hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Perempuan' && cond(v)).length;
                          const cAnak = v => v.pos1?.kategoriUmur === 'Usia sekolah 7-12 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 13-15 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 16 s.d <18 tahun';

                          return (
                         <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                               <tr className="bg-[#f3f4f6] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-y border-[#e5e7eb]">
                                  <th className="px-4 py-3 font-semibold">Provinsi</th>
                                  <th className="px-4 py-3 font-semibold">Kabko</th>
                                  <th className="px-4 py-3 font-semibold">Kecamatan</th>
                                  <th className="px-4 py-3 font-semibold">Puskesmas</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Hadir</th>
                                  <th className="px-4 py-3 font-semibold text-center">Bayi Hadir</th>
                                  <th className="px-4 py-3 font-semibold text-center">Anak Hadir</th>
                                  <th className="px-4 py-3 font-semibold text-center">Dewasa Hadir</th>
                                  <th className="px-4 py-3 font-semibold text-center">Lansia Hadir</th>
                               </tr>
                            </thead>
                            <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                               <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3">Sulawesi Selatan</td>
                                  <td className="px-4 py-3">Kab. Pinrang</td>
                                  <td className="px-4 py-3">Patampanua</td>
                                  <td className="px-4 py-3 uppercase">MALIMPUNG</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(hadirUmum)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(bayiHadir)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getP(cAnak) + getL(cAnak))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(dewasaHadir)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(lansiaHadir)}</td>
                               </tr>
                            </tbody>
                         </table>
                         );
                      })()}
                   </div>
                </div>

                {/* Tabel Agregat Kehadiran Sekolah */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Kehadiran Sekolah</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pemantauan kehadiran Cek Kesehatan Gratis Sekolah</p>
                   </div>
                   <button 
                      onClick={() => {
                         const data = [];
                         const allSekolah = [...new Set(hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa').map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                         
                         allSekolah.forEach(namaSekolah => {
                            ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                               const visits = hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                               const count = visits.length;
                               if(count > 0) {
                                  let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                                  const selesaiCount = visits.filter(v => v.pos6).length;
                                  data.push({
                                     Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                                     'Jenjang Pendidikan': jenjang,
                                     'Nama Sekolah': namaSekolah,
                                     Kelas: 'Kelas ' + k,
                                     'Siswa Hadir': count,
                                     'Selesai Skrining': selesaiCount,
                                     'Menunggu Skrining': count - selesaiCount
                                  });
                               }
                            });
                         });
                         
                         exportJsonToExcel(data, "Kehadiran Sekolah", "Tabel_Kehadiran_Sekolah.xlsx");
                      }}
                      className="bg-[#16b3ac] hover:bg-[#11928c] text-white text-[13px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition border-none"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                         <thead>
                            <tr className="bg-[#f3f4f6] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-y border-[#e5e7eb]">
                               <th className="px-4 py-3 font-semibold">Provinsi</th>
                               <th className="px-4 py-3 font-semibold">Kobko</th>
                               <th className="px-4 py-3 font-semibold">Kecamatan</th>
                               <th className="px-4 py-3 font-semibold">Puskesmas</th>
                               <th className="px-4 py-3 font-semibold">Jenjang Pendidikan</th>
                               <th className="px-4 py-3 font-semibold">Nama Sekolah</th>
                               <th className="px-4 py-3 font-semibold text-center">Kelas</th>
                               <th className="px-4 py-3 font-semibold text-center">Siswa Hadir</th>
                               <th className="px-4 py-3 font-semibold text-center">Selesai Skrining</th>
                               <th className="px-4 py-3 font-semibold text-center">Menunggu Skrining</th>
                            </tr>
                         </thead>
                         <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                            {(() => {
                               const rows = [];
                               const allSekolah = [...new Set(hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa').map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                               
                               allSekolah.forEach(namaSekolah => {
                                  ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                                     const visits = hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                                     const count = visits.length;
                                     if(count > 0) {
                                        let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                                        const selesaiCount = visits.filter(v => v.pos6).length;
                                        rows.push(
                                           <tr key={`${namaSekolah}-${k}`} className="hover:bg-slate-50 transition-colors">
                                              <td className="px-4 py-3">Sulawesi Selatan</td>
                                              <td className="px-4 py-3">Kab. Pinrang</td>
                                              <td className="px-4 py-3">Patampanua</td>
                                              <td className="px-4 py-3 uppercase">MALIMPUNG</td>
                                              <td className="px-4 py-3">{jenjang}</td>
                                              <td className="px-4 py-3">{namaSekolah}</td>
                                              <td className="px-4 py-3 text-center">Kelas {k}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(count)}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(selesaiCount)}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(count - selesaiCount)}</td>
                                           </tr>
                                        );
                                     }
                                  });
                               });
                               
                               if(rows.length === 0) {
                                   return <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-400">Belum ada data kehadiran sekolah.</td></tr>;
                               }
                               return rows;
                            })()}
                         </tbody>
                      </table>
                   </div>
                </div>
            </section>
        );
    })()}

            {activeMenu === 'profil' && (
              <section className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto mb-12">
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
                    <div className="px-6 sm:px-10 pb-8 relative">
                       <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-12 mb-8">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white p-2 shadow-lg z-10">
                             <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-black text-4xl border-2 border-white">
                                {(user?.nama || 'Administrator').charAt(0).toUpperCase()}
                             </div>
                          </div>
                          <div className="text-center sm:text-left mb-2">
                             <h3 className="text-2xl font-black text-slate-900">{user?.nama || 'Administrator'}</h3>
                             <p className="text-sm font-bold text-teal-600">Administrator CKG</p>
                          </div>
                          <div className="sm:ml-auto flex gap-3 mb-2">
                             <button className="px-4 py-2 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl hover:bg-teal-100 transition border border-teal-100">Ganti Kata Sandi</button>
                             <button className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition shadow-md">Edit Profil</button>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Informasi Pribadi</h4>
                                <div className="space-y-4">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Nama Lengkap</span>
                                      <span className="text-sm font-semibold text-slate-800">{user?.nama || 'Administrator'}</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Nomor Induk Pegawai (NIP) / NIK</span>
                                      <span className="text-sm font-semibold text-slate-800">19850101 201001 2 001</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Email</span>
                                      <span className="text-sm font-semibold text-slate-800">admin.malimpung@kemkes.go.id</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">No. WhatsApp</span>
                                      <span className="text-sm font-semibold text-slate-800">+62 812-3456-7890</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="space-y-6">
                             <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Izin & Akses Sistem</h4>
                                <div className="space-y-4">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Fasilitas Kesehatan Terdaftar</span>
                                      <span className="text-sm font-semibold text-slate-800 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Puskesmas Malimpung</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Peran Aktif</span>
                                      <span className="text-sm font-semibold text-slate-800">Administrator Tingkat 1</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Terakhir Login</span>
                                      <span className="text-sm font-semibold text-slate-800">Hari ini, pukul 08:15 WITA</span>
                                   </div>
                                </div>
                             </div>
                             
                             <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Sesi Perangkat Aktif</h4>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">💻</div>
                                   <div>
                                      <p className="text-xs font-bold text-slate-800">Windows 11 • Chrome</p>
                                      <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Sedang Digunakan</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>
          )}

          {activeMenu === 'wilayah' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                
                {/* BARIS 1: Demografi Umur & PTM */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Demografi Pasien by Kelompok Umur */}
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between col-span-1 lg:col-span-1">
                       <div className="mb-6">
                          <h3 className="text-lg font-black text-slate-900 mb-1">Demografi Umur</h3>
                          <p className="text-xs font-semibold text-slate-500">Distribusi kelompok usia sasaran CKG</p>
                       </div>
                       <div className="space-y-3">
                          {Object.entries(wilayahAnalytics.ageGroups).map(([group, count], idx) => {
                             const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500'];
                             const bgColors = ['bg-rose-50', 'bg-amber-50', 'bg-emerald-50', 'bg-blue-50', 'bg-indigo-50'];
                             const totalWithAge = Object.values(wilayahAnalytics.ageGroups).reduce((a, b) => a + b, 0);
                             const percent = totalWithAge ? Math.round((count / totalWithAge) * 100) : 0;
                             return (
                                <div key={group} className={`flex items-center justify-between p-3 rounded-xl border border-slate-100 ${bgColors[idx]}`}>
                                   <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${colors[idx]}`}></div>
                                      <span className="text-sm font-bold text-slate-800">{group}</span>
                                   </div>
                                   <div className="text-right">
                                      <span className="text-lg font-black text-slate-900">{formatNumber(count)}</span>
                                      <span className="text-[10px] text-slate-500 font-bold ml-2">({percent}%)</span>
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                   </div>

                   {/* Indikasi Penyakit Tidak Menular */}
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
                       <div className="mb-6 flex justify-between items-end">
                          <div>
                             <h3 className="text-lg font-black text-slate-900 mb-1">Penyakit Tidak Menular (PTM)</h3>
                             <p className="text-xs font-semibold text-slate-500">Pemantauan risiko kesehatan terkini dari {formatNumber(analytics.total)} pengunjung</p>
                          </div>
                          <div className="flex gap-4">
                             <div className="text-right">
                               <p className="text-[10px] font-black uppercase text-slate-400">Total Laki-laki</p>
                               <p className="text-xl font-black text-blue-600">{formatNumber(analytics.laki)}</p>
                             </div>
                             <div className="text-right border-l border-slate-200 pl-4">
                               <p className="text-[10px] font-black uppercase text-slate-400">Total Perempuan</p>
                               <p className="text-xl font-black text-pink-600">{formatNumber(analytics.perempuan)}</p>
                             </div>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                         {[
                           ['Hipertensi', analytics.risks?.hipertensi || 0, 'bg-rose-50 border-rose-200 text-rose-700', '❤️'],
                           ['Diabetes', analytics.risks?.hiperglikemia || 0, 'bg-amber-50 border-amber-200 text-amber-700', '🩸'],
                           ['Obesitas', analytics.risks?.obesitas || 0, 'bg-blue-50 border-blue-200 text-blue-700', '⚖️'],
                           ['Risiko Paru', analytics.risks?.paru || 0, 'bg-emerald-50 border-emerald-200 text-emerald-700', '🫁'],
                           ['Gangguan Mata', analytics.risks?.indera || 0, 'bg-teal-50 border-teal-200 text-teal-700', '👁️'],
                           ['Telinga', analytics.risks?.indera || 0, 'bg-indigo-50 border-indigo-200 text-indigo-700', '👂'],
                           ['Mental', analytics.risks?.mental || 0, 'bg-purple-50 border-purple-200 text-purple-700', '🧠']
                         ].map(([label, count, badgeClass, emoji]) => (
                            <div key={label} className={`p-4 rounded-xl border ${badgeClass} flex flex-col justify-between`}>
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-bold opacity-80">{label}</span>
                                  <span className="text-lg opacity-70">{emoji}</span>
                               </div>
                               <p className="text-3xl font-black">{formatNumber(count)}</p>
                            </div>
                         ))}
                       </div>
                   </div>
                </div>

                {/* BARIS 2: Kinerja per Wilayah / Dusun / Lingkungan */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <div className="mb-6">
                      <h3 className="text-lg font-black text-slate-900 mb-1">Capaian Layanan per Dusun/Lingkungan</h3>
                      <p className="text-xs font-semibold text-slate-500">Tinjauan komprehensif kunjungan CKG di seluruh wilayah kerja Puskesmas Malimpung.</p>
                   </div>
                   <div className="wilayah-mobile-list">
                      {wilayahAnalytics.byDusun.map(dusun => {
                         const risksLainnya = dusun.obesitas + dusun.paru + dusun.mental + dusun.indera;
                         const statusLabel = dusun.total >= 20 ? 'Optimal' : dusun.total > 0 ? 'Menengah' : 'Kosong';
                         return (
                            <article key={`mobile-${dusun.name}`} className="wilayah-mobile-card">
                               <div className="wilayah-mobile-card-head">
                                  <div>
                                     <h4>{dusun.name}</h4>
                                     <p>{dusun.desa.replace('Desa ', '').replace('Kelurahan ', '')}</p>
                                  </div>
                                  <span className="wilayah-visit-pill">{formatNumber(dusun.total)}</span>
                               </div>
                               <div className="wilayah-risk-grid">
                                  <span>Hipertensi <strong>{dusun.hipertensi > 0 ? formatNumber(dusun.hipertensi) : '-'}</strong></span>
                                  <span>Diabetes <strong>{dusun.diabetes > 0 ? formatNumber(dusun.diabetes) : '-'}</strong></span>
                                  <span>Risiko lain <strong>{risksLainnya > 0 ? formatNumber(risksLainnya) : '-'}</strong></span>
                                  <span>Status <strong>{statusLabel}</strong></span>
                               </div>
                               <div className="wilayah-progress-row">
                                  <div><span style={{ width: `${dusun.coverage}%` }} /></div>
                                  <strong>{Math.round(dusun.coverage)}%</strong>
                               </div>
                            </article>
                         );
                      })}
                   </div>
                   <div className="wilayah-table-wrap overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm text-slate-600">
                         <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-black tracking-wider">
                            <tr>
                               <th className="px-4 py-3 border-b border-slate-200">Wilayah / Dusun</th>
                               <th className="px-4 py-3 border-b border-slate-200 text-center">Kunjungan</th>
                               <th className="px-4 py-3 border-b border-slate-200 text-center">Hipertensi</th>
                               <th className="px-4 py-3 border-b border-slate-200 text-center">Diabetes</th>
                               <th className="px-4 py-3 border-b border-slate-200 text-center hidden md:table-cell">Risiko Lainnya</th>
                               <th className="px-4 py-3 border-b border-slate-200 text-center">Capaian Target</th>
                               <th className="px-4 py-3 border-b border-slate-200 text-center hidden sm:table-cell">Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 bg-white">
                            {wilayahAnalytics.byDusun.map(dusun => {
                               const risksLainnya = dusun.obesitas + dusun.paru + dusun.mental + dusun.indera;
                               return (
                               <tr key={dusun.name} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="px-4 py-3">
                                     <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">{dusun.name}</span>
                                        <span className="text-[10px] uppercase text-slate-400 font-black">{dusun.desa.replace('Desa ', '').replace('Kelurahan ', '')}</span>
                                     </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                     <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-black">
                                        {formatNumber(dusun.total)}
                                     </span>
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-rose-600">{dusun.hipertensi > 0 ? formatNumber(dusun.hipertensi) : '-'}</td>
                                  <td className="px-4 py-3 text-center font-bold text-amber-600">{dusun.diabetes > 0 ? formatNumber(dusun.diabetes) : '-'}</td>
                                  <td className="px-4 py-3 text-center font-bold text-slate-500 hidden md:table-cell">{risksLainnya > 0 ? formatNumber(risksLainnya) : '-'}</td>
                                  <td className="px-4 py-3">
                                     <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                                        <div className="w-12 sm:w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                           <div className={`h-full ${dusun.coverage >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${dusun.coverage}%` }}></div>
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-black text-slate-600">{Math.round(dusun.coverage)}%</span>
                                     </div>
                                  </td>
                                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                                     {dusun.total >= 20 ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                           Optimal
                                        </span>
                                     ) : dusun.total > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                           Menengah
                                        </span>
                                     ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                           Kosong
                                        </span>
                                     )}
                                  </td>
                               </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>
                </div>

              </section>
          )}


          {activeMenu === 'sekolah' && (
              <section className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">Basis Data Sekolah & Sinkronisasi</h3>
                      <p className="text-sm font-medium text-slate-500">
                        Cari, perbarui, dan validasi data sekolah. Data akan disinkronkan otomatis dengan kunjungan pasien (Klaster Anak/Siswa).
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={cleanDuplicates} className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 mr-2 shadow-sm">
                          Hapus Duplikat
                        </button>
                        <button type="button" onClick={() => openSchoolForm()} className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-teal-700">
                          + Tambah Sekolah
                        </button>
                    </div>
                  </div>
                  
                  <div className="mt-5 mb-5 flex">
                    <input
                      type="search"
                      value={schoolSearch}
                      onChange={(event) => setSchoolSearch(event.target.value)}
                      placeholder="Pencarian spesifik: nama sekolah, jenjang, desa, NPSN..."
                      className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm"
                    />
                  </div>

                  {wilayahAnalytics.schools.length === 0 ? (
                     <div className="py-12 text-center text-slate-500 font-semibold bg-slate-50 rounded-lg border border-dashed border-slate-300">Belum ada data sekolah atau pencarian tidak ditemukan. (Total Database: {schoolList.length})</div>
                  ) : (
                    <div className="space-y-8">
                      {['SD/MI', 'SMP/MTs', 'SMA/SMK/MA', 'TK/PAUD/Lainnya'].map(group => {
                         const groupSchools = wilayahAnalytics.schools.filter(s => {
                           if (group === 'SD/MI') return ['SD', 'MI'].includes(s.level);
                           if (group === 'SMP/MTs') return ['SMP', 'MTs'].includes(s.level);
                           if (group === 'SMA/SMK/MA') return ['SMA', 'SMK', 'MA'].includes(s.level);
                           return !['SD','MI','SMP','MTs','SMA','SMK','MA'].includes(s.level);
                         });
                         
                         if (groupSchools.length === 0) return null;
                         
                         return (
                           <div key={group} className="animate-in fade-in duration-500">
                             <h4 className="text-xl font-black text-slate-800 mb-4 pb-2 border-b border-slate-200">{group}</h4>
                             <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                               {groupSchools.map(school => (
                                 <div key={`${school.id}-${school.name}`} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-teal-300">
                                   <div className="flex items-start justify-between gap-3">
                                     <div>
                                       <p className="font-black text-slate-950 leading-tight">{school.name}</p>
                                       <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                         {school.level} - {school.desa}
                                       </p>
                                     </div>
                                     <button type="button" onClick={() => openSchoolForm(school)} className="rounded-md bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-200">
                                       Edit
                                     </button>
                                   </div>
                                   
                                   <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-600 border-l-2 border-slate-200 pl-3">{school.address || 'Alamat belum diatur'}</p>
                                   <p className="mt-2 text-[10px] font-black text-slate-400">NPSN: <span className="text-slate-600">{school.npsn}</span></p>

                                   <div className="mt-5 grid grid-cols-2 gap-3 text-xs flex-1">
                                     <div className="rounded-lg bg-teal-50 p-3 flex flex-col justify-center">
                                       <p className="font-black text-teal-700 text-lg">{formatNumber(school.screened)}</p>
                                       <p className="font-bold text-teal-700/80 mt-0.5">Siswa Terdeteksi</p>
                                     </div>
                                     <div className="rounded-lg bg-amber-50 p-3 flex flex-col justify-center">
                                       <p className="font-black text-amber-700 text-lg">{formatNumber(school.desaStudentScreened)}</p>
                                       <p className="font-bold text-amber-700/80 mt-0.5">Siswa Sedesa</p>
                                     </div>
                                   </div>
                                   
                                   <div className="mt-4 pt-4 border-t border-slate-100">
                                      <button 
                                        type="button" 
                                        onClick={() => setSelectedSchoolPatients(school)}
                                        disabled={!school.patients || school.patients.length === 0}
                                        className={`w-full rounded-lg py-2.5 text-xs font-black transition-colors ${school.patients && school.patients.length > 0 ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                      >
                                        {school.patients && school.patients.length > 0 ? `Lihat ${school.patients.length} Pasien Terhubung` : 'Belum Ada Pasien Terhubung'}
                                      </button>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeMenu === 'simpeg' && (
              <section className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <SummaryMetric label="Total Pegawai" value={formatNumber(staffList.length)} helper="Data koleksi staff" />
                  <SummaryMetric label="Akun Aktif" value={formatNumber(staffList.filter((staff) => staff.isActive).length)} helper="Bisa login sistem" />
                  <SummaryMetric label="Administrator" value={formatNumber(staffList.filter((staff) => (Array.isArray(staff.role) ? staff.role : [staff.role]).includes('admin')).length)} helper="Akses penuh" />
                  <SummaryMetric label="Audit Log" value={formatNumber(activityLogs.length)} helper="200 aktivitas terbaru" />
                </div>

                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
                  {[
                    ['staff', 'Manajemen Nakes'],
                    ['roles', 'Hak Akses'],
                    ['logs', 'Audit Log'],
                    ['backup', 'Backup Data']
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSimpegTab(id)}
                      className={`rounded-lg px-4 py-2 text-xs font-black transition ${simpegTab === id ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {simpegTab === 'staff' && (
                  <div className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm font-semibold text-slate-600">Atur hak akses staf puskesmas</div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        
                        <button type="button" onClick={() => openStaffForm()} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800">
                          Tambah Staff
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[180px_180px_1fr]">
                      <select value={staffStatusFilter} onChange={(event) => setStaffStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-teal-500">
                        <option value="Semua">Semua Status</option>
                        <option value="ASN">ASN (PNS/PPPK)</option>
                        <option value="MAGANG">Non-ASN (Magang)</option>
                      </select>
                      <select value={staffPosFilter} onChange={(event) => setStaffPosFilter(event.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-teal-500">
                        {['Semua', 'POS 1', 'POS 2', 'POS 3', 'POS 4', 'POS 5', 'POS 6', 'POS 7', 'ALL ACCESS', 'BELUM DITUGASKAN'].map((item) => (
                          <option key={item} value={item}>{item === 'Semua' ? 'Seluruh Pos' : item}</option>
                        ))}
                      </select>
                      <input
                        value={staffSearch}
                        onChange={(event) => setStaffSearch(event.target.value)}
                        placeholder="Cari nama, username, atau role..."
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-5 py-3">Pegawai</th>
                            <th className="px-5 py-3 text-center">Pos</th>
                            <th className="px-5 py-3 text-center">Status</th>
                            <th className="px-5 py-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {staffLoading ? (
                            <tr><td colSpan="4" className="px-5 py-10 text-center font-semibold text-slate-400">Memuat staff...</td></tr>
                          ) : filteredStaff.length === 0 ? (
                            <tr><td colSpan="4" className="px-5 py-10 text-center font-semibold text-slate-400">Data pegawai tidak ditemukan.</td></tr>
                          ) : (
                            filteredStaff.map((staff) => {
                              const roles = Array.isArray(staff.role) ? staff.role : [staff.role].filter(Boolean);
                              return (
                                <tr key={staff.id} className="hover:bg-teal-50/50 cursor-pointer group transition-colors" onClick={() => openStaffForm(staff)}>
                                  <td className="px-5 py-4">
                                    <p className="font-black text-slate-900 group-hover:text-teal-700">{staff.nama}</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">@{staff.username}</span>
                                      {roles.map((role) => (
                                        <span key={role} className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-black uppercase text-teal-700">{role.replace('_', ' ')}</span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">{staff.pos || '-'}</span>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleStaffActive(staff); }} className={`relative inline-flex h-6 w-11 items-center rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${staff.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="flex justify-center gap-2">
                                      <button type="button" onClick={(e) => { e.stopPropagation(); handleResetPIN(staff); }} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-colors">Reset PIN</button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {simpegTab === 'roles' && (
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-black text-slate-950">Definisi Hak Akses</h3>
                    <p className="text-sm font-medium text-slate-500">Role yang dipakai RBAC TERSANJUNG.</p>
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {AVAILABLE_ROLES.map((role) => (
                        <div key={role.id} className="rounded-lg border border-slate-200 p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-teal-700">{role.id.replace('_', ' ')}</p>
                          <h4 className="mt-2 font-black text-slate-950">{role.label}</h4>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{role.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {simpegTab === 'logs' && (
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-950">Audit Log Aktivitas</h3>
                        <p className="text-sm font-medium text-slate-500">Memantau tindakan user secara real-time.</p>
                      </div>
                      <input value={logSearch} onChange={(event) => setLogSearch(event.target.value)} placeholder="Cari user, nama, aktivitas..." className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-teal-500 md:w-80" />
                    </div>
                    <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-2">
                      {logsLoading ? (
                        <p className="py-12 text-center font-semibold text-slate-400">Memuat audit log...</p>
                      ) : filteredLogs.length === 0 ? (
                        <p className="py-12 text-center font-semibold text-slate-400">Tidak ada log sesuai pencarian.</p>
                      ) : (
                        filteredLogs.map((log) => (
                          <div key={log.id} className="rounded-lg border-l-4 border-teal-500 bg-slate-50 p-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-black text-slate-900">{log.aksi} <span className="font-semibold text-slate-400">di {log.modul}</span></p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{log.nama} @{log.user}</p>
                              </div>
                              <span className="rounded-lg bg-white px-3 py-1 text-xs font-black text-slate-500">{formatWaktu(log.waktu)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {simpegTab === 'backup' && (
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-black text-slate-950">Backup Database (JSON)</h3>
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
                      <h4 className="flex items-center gap-2 text-sm font-black text-rose-800">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Peringatan Kuota Firebase (Versi Gratis)
                      </h4>
                      <p className="mt-1 text-xs font-semibold text-rose-700 leading-relaxed">
                        Anda saat ini menggunakan Firebase versi Gratis (Limit: 50.000 baca/hari). Mengunduh data <b>Pasien</b> atau <b>Kunjungan</b> akan menyedot belasan ribu kuota sekaligus. <br/>
                        👉 <b>SANGAT DISARANKAN</b> untuk hanya melakukan backup ini <u>1 kali seminggu</u> (misal: Sabtu malam) agar aplikasi tidak error/nge-hang akibat kehabisan kuota.
                      </p>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                      {[
                        ['staff', 'Data Staff / Pegawai', 'Profil, role, username, dan kredensial.'],
                        ['patients', 'Data Master Pasien', 'Identitas dan demografi pasien.'],
                        ['visits', 'Data Kunjungan / RME', 'Riwayat skrining, hasil lab, dan status layanan.']
                      ].map(([collectionName, title, desc]) => (
                        <div key={collectionName} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                          <h4 className="font-black text-slate-950">{title}</h4>
                          <p className="mt-2 text-xs font-semibold text-slate-500">{desc}</p>
                          <button type="button" onClick={() => handleBackup(collectionName)} disabled={backupLoading === collectionName} className="mt-5 w-full rounded-lg bg-teal-500 px-4 py-3 text-xs font-black text-white hover:bg-teal-600 disabled:opacity-50">
                            {backupLoading === collectionName ? 'Memproses...' : 'Unduh JSON'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeMenu === 'laporan' && (
              <section className="space-y-7">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                    <li>Laporan memakai data pasien yang sudah selesai diperiksa.</li>
                    <li>Ekspor mengikuti filter tahun, bulan, wilayah, klaster, dan status yang sedang aktif.</li>
                    <li>Data identitas pasien hanya tersedia untuk administrator yang bertanggung jawab.</li>
                    <li>Gunakan laporan bulanan untuk rekap kegiatan Puskesmas dan pemantauan capaian program.</li>
                  </ol>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleExportPkgExcel(completedVisits, 'data selesai')} className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-black text-white hover:bg-teal-600">
                      Unduh Excel Terfilter
                    </button>
                    <button type="button" onClick={() => handleExportPkgPdf(completedVisits, 'data selesai')} className="rounded-lg bg-red-500 px-4 py-2 text-xs font-black text-white hover:bg-red-600">
                      Unduh PDF Terfilter
                    </button>
                    {['Balita', 'Anak/Siswa', 'Dewasa', 'Lansia'].map((cluster) => (
                      <div key={cluster} className="flex overflow-hidden rounded-lg border border-slate-300">
                        <button type="button" onClick={() => handleExportClusterExcel(completedVisits, cluster, 'data selesai')} className="px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                          {cluster} Excel
                        </button>
                        <button type="button" onClick={() => handleExportClusterPdf(completedVisits, cluster, 'data selesai')} className="border-l border-slate-300 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50">
                          PDF
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <SelectField label="Provinsi" value="Sulawesi Selatan" onChange={() => {}} options={['Sulawesi Selatan']} disabled />
                  <SelectField label="Kab/Kota" value="Kab. Pinrang" onChange={() => {}} options={['Kab. Pinrang']} disabled />
                  <SelectField label="Kecamatan" value="Patampanua" onChange={() => {}} options={['Patampanua']} disabled />
                  <SelectField label="Puskesmas" value="Malimpung" onChange={() => {}} options={['Malimpung']} disabled />
                </div>
                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {MONTHS.map((month, index) => {
                    const monthVisits = completedVisits.filter((visit) => visit._date?.getMonth() === index);
                    return (
                      <div key={month}>
                        <button type="button" onClick={() => setOpenMonth(openMonth === index ? null : index)} className="flex w-full items-center justify-between px-4 py-4 text-left text-base font-semibold text-slate-800">
                          <span>{month}</span>
                          <span>{openMonth === index ? '-' : '+'}</span>
                        </button>
                        {openMonth === index && (
                          <div className="bg-slate-50 px-4 py-4 text-sm text-slate-600">
                            <p className="font-semibold">{formatNumber(monthVisits.length)} data selesai tersedia untuk bulan ini.</p>
                            <button type="button" onClick={() => handleExportPkgExcel(monthVisits, `bulan ${month}`)} className="mt-3 rounded-lg bg-white px-4 py-2 text-xs font-black text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50">
                              Unduh laporan bulan {month}
                            </button>
                            <button type="button" onClick={() => handleExportPkgPdf(monthVisits, `bulan ${month}`)} className="ml-2 mt-3 rounded-lg bg-white px-4 py-2 text-xs font-black text-red-700 ring-1 ring-red-200 hover:bg-red-50">
                              Unduh PDF bulan {month}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeMenu === 'bantuan' && <PusatBantuan />}

            {activeMenu === 'privasi' && (
              <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-8 text-sm leading-7 text-slate-700">
                <div className="mb-7 flex items-center justify-between border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-3">
                    <img src={LOGO_PINRANG} alt="Pinrang" className="h-10 w-auto" />
                    <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-10 w-auto" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Berlaku untuk penggunaan internal TERSANJUNG</p>
                </div>
                <h2 className="text-center text-lg font-black text-slate-950">Pemberitahuan Privasi dan Ketentuan Penggunaan</h2>
                <p className="mt-5">
                  Dashboard admin TERSANJUNG memuat data kesehatan dan identitas pasien yang bersifat sangat rahasia. Pengguna wajib menjaga
                  kerahasiaan data, menggunakan informasi hanya untuk pelayanan, pemantauan program, pelaporan resmi, dan tindak lanjut
                  kesehatan masyarakat di wilayah kerja Puskesmas Malimpung.
                </p>
                <h3 className="mt-6 font-black text-slate-950">Ketentuan Penggunaan & Infrastruktur</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-slate-700">
                  <li>Akses hanya diberikan kepada akun administrator atau Nakes yang diberi mandat secara resmi.</li>
                  <li>Dilarang keras mendistribusikan data rekam medis pasien kepada pihak yang tidak berkepentingan.</li>
                  <li><b>Manajemen Kuota:</b> Fitur unduh (Backup JSON) dan pemuatan histori kunjungan dibatasi secara sistem untuk menjaga kestabilan <i>Cloud Database</i>. Dimohon agar mengunduh Backup Database hanya 1x seminggu.</li>
                  <li><b>Atomisasi Data:</b> Segala bentuk manipulasi data krusial (Penghapusan, Pengubahan Status) telah diikat menggunakan transaksi terpusat untuk menghindari data ganda/bentrok antar-Nakes.</li>
                  <li>Apabila perangkat komputer Puskesmas digunakan bersama, petugas wajib log-out setelah jam operasional selesai.</li>
                </ol>
                <h3 className="mt-6 font-black text-slate-950">Prinsip data</h3>
                <p className="mt-2">
                  Tampilan dashboard mengutamakan data agregat untuk pengambilan keputusan. Detail individu hanya dibuka pada area yang
                  memerlukan tindak lanjut langsung oleh petugas berwenang.
                </p>
              </section>
            )}
          </div>
      </main>

      
      {selectedRiskPatient && (
        (() => {
          const selectedAnthropometry = getVisitAnthropometry(selectedRiskPatient);
          return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">Detail Pemeriksaan Pasien</h2>
                <p className="text-xs font-semibold text-slate-500">Tinjauan klinis singkat untuk tindak lanjut.</p>
              </div>
              <button type="button" onClick={() => setSelectedRiskPatient(null)} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm hover:text-rose-600">
                Tutup
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Nama Lengkap</p>
                  <p className="font-bold text-slate-900">{selectedRiskPatient.pasien_snapshot?.nama || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">NIK / ID</p>
                  <p className="font-bold text-slate-900">{maskNik(selectedRiskPatient.patientNIK)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Alamat</p>
                  <p className="font-bold text-slate-900">{getDesa(selectedRiskPatient)} - {getDusun(selectedRiskPatient)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Waktu Pemeriksaan</p>
                  <p className="font-bold text-slate-900">{formatWaktu(getVisitDate(selectedRiskPatient))}</p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                <h4 className="font-black text-rose-900 mb-3 text-sm">Faktor Risiko (Pos 2 & 4)</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-rose-700 font-semibold">Tekanan Darah: </span>
                    <span className="font-black text-slate-900">
                      {extractVisitValue(selectedRiskPatient.pos2, ['sistolik'], selectedRiskPatient.pos2_question_map)
                        ? `${extractVisitValue(selectedRiskPatient.pos2, ['sistolik'], selectedRiskPatient.pos2_question_map)}/${extractVisitValue(selectedRiskPatient.pos2, ['diastolik'], selectedRiskPatient.pos2_question_map) || '-'}`
                        : selectedRiskPatient.pos2?.td || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-rose-700 font-semibold">Gula Darah: </span>
                    <span className="font-black text-slate-900">
                      GDS {selectedRiskPatient.pos4?.gds || extractVisitValue(selectedRiskPatient.pos4, ['gula darah sewaktu', 'gds'], selectedRiskPatient.pos4_question_map) || selectedRiskPatient.pos2?.gds || extractVisitValue(selectedRiskPatient.pos2, ['gula darah sewaktu', 'gds'], selectedRiskPatient.pos2_question_map) || '-'} / GDP {selectedRiskPatient.pos4?.gdp || extractVisitValue(selectedRiskPatient.pos4, ['gula darah puasa', 'gdp'], selectedRiskPatient.pos4_question_map) || selectedRiskPatient.pos2?.gdp || extractVisitValue(selectedRiskPatient.pos2, ['gula darah puasa', 'gdp'], selectedRiskPatient.pos2_question_map) || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-rose-700 font-semibold">Tinggi Badan: </span>
                    <span className="font-black text-slate-900">{selectedAnthropometry.tb || '-'} cm</span>
                  </div>
                  <div>
                    <span className="text-rose-700 font-semibold">Berat Badan: </span>
                    <span className="font-black text-slate-900">{selectedAnthropometry.bb || '-'} kg</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-rose-700 font-semibold">Lingkar Perut: </span>
                    <span className="font-black text-slate-900">{selectedAnthropometry.lp || '-'} cm</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h4 className="font-black text-blue-900 mb-3 text-sm">Catatan Lanjutan (Pos 3 & 5)</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-blue-700 font-semibold">Mental / Jiwa: </span>
                    <span className="font-bold text-slate-900">
                       {selectedRiskPatient.pos3?.skilas?.dep_sedih === 'Ya' || selectedRiskPatient.pos6?.skilas?.dep_sedih === 'Ya' ? 'Ada keluhan sedih/minat turun' : 'Tidak ada indikasi umum dari skilas'}
                    </span>
                  </p>
                  <p>
                    <span className="text-blue-700 font-semibold">Indera: </span>
                    <span className="font-bold text-slate-900">
                      Visus {selectedRiskPatient.pos3?.mata?.visus || '-'} | Pendengaran terganggu: {selectedRiskPatient.pos3?.telinga?.gg_pendengaran || '-'}
                    </span>
                  </p>
                  <p>
                    <span className="text-blue-700 font-semibold">PPOK / TB: </span>
                    <span className="font-bold text-slate-900">
                      Napas Pendek: {selectedRiskPatient.pos4?.ppok?.nafas_pendek || selectedRiskPatient.pos5?.ppok?.nafas_pendek || '-'} | Batuk Lama: {selectedRiskPatient.pos4?.resiko_tb?.batuk_lama || selectedRiskPatient.pos5?.resiko_tb?.batuk || '-'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
          );
        })()
      )}

      
      {selectedSchoolPatients && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">Koneksi Pasien: {selectedSchoolPatients.name}</h2>
                <p className="text-xs font-semibold text-slate-500">Daftar siswa CKG yang terhubung dengan sekolah ini.</p>
              </div>
              <button type="button" onClick={() => setSelectedSchoolPatients(null)} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm hover:text-rose-600">
                Tutup
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-slate-50">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSchoolPatients.patients.map(visit => (
                     <div key={visit.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition">
                        <p className="font-black text-slate-900 text-sm truncate">{visit.pasien_snapshot?.nama || maskNik(visit.patientNIK) || 'Tanpa Nama'}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{maskNik(visit.pasien_snapshot?.nik || visit.patientNIK)}</p>
                        
                        <div className="mt-3 space-y-1 text-xs">
                           <p><span className="font-semibold text-slate-400">Kelas:</span> <span className="font-bold text-slate-700">{visit.pos1?.kelas || '-'}</span></p>
                           <p><span className="font-semibold text-slate-400">TTL:</span> <span className="font-bold text-slate-700">{visit.pasien_snapshot?.tgl_lahir || '-'}</span></p>
                           <p><span className="font-semibold text-slate-400">Desa:</span> <span className="font-bold text-slate-700">{getDesa(visit)}</span></p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                           <span className={`text-[10px] font-black px-2 py-1 rounded-md ${isCompleted(visit) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {isCompleted(visit) ? 'Pemeriksaan Selesai' : 'Sedang Berjalan'}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400">{formatWaktu(getVisitDate(visit))}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {isStaffModalOpen && editStaff && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl">
            
            {/* Header Profil */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition">
                  <span className="text-xl font-black text-slate-700">←</span>
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Profil</h2>
                  <p className="text-xs font-semibold text-slate-500">Lengkapi profil dengan mengisi data berikut</p>
                </div>
              </div>
              <button type="button" onClick={() => handleSaveStaff(new Event('submit'))} className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-black text-white hover:bg-teal-700 shadow-sm transition">
                Simpan
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="mx-auto max-w-4xl space-y-6">
                
                {/* Informasi Akun */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-slate-900">Informasi akun</h3>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700">Wajib Diisi</span>
                  </div>
                  
                  <div className="flex flex-col gap-8 md:flex-row md:items-start">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl font-black text-slate-500">
                        {editStaff.nama ? editStaff.nama.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <input value={editStaff.nama} onChange={(e) => setEditStaff({...editStaff, nama: e.target.value})} placeholder="Nama Lengkap" className="block border-b border-transparent text-lg font-black text-slate-900 focus:border-teal-500 focus:outline-none" required />
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <span>@{editStaff.username || 'username'}</span>
                          <span>•</span>
                          <input value={editStaff.username} onChange={(e) => setEditStaff({...editStaff, username: e.target.value.toLowerCase().replace(/\s/g, '')})} placeholder="Ubah Username" className="w-24 border-b border-dashed border-slate-300 text-teal-600 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-500">Status Kepegawaian</span>
                          <select value={editStaff.status} onChange={(e) => setEditStaff({...editStaff, status: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none">
                            <option value="ASN">ASN</option>
                            <option value="MAGANG">Sukarela/Magang</option>
                            <option value="KONSULTAN IT">Mitra IT</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-500">Penugasan Pos CKG</span>
                          <select value={editStaff.pos} onChange={(e) => setEditStaff({...editStaff, pos: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none">
                            <option value="BELUM DITUGASKAN">Belum Ditugaskan</option>
                            <option value="POS 1">POS 1</option>
                            <option value="POS 2">POS 2</option>
                            <option value="POS 3">POS 3</option>
                            <option value="POS 4">POS 4</option>
                            <option value="POS 5">POS 5</option>
                            <option value="POS 6">POS 6</option>
                            <option value="POS 7">POS 7</option>
                            <option value="ALL ACCESS">All Access</option>
                          </select>
                        </label>
                      </div>
                      
                      {!editStaff.id && (
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-500">PIN Legacy / Password Awal Migrasi</span>
                          <input value={editStaff.pin} onChange={(e) => setEditStaff({...editStaff, pin: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-teal-500 focus:outline-none" placeholder="Masukkan PIN 6 angka" required />
                        </label>
                      )}
                      
                      {editStaff.id && (
                        <div className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                          <div>
                            <span className="block text-xs font-bold text-slate-900">PIN Legacy / Firebase Auth</span>
                            <span className="block text-[10px] font-medium text-slate-500">Reset di sini hanya mengubah PIN legacy staff. Password Firebase Auth diatur dari Firebase Console.</span>
                          </div>
                          <button type="button" onClick={() => handleResetPIN(editStaff)} className="rounded text-xs font-black text-rose-600 hover:text-rose-700 hover:underline">
                            Reset PIN
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profil SIMPEG */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-slate-900">Profil SIMPEG</h3>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">Data Kepegawaian Nasional</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">NIP / ID Pegawai</span>
                      <input value={editStaff.nip || ''} onChange={(e) => setEditStaff({...editStaff, nip: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="1980... / -" />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Kategori Detail SIMPEG</span>
                      <input value={editStaff.status_detail || ''} onChange={(e) => setEditStaff({...editStaff, status_detail: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="PNS / PPPK / Non-ASN Magang" />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Tanggal Lahir</span>
                      <input type="date" value={editStaff.tanggal_lahir || ''} onChange={(e) => setEditStaff({...editStaff, tanggal_lahir: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Jenis Kelamin</span>
                      <select value={editStaff.jenis_kelamin || ''} onChange={(e) => setEditStaff({...editStaff, jenis_kelamin: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow">
                        <option value="">-- Belum Diatur --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Pangkat</span>
                      <input value={editStaff.pangkat || ''} onChange={(e) => setEditStaff({...editStaff, pangkat: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="Pembina / Penata / -" />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Golongan Ruang</span>
                      <input value={editStaff.golongan || ''} onChange={(e) => setEditStaff({...editStaff, golongan: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="III/b / IV/a / -" />
                    </label>

                    <label className="block lg:col-span-3">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Pendidikan Terakhir</span>
                      <input value={editStaff.pendidikan || ''} onChange={(e) => setEditStaff({...editStaff, pendidikan: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="Misal: S1 Kedokteran, D-III Kebidanan" />
                    </label>
                  </div>
                </div>

                {/* Izin Akses Matrix */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900">Izin akses</h3>
                    <p className="text-xs font-medium text-slate-500">Atur kapabilitas pegawai untuk setiap modul di Puskesmas Malimpung.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        title: 'CKG Umum & Antrean',
                        key: 'ckg_umum',
                        rows: [
                          { label: 'Pendaftaran & Antrean (Pos 1)', defaultInput: true, permKey: 'pos1' },
                          { label: 'Pelayanan Dasar (Pos 2 & 3)', defaultInput: true, permKey: 'pos2_3' },
                          { label: 'Pelayanan Lanjutan (Pos 4 & 5)', defaultInput: true, permKey: 'pos4_5' },
                          { label: 'Dashboard Pemantauan & Peta Wilayah', defaultView: true, permKey: 'dash_umum' }
                        ]
                      },
                      {
                        title: 'Modul Klaster 2 (KIA & Indera)',
                        key: 'klaster2',
                        rows: [
                          { label: 'Skrining Indera (Visus & Pendengaran)', defaultInput: true, permKey: 'indera' },
                          { label: 'Kesehatan Jiwa (SRQ-20, SDQ)', defaultInput: true, permKey: 'jiwa' },
                          { label: 'Dashboard KIA & Indera', defaultView: true, permKey: 'dash_kia' }
                        ]
                      },
                      {
                        title: 'Penyakit Tidak Menular (PTM)',
                        key: 'ptm',
                        rows: [
                          { label: 'Skrining Hipertensi & Diabetes', defaultInput: true, permKey: 'skrining_ptm' },
                          { label: 'Pemeriksaan Paru & TB', defaultInput: true, permKey: 'paru_tb' },
                          { label: 'Dashboard Peta Kritis PTM', defaultView: true, defaultManage: true, permKey: 'dash_ptm' }
                        ]
                      },
                      {
                        title: 'SIMPEG & Pengaturan Sistem',
                        key: 'admin',
                        rows: [
                          { label: 'Manajemen Hak Akses & Profil Nakes', defaultManage: true, permKey: 'simpeg' },
                          { label: 'Audit Log & Backup Database', defaultManage: true, defaultDownload: true, permKey: 'audit' },
                          { label: 'Ekspor Laporan Resmi (Excel)', defaultDownload: true, permKey: 'laporan' }
                        ]
                      }
                    ].map((module) => {
                      return (
                        <div key={module.key} className="overflow-hidden rounded-lg border border-slate-200">
                          <div className="flex cursor-pointer items-center justify-between bg-slate-50 px-5 py-3 hover:bg-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">^</span>
                              <h4 className="font-black text-slate-800">{module.title}</h4>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 bg-white p-0">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                  <th className="px-5 py-3 font-semibold">Layanan</th>
                                  <th className="px-3 py-3 text-center font-semibold">Lihat</th>
                                  <th className="px-3 py-3 text-center font-semibold">Input</th>
                                  <th className="px-3 py-3 text-center font-semibold">Kelola</th>
                                  <th className="px-3 py-3 text-center font-semibold">Unduh</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {module.rows.map((row, idx) => {
                                  const isAdmin = editStaff.role?.includes('admin');
                                  const isDoctor = editStaff.role?.includes('dokter');
                                  
                                  const fallbackView = isAdmin || isDoctor || row.defaultView || row.defaultInput || false;
                                  const fallbackInput = isAdmin || isDoctor || row.defaultInput || false;
                                  const fallbackManage = isAdmin || row.defaultManage || false;
                                  const fallbackDownload = isAdmin || row.defaultDownload || false;

                                  const staffPerms = editStaff.permissions?.[row.permKey] || {};
                                  const canView = staffPerms.view !== undefined ? staffPerms.view : fallbackView;
                                  const canInput = staffPerms.input !== undefined ? staffPerms.input : fallbackInput;
                                  const canManage = staffPerms.manage !== undefined ? staffPerms.manage : fallbackManage;
                                  const canDownload = staffPerms.download !== undefined ? staffPerms.download : fallbackDownload;

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="px-5 py-3 font-medium text-slate-700">{row.label}</td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canView} onChange={() => handlePermissionToggle(row.permKey, 'view', fallbackView)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canInput} onChange={() => handlePermissionToggle(row.permKey, 'input', fallbackInput)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canManage} onChange={() => handlePermissionToggle(row.permKey, 'manage', fallbackManage)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canDownload} onChange={() => handlePermissionToggle(row.permKey, 'download', fallbackDownload)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fallback Legacy Role Mapping (Hidden from UI but manages backend roles) */}
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Penyelarasan Role Sistem Inti</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ROLES.map((role) => (
                        <label key={role.id} className={`cursor-pointer rounded-full border px-3 py-1 text-[11px] font-black uppercase transition-colors ${editStaff.role?.includes(role.id) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          <input type="checkbox" className="hidden" checked={editStaff.role?.includes(role.id)} onChange={() => handleRoleToggle(role.id)} />
                          {role.id.replace('_', ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Hidden Submit Button to allow handleSaveStaff to be called properly without changing its logic */}
            <form onSubmit={handleSaveStaff} className="hidden"><button id="hidden-submit-btn" type="submit">Submit</button></form>

          </div>
        </div>
            )}

      {isSchoolModalOpen && editSchool && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">{editSchool.id ? 'Edit Data Sekolah' : 'Tambah Sekolah Baru'}</h2>
                <p className="text-xs font-semibold text-slate-500">Pastikan penulisan nama spesifik agar deteksi data pasien akurat.</p>
              </div>
              <button type="button" onClick={() => setIsSchoolModalOpen(false)} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm hover:text-rose-600">
                Batal
              </button>
            </div>
            <form onSubmit={handleSaveSchool} className="overflow-y-auto p-6 space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Nama Sekolah Lengkap</span>
                <input value={editSchool.name} onChange={(e) => setEditSchool({ ...editSchool, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500" placeholder="Contoh: UPT SD Negeri 123 Pinrang" required />
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Jenjang</span>
                  <select value={editSchool.level} onChange={(e) => setEditSchool({ ...editSchool, level: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500">
                    <option value="TK/PAUD">TK/PAUD</option>
                    <option value="SD">SD</option>
                    <option value="MI">MI</option>
                    <option value="SMP">SMP</option>
                    <option value="MTs">MTs</option>
                    <option value="SMA">SMA</option>
                    <option value="MA">MA</option>
                    <option value="SMK">SMK</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">NPSN (Opsional)</span>
                  <input value={editSchool.npsn} onChange={(e) => setEditSchool({ ...editSchool, npsn: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500" placeholder="-" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block col-span-2">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Desa/Kelurahan</span>
                  <select value={editSchool.desa} onChange={(e) => setEditSchool({ ...editSchool, desa: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500">
                    <option value="Desa Malimpung">Desa Malimpung</option>
                    <option value="Desa Padang Loang">Desa Padang Loang</option>
                    <option value="Kelurahan Maccirinna">Kelurahan Maccirinna</option>
                  </select>
                </label>
                <label className="block col-span-2">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Alamat Spesifik</span>
                  <input value={editSchool.address} onChange={(e) => setEditSchool({ ...editSchool, address: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500" placeholder="Alamat dusun/lingkungan" required />
                </label>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 flex gap-3">
                {editSchool.id && (
                  <button type="button" onClick={() => handleDeleteSchool(editSchool.id)} className="w-1/3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 py-3 text-sm font-black hover:bg-rose-100 shadow-sm transition">
                    Hapus
                  </button>
                )}
                <button type="submit" className={`${editSchool.id ? 'w-2/3' : 'w-full'} rounded-lg bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 shadow-md transition`}>
                  Simpan Data Sekolah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
