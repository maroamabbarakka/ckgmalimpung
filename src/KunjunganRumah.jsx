import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { formatVisitDate } from './utils/ckgValidation';
import { runIdentityOcr, toLegacyOcrFormData } from './features/ocr/ocrPipeline';
import { createQrDataUrl } from './utils/qrCode';
import { STATUS_MAPPING } from './utils/constants';
import { writeAuditLog } from './services/auditService';
import { buildPatientPayload, findCurrentYearCkgVisit, upsertPatient } from './services/patientService';
import { buildPatientSnapshot, createVisitDocRef, createVisitWithRef, nowTimestamp } from './services/visitService';
import OcrResultReview from './features/ocr/OcrResultReview';

const OPENCV_SCRIPT_ID = 'opencv-script';
const OPENCV_SCRIPT_SRC = '/vendor/opencv-4.8.0.js';

// ==========================================
// KONSTANTA WILAYAH & DEFAULT DATA
// ==========================================
const WILAYAH_KERJA = {
  "Desa Malimpung": ["Dusun Palita", "Dusun Malimpung", "Dusun Pajalele"],
  "Desa Padang Loang": ["Dusun Padang", "Dusun Banga", "Dusun Palita"],
  "Kelurahan Maccirinna": ["Lingkungan Dioang", "Lingkungan Bulu Dua", "Lingkungan Paraungan"],
  "Luar Wilayah": ["Lainnya"]
};

const DEFAULT_LANSIA = {
  kog_ingat_3_kata: 'Ya', kog_orientasi: 'Benar semua', kog_ingat_kembali: 'Ya', mob_berdiri_kursi: 'Ya',
  gizi_bb_turun: 'Tidak', gizi_nafsu_makan: 'Tidak', gizi_lila_kurang: 'Tidak', dep_sedih: 'Tidak', dep_minat_turun: 'Tidak',
  adl_bab: 'Terkendali teratur', adl_bak: 'Mandiri', adl_seka: 'Mandiri', adl_jamban: 'Mandiri', adl_makan: 'Mandiri', adl_bangun: 'Mandiri', adl_jalan: 'Mandiri', adl_baju: 'Mandiri', adl_tangga: 'Mandiri', adl_mandi: 'Mandiri',
  minicog_jam: 'Benar', minicog_ingat: 'Benar semua kata', sppb_samping: 'Bertahan 10 detik', sppb_semitandem: 'Bertahan 10 detik', sppb_tandem: 'Bertahan 10 detik', sppb_jalan: '4', sppb_kursi: '4',
  mna_asupan: 'Nafsu Makan Biasa saja', mna_bb: 'Tidak Tahu', mna_mobilitas: 'Bisa bepergian keluar rumah', mna_stress: 'Tidak', mna_neuro: 'Tidak ada masalah psikologis', mna_imt: 'IMT >= 23', mna_betis: '= 31 cm',
  depl_puas: 'Ya', depl_bosan: 'Tidak', depl_tak_berdaya: 'Tidak', depl_tak_berharga: 'Tidak',
  ad8_keputusan: 'Tidak Berubah', ad8_hobi: 'Tidak Berubah', ad8_ulang: 'Tidak Berubah', ad8_alat: 'Tidak Berubah', ad8_waktu: 'Tidak Berubah', ad8_uang: 'Tidak Berubah', ad8_janji: 'Tidak Berubah', ad8_memori: 'Tidak Berubah'
};

const DEFAULT_KANKER_PARU = {
  riwayat_kanker: 'Tidak pernah didiagnosis menderita kanker', riwayat_keluarga: 'Tidak ada keluarga yang terdiagnosis kanker', riwayat_merokok: 'Tidak pernah merokok', jml_bungkus_tahun: '',
  riwayat_karsinogenik: 'Tidak tempat kerja mengandung zat karsinogenik', lingkungan_tinggi: 'Tidak memiliki tempat tinggal berpotensi tinggi', lingkungan_rumah: 'Memiliki lingkungan dalam rumah yang sehat',
  penyakit_paru: 'Tidak pernah didiagnosis penyakit paru kronik', foto_torax: 'Normal'
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const hitungUmur = (tglLahir) => {
  if (!tglLahir) return { tahun: 0, bulan: 0, totalBulan: 0, kategori: '-' };
  const birthDate = new Date(tglLahir);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) { years--; months += 12; }
  const totalBulan = (years * 12) + months;
  let kategori = '-';
  if (totalBulan >= 0 && totalBulan <= 11) kategori = 'Bayi';
  else if (years >= 1 && years <= 5) kategori = 'Balita';
  else if (years >= 6 && years <= 12) kategori = 'SD';
  else if (years >= 13 && years <= 15) kategori = 'SMP';
  else if (years >= 16 && years <= 18) kategori = 'SMA';
  else if (years >= 19 && years <= 59) kategori = 'Dewasa';
  else if (years >= 60) kategori = 'Lansia';
  return { tahun: years, bulan: months, totalBulan, kategori };
};

const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return year >= 1900 && date <= today;
};

const isSixteenDigitNik = (value) => /^\d{16}$/.test(String(value || ''));

const normalizeIdentityText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildNonNikIdentityKey = ({ waliNik, patientName, birthDate }) =>
  `NONIK-${waliNik}-${birthDate}-${normalizeIdentityText(patientName)}`;

const normalizeWhatsappNumber = (value) => {
  let phone = String(value || '').replace(/[^\d+]/g, '');
  if (phone.startsWith('+')) phone = phone.slice(1);
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  if (phone.startsWith('620')) phone = `62${phone.slice(3)}`;
  return phone;
};

const isAnakSekolah = (kategori) => ['SD', 'SMP', 'SMA', 'Anak/Siswa'].includes(kategori);
const AKTIVITAS_ANAK_OPTIONS = [
  { value: 'Aktif >=60 menit/hari', label: 'Aktif >=60 menit/hari' },
  { value: 'Kurang aktif', label: 'Kurang aktif' },
  { value: 'Dibatasi sesuai anjuran dokter', label: 'Dibatasi sesuai anjuran dokter' }
];
const AKTIVITAS_DEWASA_OPTIONS = [
  { value: 'Aktivitas Ringan', label: 'Aktivitas Ringan (Kantoran / Santai)' },
  { value: 'Sedang / Tani', label: 'Aktivitas Sedang (IRT / Tani / Berkebun)' },
  { value: 'Berat / Buruh', label: 'Aktivitas Berat (Buruh / Sopir / Olahragawan)' }
];
const isBayiAtauAnak = (kategori) => ['Bayi', 'Balita', 'SD', 'SMP', 'SMA', 'Anak/Siswa'].includes(kategori);

const hitungIMT = (tb, bb) => {
  if (!tb || !bb) return { nilai: '-', status: 'Tidak Diperiksa', color: 'text-slate-500', pos: 0 };
  const t = parseFloat(tb) / 100;
  const b = parseFloat(bb);
  if (isNaN(t) || isNaN(b) || t <= 0 || b <= 0) return { nilai: '-', status: 'Data Tidak Valid', color: 'text-slate-500', pos: 0 };
  const imt = (b / (t * t)).toFixed(1);
  if (imt < 18.5) return { nilai: imt, status: '(Kurus)', color: 'text-yellow-600', pos: 15 };
  if (imt >= 18.5 && imt <= 24.9) return { nilai: imt, status: '(Normal)', color: 'text-emerald-600', pos: 40 };
  if (imt >= 25.0 && imt <= 29.9) return { nilai: imt, status: '(Gemuk)', color: 'text-orange-500', pos: 70 };
  return { nilai: imt, status: '(Obesitas)', color: 'text-red-600', pos: 90 };
};

const evalTensi = (td) => {
  if (!td || !td.includes('/')) return { status: 'Tidak Diperiksa', color: 'text-slate-500', pos: 0 };
  const sys = parseInt(td.split('/')[0]);
  if (isNaN(sys)) return { status: 'Data Tidak Valid', color: 'text-slate-500', pos: 0 };
  if (sys < 120) return { status: '(Normal)', color: 'text-emerald-600', pos: 30 };
  if (sys >= 120 && sys <= 139) return { status: '(Prehipertensi)', color: 'text-yellow-600', pos: 60 };
  return { status: '(Hipertensi)', color: 'text-red-600', pos: 85 };
};

const evalGula = (gds, gdp) => {
  if (gdp && String(gdp).trim() !== '') {
    const val = parseFloat(gdp);
    if (isNaN(val)) return { nilai: '-', status: 'Data Tidak Valid', color: 'text-slate-500', pos: 0 };
    if (val < 100) return { nilai: `${val} mg/dL`, status: '(Normal)', color: 'text-emerald-600', pos: 30 };
    if (val >= 100 && val <= 125) return { nilai: `${val} mg/dL`, status: '(Prediabetes)', color: 'text-yellow-600', pos: 60 };
    return { nilai: `${val} mg/dL`, status: '(Diabetes)', color: 'text-red-600', pos: 85 };
  }
  if (gds && String(gds).trim() !== '') {
    const val = parseFloat(gds);
    if (isNaN(val)) return { nilai: '-', status: 'Data Tidak Valid', color: 'text-slate-500', pos: 0 };
    if (val < 140) return { nilai: `${val} mg/dL`, status: '(Normal)', color: 'text-emerald-600', pos: 30 };
    if (val >= 140 && val <= 199) return { nilai: `${val} mg/dL`, status: '(Prediabetes)', color: 'text-yellow-600', pos: 60 };
    return { nilai: `${val} mg/dL`, status: '(Diabetes)', color: 'text-red-600', pos: 85 };
  }
  return { nilai: '-', status: 'Tidak Diperiksa', color: 'text-slate-500', pos: 0 };
};

// ==========================================
// KOMPONEN UI MOBILE OPTIMIZED (RESPONSIF)
// ==========================================
const InputCustom = ({ label, name, value, onChange, type = "text", placeholder = "", required = false, disabled = false, hint, maxLength }) => {
  const inputMode = (type === 'tel' || type === 'number') ? 'numeric' : 'text';
  const pattern = (type === 'tel' || type === 'number') ? '[0-9]*' : undefined;

  return (
    <div className="door-field w-full">
      <label className="field-label block text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{label} {required && <span className="required text-red-500">*</span>}</label>
      {hint && <p className="field-helper text-[10px] text-slate-400 leading-tight mb-2">{hint}</p>}
      <input
        type={type} name={name} value={value} onChange={onChange} required={required} disabled={disabled} placeholder={placeholder}
        inputMode={inputMode} pattern={pattern} maxLength={maxLength}
        className="door-input w-full min-h-[48px] rounded-xl border-slate-200 shadow-sm p-3 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white disabled:bg-slate-100 text-slate-800 font-bold text-base md:text-sm outline-none"
      />
    </div>
  );
};

const TogglePill = ({ label, hint, value, onChange, colorClass = "bg-blue-600", opt1 = "Tidak", opt2 = "Ya" }) => (
  <div className="door-field">
    <label className="field-label block text-[11px] md:text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">{label}</label>
    {hint && <p className="field-helper text-[10px] text-slate-500 leading-tight mb-2">{hint}</p>}
    <div className="segmented-control door-segmented flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 gap-1 shadow-inner min-h-[52px]">
      <button type="button" onClick={() => onChange(opt1)} className={`segment-option flex-1 text-[11px] md:text-xs font-bold rounded-lg transition-all active:scale-95 ${value === opt1 ? 'active bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-white/50'}`}>{opt1.toUpperCase()}</button>
      <button type="button" onClick={() => onChange(opt2)} className={`segment-option flex-1 text-[11px] md:text-xs font-bold rounded-lg transition-all active:scale-95 ${value === opt2 ? `active ${colorClass} text-white shadow-md` : 'text-slate-500 hover:bg-white/50'}`}>{opt2.toUpperCase()}</button>
    </div>
  </div>
);

const MultiTogglePill = ({ label, hint, value, onChange, options, colorClass = "bg-blue-600" }) => (
  <div className="door-field w-full">
    <label className="field-label block text-[11px] md:text-xs font-bold text-slate-700 uppercase mb-1 tracking-widest">{label}</label>
    {hint && <p className="field-helper text-[10px] text-slate-500 leading-tight mb-2">{hint}</p>}
    <div className="segmented-control door-segmented flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 gap-1 shadow-inner min-h-[52px]">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)} className={`segment-option flex-1 text-[10px] md:text-xs font-bold rounded-lg transition-all active:scale-95 ${value === opt ? `active ${colorClass} text-white shadow-md border border-transparent` : 'text-slate-500 hover:bg-white/50'}`}>{opt}</button>
      ))}
    </div>
  </div>
);

const SelectCustom = ({ label, hint, value, onChange, options, darkTheme = false }) => (
  <div className="door-field">
    <label className={`field-label block text-[11px] md:text-xs font-bold uppercase tracking-widest mb-1 ${darkTheme ? 'text-slate-300' : 'text-slate-700'}`}>{label}</label>
    {hint && <p className={`field-helper text-[10px] leading-tight mb-2 ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{hint}</p>}
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`door-select w-full min-h-[48px] p-3 rounded-xl font-bold text-base md:text-sm shadow-sm outline-none cursor-pointer transition-colors active:scale-[0.98] ${darkTheme ? 'bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-emerald-500' : 'bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500'}`}>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const RangkumanCardPrint = ({ icon, title, value, status, textColor, dotPos }) => (
  <div className="border border-slate-300 rounded-xl p-3 md:p-4 print:p-3 bg-white flex flex-col justify-between shadow-sm h-full">
    <div className="flex items-start gap-3 print:gap-2 mb-3 print:mb-2">
      <div className="w-10 h-10 md:w-8 md:h-8 print:w-7 print:h-7 rounded-full border border-slate-200 flex items-center justify-center text-lg md:text-sm print:text-sm shrink-0 bg-slate-50">{icon}</div>
      <div>
        <h4 className="text-[10px] md:text-[9px] print:text-[8px] font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
        <p className="text-xs md:text-[11px] print:text-[10px] font-black text-slate-800 leading-tight mt-1 print:mt-0.5">{value} <br /><span className={`text-[10px] md:text-[9px] print:text-[8px] ${textColor}`}>{status}</span></p>
      </div>
    </div>
    <div className="w-full h-2 md:h-1.5 print:h-1 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 relative mt-auto">
      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-2.5 md:h-2.5 print:w-2 print:h-2 bg-white border border-slate-400 rounded-full shadow-sm" style={{ left: `calc(${dotPos}% - 5px)` }}></div>
    </div>
  </div>
);

// ==========================================
// MAIN COMPONENT: KUNJUNGAN RUMAH (STEPPER)
// ==========================================
function KunjunganRumah() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState('');
  const [visitId, setVisitId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // --- INISIALISASI OPENCV.JS ---
  const [cvReady, setCvReady] = useState(false);
  useEffect(() => {
    if (!window.cv && !document.getElementById(OPENCV_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = OPENCV_SCRIPT_ID;
      script.src = OPENCV_SCRIPT_SRC;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      script.onload = () => { setTimeout(() => setCvReady(true), 1000); };
      script.onerror = () => { setCvReady(false); };
      document.body.appendChild(script);
    } else if (window.cv) {
      setCvReady(true);
    } else {
      const checkCV = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          setCvReady(true);
          clearInterval(checkCV);
        }
      }, 500);
      return () => clearInterval(checkCV);
    }
    return undefined;
  }, []);

  // --- STATE POS 1 (IDENTITAS & OCR) ---
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processCanvasRef = useRef(null);
  const scanRafRef = useRef(null);
  const alignCountRef = useRef(0);
  const isCapturingRef = useRef(false);
  const ocrJobRef = useRef(0);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrMode, setOcrMode] = useState('');
  const [ocrCandidates, setOcrCandidates] = useState([]);
  const [ocrReview, setOcrReview] = useState(null);
  const [ocrMeta, setOcrMeta] = useState(null);
  const [ocrDuplicateWarning, setOcrDuplicateWarning] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [kameraStatus, setKameraStatus] = useState('idle');
  const [isTorchOn, setIsTorchOn] = useState(false);

  const [dataUmur, setDataUmur] = useState({ tahun: 0, bulan: 0, totalBulan: 0, kategori: '-' });
  const [tanpaNik, setTanpaNik] = useState(false);
  const [tglLahirView, setTglLahirView] = useState('');
  const [tglLahirWaliView, setTglLahirWaliView] = useState('');

  const [formData, setFormData] = useState({
    nik: '', nama: '', status_perkawinan: 'Belum Kawin', tgl_lahir: '', j_kelamin: 'P', no_hp: '', desa: 'Desa Malimpung', dusun: 'Dusun Palita',
    nik_wali: '', nama_wali: '', tgl_lahir_wali: '', hubungan_wali: 'Ibu', no_hp_wali: ''
  });

  // --- STATE POS 2 (FISIK & LAB) ---
  const [tb, setTb] = useState('');
  const [bb, setBb] = useState('');
  const [lk, setLk] = useState('');
  const [lp, setLp] = useState('');
  const [lila, setLila] = useState('');
  const [td, setTd] = useState('');
  const [bbLahir, setBbLahir] = useState('');
  const [pbLahir, setPbLahir] = useState('');
  const [isPuasa, setIsPuasa] = useState(false);
  const [gds, setGds] = useState('');
  const [gdp, setGdp] = useState('');
  const [asamUrat, setAsamUrat] = useState('');
  const [kolesterol, setKolesterol] = useState('');
  const [riwayatHipertensi, setRiwayatHipertensi] = useState('Tidak');
  const [lamaDiagnosisHipertensi, setLamaDiagnosisHipertensi] = useState('');
  const [riwayatDiabetes, setRiwayatDiabetes] = useState('Tidak');
  const [lamaDiagnosisDiabetes, setLamaDiagnosisDiabetes] = useState('');
  const [gigiGoyang, setGigiGoyang] = useState('Tidak');
  const [gigiLubang, setGigiLubang] = useState('Tidak');
  const [gigiHilang, setGigiHilang] = useState('Tidak');
  const [gigiPeriodontal, setGigiPeriodontal] = useState('Tidak');
  const [jmlKaries, setJmlKaries] = useState('');

  // --- STATE POS 3 & 4 ---
  const [pjb1, setPjb1] = useState('Negatif'); const [pjb2, setPjb2] = useState('Negatif'); const [ikterus, setIkterus] = useState(''); const [kulitTinja, setKulitTinja] = useState('Normal'); const [edukasiBbl, setEdukasiBbl] = useState('Tidak'); const [hb0, setHb0] = useState('Tidak');
  const [mataKanan, setMataKanan] = useState('N'); const [mataKiri, setMataKiri] = useState('N'); const [visus, setVisus] = useState(''); const [pupil, setPupil] = useState(''); const [kacamata, setKacamata] = useState('Tidak');
  const [telingaSerumen, setTelingaSerumen] = useState('Tidak'); const [telingaInfeksi, setTelingaInfeksi] = useState('Tidak'); const [telingaGgPendengaran, setTelingaGgPendengaran] = useState('Tidak'); const [dayaDengar, setDayaDengar] = useState('Sesuai');
  const [gulaRiwKeluarga, setGulaRiwKeluarga] = useState('Tidak'); const [gulaLapar, setGulaLapar] = useState('Tidak'); const [gulaTurunBb, setGulaTurunBb] = useState('Tidak'); const [gulaHaus, setGulaHaus] = useState('Tidak');
  const [imunHep, setImunHep] = useState(false); const [imunOpv, setImunOpv] = useState(false); const [imunPcv, setImunPcv] = useState(false); const [imunDpt, setImunDpt] = useState(false); const [imunBcg, setImunBcg] = useState(false); const [imunRota, setImunRota] = useState(false); const [imunIpv, setImunIpv] = useState(false); const [imunCampak, setImunCampak] = useState(false);
  const [jiwaKhawatirAnak, setJiwaKhawatirAnak] = useState('Tidak'); const [jiwaKontrolAnak, setJiwaKontrolAnak] = useState('Tidak'); const [jiwaFokusAnak, setJiwaFokusAnak] = useState('Tidak');
  const [jiwaSrqSemangat, setJiwaSrqSemangat] = useState('Tidak'); const [jiwaSrqMurung, setJiwaSrqMurung] = useState('Tidak'); const [jiwaSrqGugup, setJiwaSrqGugup] = useState('Tidak'); const [jiwaSrqKhawatir, setJiwaSrqKhawatir] = useState('Tidak');
  const [catinHiv, setCatinHiv] = useState('Tidak'); const [catinSifilis, setCatinSifilis] = useState('Tidak'); const [catinTt, setCatinTt] = useState('Tidak');
  const [caUsus, setCaUsus] = useState('Tidak'); const [caPayudara, setCaPayudara] = useState('Tidak'); const [caServiks, setCaServiks] = useState('Tidak'); const [caLain, setCaLain] = useState('Tidak');
  const [sadanis, setSadanis] = useState('Tidak Diperiksa'); const [usg, setUsg] = useState('Tidak Diperiksa'); const [iva, setIva] = useState('Tidak Diperiksa'); const [hpvDna, setHpvDna] = useState('Tidak Diperiksa'); const [hamil, setHamil] = useState('Tidak');
  const [lansia, setLansia] = useState(DEFAULT_LANSIA); const handleLansia = (field, val) => setLansia(prev => ({ ...prev, [field]: val }));
  const [kankerParu, setKankerParu] = useState(DEFAULT_KANKER_PARU);
  const [disabilitas, setDisabilitas] = useState('Tidak');
  const [resTbBatuk, setResTbBatuk] = useState('Tdk'); const [resTbKontak, setResTbKontak] = useState('Tdk'); const [resTbRiwPpok, setResTbRiwPpok] = useState('Tdk'); const [xrayDewasaBb, setXrayDewasaBb] = useState('Tdk'); const [xrayDewasaDemam] = useState('Tdk'); const [xrayDewasaKeringat, setXrayDewasaKeringat] = useState('Tdk');
  const [caParuMerokokKrg1th, setCaParuMerokokKrg1th] = useState('Tdk'); const [caParuRiwMerokok, setCaParuRiwMerokok] = useState('Tdk'); const [caParuAsap, setCaParuAsap] = useState('Tdk'); const [caParuRiwKlg, setCaParuRiwKlg] = useState('Tdk');
  const [rokokBatukLama, setRokokBatukLama] = useState('Tdk'); const [rokokSesak, setRokokSesak] = useState('Tdk'); const [ppokNafas, setPpokNafas] = useState('Tdk'); const [ppokDahak, setPpokDahak] = useState('Tdk');
  const [kulitKusta, setKulitKusta] = useState('Tdk'); const [kulitSkabies, setKulitSkabies] = useState('Tdk'); const [kulitFrambusia, setKulitFrambusia] = useState('Tdk');
  const [hepTransfusi, setHepTransfusi] = useState('Tdk'); const [hepHd, setHepHd] = useState('Tdk'); const [hepKlg, setHepKlg] = useState('Tdk');
  const [aktivitasFisik, setAktivitasFisik] = useState('Sedang / Tani'); const [catatanAkhir, setCatatanAkhir] = useState('');

  // ==========================================
  // LOGIKA DINAMIS & VALIDASI
  // ==========================================
  useEffect(() => {
    if (formData.tgl_lahir) {
      const umur = hitungUmur(formData.tgl_lahir);
      setDataUmur(umur);
      if (isBayiAtauAnak(umur.kategori)) setTanpaNik(true);
    } else {
      setDataUmur({ tahun: 0, bulan: 0, totalBulan: 0, kategori: '-' });
    }
  }, [formData.tgl_lahir]);

  useEffect(() => {
    let ignore = false;
    const nik = String(formData.nik || '').trim();
    if (tanpaNik || !/^\d{16}$/.test(nik)) {
      setOcrDuplicateWarning('');
      return undefined;
    }

    findCurrentYearCkgVisit({ patientNik: nik })
      .then((visit) => {
        if (ignore) return;
        setOcrDuplicateWarning(visit ? `Peringatan: NIK ini sudah mendapatkan layanan CKG pada ${formatVisitDate(visit)}.` : '');
      })
      .catch(() => {
        if (!ignore) setOcrDuplicateWarning('');
      });

    return () => {
      ignore = true;
    };
  }, [formData.nik, tanpaNik]);

  const kategoriPasien = dataUmur.kategori;
  const umurPasien = dataUmur.tahun;
  const aktivitasOptions = isAnakSekolah(kategoriPasien) ? AKTIVITAS_ANAK_OPTIONS : AKTIVITAS_DEWASA_OPTIONS;
  const isPerempuan = formData.j_kelamin === 'P';

  useEffect(() => {
    if (isAnakSekolah(kategoriPasien) && AKTIVITAS_DEWASA_OPTIONS.some(option => option.value === aktivitasFisik)) {
      setAktivitasFisik('Aktif >=60 menit/hari');
    }
    if (!isAnakSekolah(kategoriPasien) && AKTIVITAS_ANAK_OPTIONS.some(option => option.value === aktivitasFisik)) {
      setAktivitasFisik('Sedang / Tani');
    }
  }, [aktivitasFisik, kategoriPasien]);

  const handleTensiChange = (val) => {
    const sanitizedVal = val.replace(/[^0-9/]/g, '');
    setTd(sanitizedVal);
  }

  let isHipertensi = false;
  if (td && td.includes('/')) {
    const parts = td.split('/');
    const sys = parseInt(parts[0]);
    const dia = parseInt(parts[1]);
    if (!isNaN(sys) && !isNaN(dia) && (sys >= 140 || dia >= 90)) isHipertensi = true;
  }

  let isDiabetes = false;
  const nGula = isPuasa ? parseFloat(gdp) : parseFloat(gds);
  if ((isPuasa && nGula >= 126) || (!isPuasa && nGula >= 200)) isDiabetes = true;

  const isUsiaKankerParu = umurPasien >= 45;
  const imtTersedia = hitungIMT(tb, bb).nilai !== '-';

  const showMiniCog = lansia.kog_ingat_3_kata === 'Tidak' || lansia.kog_orientasi !== 'Benar semua';
  const showSPPB = lansia.mob_berdiri_kursi === 'Tidak';
  const showMNA = lansia.gizi_bb_turun === 'Ya' || lansia.gizi_nafsu_makan === 'Ya' || lansia.gizi_lila_kurang === 'Ya';
  const showDepresiLanjut = lansia.dep_sedih === 'Ya' || lansia.dep_minat_turun === 'Ya';

  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    let timer = null;
    if (step === 3 && kategoriPasien === 'Lansia' && showMiniCog && lansia.minicog_jam !== 'Benar') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleLansia('minicog_jam', 'Salah');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, showMiniCog, lansia.minicog_jam, kategoriPasien]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ==========================================
  // HANDLERS (NEXT, PREV, SUBMIT)
  // ==========================================
  const handleDateMaskChange = (e, fieldName) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.substring(0, 8);
    let formatted = val;
    if (val.length >= 3 && val.length <= 4) formatted = `${val.substring(0, 2)}/${val.substring(2)}`;
    else if (val.length >= 5) formatted = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4)}`;

    if (fieldName === 'tgl_lahir') {
      setTglLahirView(formatted);
      if (formatted.length === 10) {
        const [d, m, y] = formatted.split('/');
        setFormData(prev => ({ ...prev, tgl_lahir: `${y}-${m}-${d}` }));
      } else {
        setFormData(prev => ({ ...prev, tgl_lahir: '' }));
      }
    } else {
      setTglLahirWaliView(formatted);
      if (formatted.length === 10) {
        const [d, m, y] = formatted.split('/');
        setFormData(prev => ({ ...prev, tgl_lahir_wali: `${y}-${m}-${d}` }));
      } else {
        setFormData(prev => ({ ...prev, tgl_lahir_wali: '' }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "desa") {
      setFormData({ ...formData, desa: value, dusun: WILAYAH_KERJA[value][0] });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const validateStepOne = () => {
    if (!isValidIsoDate(formData.tgl_lahir)) return 'Tanggal lahir pasien harus valid dan tidak boleh di masa depan.';
    if (dataUmur.kategori === '-') return 'Kategori usia belum valid. Periksa kembali tanggal lahir pasien.';
    if (!formData.nama.trim()) return 'Nama pasien tidak boleh kosong.';

    if (tanpaNik) {
      if (dataUmur.tahun >= 19) return 'Pasien dewasa (19+) wajib memiliki NIK sendiri.';
      if (!isSixteenDigitNik(formData.nik_wali)) return 'NIK wali/pendamping wajib 16 digit angka.';
      if (!formData.nama_wali.trim()) return 'Nama wali/pendamping tidak boleh kosong.';
      if (!isValidIsoDate(formData.tgl_lahir_wali)) return 'Tanggal lahir wali harus valid dan tidak boleh di masa depan.';
      return null;
    }

    if (!isSixteenDigitNik(formData.nik)) return 'NIK pasien wajib 16 digit angka.';
    return null;
  };

  const handleNextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPesan('');
    if (step === 1) {
      const validationMessage = validateStepOne();
      if (validationMessage) return setPesan(`Peringatan: ${validationMessage}`);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev => prev - 1);
  };

  const handleBackToMenu = () => {
    navigate('/');
  };

  const { user } = useAuth();

  const handleSimpanKeDatabase = async () => {
    if (loading || ocrLoading) return;
    setLoading(true);
    setPesan('');
    const namaPetugas = user?.nama || 'Sistem Nakes';

    const validationMessage = validateStepOne();
    if (validationMessage) {
      setPesan(`Peringatan: ${validationMessage}`);
      setLoading(false);
      return;
    }

    const identityKey = tanpaNik
      ? buildNonNikIdentityKey({ waliNik: formData.nik_wali, patientName: formData.nama, birthDate: formData.tgl_lahir })
      : formData.nik;
    const finalNik = identityKey;
    const kontakPasien = formData.no_hp || formData.no_hp_wali;
    const alamatPasien = [formData.dusun, formData.desa].filter(Boolean).join(', ');

    try {
      const kunjunganTahunIni = await findCurrentYearCkgVisit(
        tanpaNik ? { identityKey } : { patientNik: finalNik }
      );
      if (kunjunganTahunIni) {
        setPesan(`Peringatan: Identitas pasien ini sudah mendapatkan layanan CKG pada ${formatVisitDate(kunjunganTahunIni)}. CKG hanya dapat dilakukan 1 kali dalam tahun yang sama.`);
        setLoading(false);
        return;
      }

      const patientData = buildPatientPayload({
        nik: finalNik,
        identityKey,
        name: formData.nama,
        birthDate: formData.tgl_lahir,
        gender: formData.j_kelamin,
        phone: kontakPasien,
        statusPerkawinan: formData.status_perkawinan,
        desa: formData.desa,
        dusun: formData.dusun,
        wali: tanpaNik
          ? {
              nik_wali: formData.nik_wali,
              nama_wali: formData.nama_wali,
              tgl_lahir_wali: formData.tgl_lahir_wali,
              hubungan: formData.hubungan_wali,
              no_hp_wali: formData.no_hp_wali
            }
          : null
      });
      await upsertPatient(finalNik, patientData);

      const nomorAntrianDtd = `DTD-${Math.floor(100 + Math.random() * 900)}`;

      let payloadPos2 = { tb, bb, is_puasa: isPuasa };
      if (kategoriPasien === 'Bayi' || kategoriPasien === 'Balita') {
        payloadPos2.lk = lk;
        if (kategoriPasien === 'Bayi') {
          payloadPos2.bb_lahir = bbLahir;
          payloadPos2.pb_lahir = pbLahir;
        } else {
          payloadPos2.skrining_gigi = { karies: jmlKaries };
        }
      } else {
        payloadPos2.lp = lp; payloadPos2.td = td; payloadPos2.lila = lila; payloadPos2.gds = isPuasa ? '' : gds; payloadPos2.gdp = isPuasa ? gdp : '';
        if (!isAnakSekolah(kategoriPasien)) {
          payloadPos2.asam_urat = asamUrat; payloadPos2.kolesterol = kolesterol;
          payloadPos2.riwayat_hipertensi = isHipertensi ? riwayatHipertensi : ''; payloadPos2.lama_diagnosis_hipertensi = (isHipertensi && riwayatHipertensi === 'Ya') ? lamaDiagnosisHipertensi : '';
          payloadPos2.riwayat_diabetes = isDiabetes ? riwayatDiabetes : ''; payloadPos2.lama_diagnosis_diabetes = (isDiabetes && riwayatDiabetes === 'Ya') ? lamaDiagnosisDiabetes : '';
        }
        payloadPos2.skrining_gigi = { goyang: gigiGoyang, lubang: gigiLubang, hilang: gigiHilang, periodontal: gigiPeriodontal };
      }

      let payloadPos3 = { disabilitas };
      let payloadPos4 = { keterangan: catatanAkhir };
      let payloadPos5 = {};
      let payloadPos6 = {};

      if (kategoriPasien === 'Bayi') {
        payloadPos3.bayi = { pjb1, pjb2, ikterus, kulit_tinja: kulitTinja, edukasi: edukasiBbl, hb0 };
      } else if (kategoriPasien === 'Balita') {
        payloadPos3.mata = { kanan: mataKanan, kiri: mataKiri }; payloadPos3.telinga = { serumen: telingaSerumen, infeksi: telingaInfeksi, daya_dengar: dayaDengar };
        payloadPos5.risiko_gula = { riwayat_keluarga: gulaRiwKeluarga, sering_lapar: gulaLapar, bb_turun: gulaTurunBb, sering_haus: gulaHaus };
        payloadPos3.imunisasi = { hep_0_24: imunHep, opv: imunOpv, pcv: imunPcv, dpt_hb_hib: imunDpt, bcg: imunBcg, rotavirus: imunRota, ipv: imunIpv, campak_rubella: imunCampak };
      } else if (isAnakSekolah(kategoriPasien)) {
        payloadPos3.mata = { kanan: mataKanan, kiri: mataKiri, visus, kacamata }; payloadPos3.telinga = { serumen: telingaSerumen, infeksi: telingaInfeksi, gg_pendengaran: telingaGgPendengaran };
        payloadPos5.risiko_gula = { riwayat_keluarga: gulaRiwKeluarga, sering_lapar: gulaLapar, bb_turun: gulaTurunBb, sering_haus: gulaHaus };
        payloadPos6.jiwa_sdq = { khawatir_gelisah: jiwaKhawatirAnak, sulit_kontrol: jiwaKontrolAnak, sulit_fokus: jiwaFokusAnak };

        payloadPos4.kulit = { kusta: kulitKusta, skabies: kulitSkabies, frambusia: kulitFrambusia };
        payloadPos4.hepatitis = { transfusi: hepTransfusi, hd: hepHd, riw_klg: hepKlg };
        payloadPos4.aktivitas_fisik = aktivitasFisik;
        payloadPos5.resiko_tb = { batuk: resTbBatuk === '>2Mg' ? 'Ya' : 'Tidak', kontak: resTbKontak === 'Erat' || resTbKontak === 'Riw' ? 'Ya' : 'Tidak' };
      } else if (kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') {
        payloadPos3.mata = { kanan: mataKanan, kiri: mataKiri, visus, pupil, kacamata }; payloadPos3.telinga = { serumen: telingaSerumen, infeksi: telingaInfeksi, gg_pendengaran: telingaGgPendengaran };

        payloadPos5.skrining_kanker = { ca_usus: caUsus, ca_lain: caLain };
        if (isPerempuan) {
          payloadPos5.skrining_kanker.ca_payudara = caPayudara; payloadPos5.skrining_kanker.ca_serviks = caServiks;
          payloadPos5.reproduksi_wanita = { sadanis, usg, iva, hpv_dna: hpvDna, hamil: kategoriPasien === 'Dewasa' ? hamil : 'Tidak' };
        }
        if (isUsiaKankerParu) payloadPos5.skrining_kanker_paru = kankerParu;

        if (kategoriPasien === 'Dewasa') {
          payloadPos6.jiwa_srq20 = { tdk_semangat: jiwaSrqSemangat, murung: jiwaSrqMurung, gugup: jiwaSrqGugup, khawatir: jiwaSrqKhawatir };
          payloadPos6.depresi_cemas = (jiwaSrqSemangat === 'Ya' || jiwaSrqMurung === 'Ya') ? 'Ya' : 'Tidak';
          payloadPos3.catin = { hiv: catinHiv, sifilis: catinSifilis, tt: catinTt };
        } else {
          payloadPos6.skilas = lansia;
          payloadPos6.depresi = (lansia.dep_sedih === 'Ya' || lansia.dep_minat_turun === 'Ya') ? 'Ya' : 'Tidak';
        }

        payloadPos4.kulit = { kusta: kulitKusta, skabies: kulitSkabies, frambusia: kulitFrambusia };
        payloadPos4.xray_tb = { bb_turun: xrayDewasaBb, demam: xrayDewasaDemam, keringat_malam: xrayDewasaKeringat };
        payloadPos4.hepatitis = { transfusi: hepTransfusi, hd: hepHd, riw_klg: hepKlg };
        payloadPos4.aktivitas_fisik = aktivitasFisik;

        payloadPos5.resiko_tb = { batuk: resTbBatuk === '>2Mg' ? 'Ya' : 'Tidak', kontak: resTbKontak === 'Erat' || resTbKontak === 'Riw' ? 'Ya' : 'Tidak', riw_tb_ppok: resTbRiwPpok };
        payloadPos5.merokok = { batuk_lama: rokokBatukLama, sesak: rokokSesak };
        payloadPos5.ppok = { nafas_pendek: ppokNafas, sulit_dahak: ppokDahak };
      }

      const visitDoc = createVisitDocRef();
      await createVisitWithRef(visitDoc, {
        jalur_pemeriksaan: "Kunjungan Rumah",
        nomor_antrian: nomorAntrianDtd,
        patientNIK: finalNik,
        patient_identity_key: identityKey,
        kategori_usia_satusehat: dataUmur.kategori,
        umur_saat_periksa: dataUmur.tahun,
        status_antrian: STATUS_MAPPING.SELESAI,
        waktu_ambil_tiket: nowTimestamp(),
        waktu_selesai_total: nowTimestamp(),
        pasien_snapshot: buildPatientSnapshot({
          nama: formData.nama,
          gender: formData.j_kelamin,
          birthDate: formData.tgl_lahir,
          desa: formData.desa,
          dusun: formData.dusun,
          alamat: alamatPasien,
          phone: kontakPasien,
          status: isBayiAtauAnak(dataUmur.kategori) ? '-' : formData.status_perkawinan
        }),
        petugas_pos1: namaPetugas, petugas_pos2: namaPetugas, petugas_pos3: namaPetugas, petugas_pos4: namaPetugas, petugas_pos5: namaPetugas, petugas_pos6: namaPetugas, petugas_pos7: namaPetugas,
        dokter_pemeriksa: namaPetugas,
        kesimpulan_dokter: catatanAkhir,
        ...(ocrMeta ? { ocrMeta } : {}),
        pos2: payloadPos2, pos3: payloadPos3, pos4: payloadPos4, pos5: payloadPos5, pos6: payloadPos6
      });
      await writeAuditLog({
        action: 'Input dan selesaikan CKG jalur Kunjungan Rumah',
        module: 'Kunjungan Rumah',
        visitId: visitDoc.id,
        patientKey: identityKey,
        after: {
          patientNIK: finalNik,
          patient_identity_key: identityKey,
          nomor_antrian: nomorAntrianDtd,
          status_antrian: STATUS_MAPPING.SELESAI,
          kategori_usia_satusehat: dataUmur.kategori
        }
      });

      setVisitId(visitDoc.id);
      setOcrMeta(null);
      setStep(5); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setPesan('âŒ Gagal sinkronisasi data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- OPENCV.JS EDGE DETECTION LOGIC ---
  const processVideoFrame = () => {
    if (!videoRef.current || !processCanvasRef.current || !window.cv || isCapturingRef.current) return;

    const video = videoRef.current;
    if (video.readyState !== 4) {
      scanRafRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const canvas = processCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const w = 400; const h = 300;
    canvas.width = w; canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);

    try {
      let src = window.cv.imread(canvas);
      let gray = new window.cv.Mat();
      window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY, 0);

      let blurred = new window.cv.Mat();
      window.cv.GaussianBlur(gray, blurred, new window.cv.Size(5, 5), 0, 0, window.cv.BORDER_DEFAULT);

      let edges = new window.cv.Mat();
      window.cv.Canny(blurred, edges, 75, 200);

      let contours = new window.cv.MatVector();
      let hierarchy = new window.cv.Mat();
      window.cv.findContours(edges, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);

      let isAligned = false;
      const minArea = (w * h) * 0.25;

      for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let area = window.cv.contourArea(cnt);
        if (area > minArea) {
          let peri = window.cv.arcLength(cnt, true);
          let approx = new window.cv.Mat();
          window.cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

          if (approx.rows === 4) {
             isAligned = true;
          }
          approx.delete();
        }
        cnt.delete();
      }

      src.delete(); gray.delete(); blurred.delete(); edges.delete(); contours.delete(); hierarchy.delete();

      if (isAligned) {
        alignCountRef.current += 1;
        if (alignCountRef.current > 5) setKameraStatus('aligned'); // Bingkai Hijau
        if (alignCountRef.current > 25) { // Stabil selama ~1 detik
           isCapturingRef.current = true;
           captureImage();
           return;
        }
      } else {
        alignCountRef.current = 0;
        setKameraStatus('ready');
      }

    } catch (err) {
      console.error("OpenCV Processing Error: ", err);
    }

    if (!isCapturingRef.current) {
      scanRafRef.current = requestAnimationFrame(processVideoFrame);
    }
  };

  const startCamera = async (mode = facingMode) => {
    if (!cvReady) {
      setPesan('Sistem pemindai identitas sedang dimuat. Mohon tunggu sebentar lalu coba lagi.');
      return;
    }
    setIsCameraOpen(true); setKameraStatus('focusing'); setIsTorchOn(false);
    alignCountRef.current = 0; isCapturingRef.current = false;

    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (scanRafRef.current) cancelAnimationFrame(scanRafRef.current);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 }, advanced: [{ focusMode: "continuous" }] } });
      if (videoRef.current) videoRef.current.srcObject = stream;

      setTimeout(() => {
        setKameraStatus('ready');
        scanRafRef.current = requestAnimationFrame(processVideoFrame);
      }, 1500);
    } catch (err) {
      setPesan('Aplikasi membutuhkan izin kamera untuk membaca KTP/KK. Silakan izinkan akses kamera di browser.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    isCapturingRef.current = true;
    if (scanRafRef.current) cancelAnimationFrame(scanRafRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        if (track.getCapabilities && track.getCapabilities().torch) {
            track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        }
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false); setKameraStatus('idle'); setIsTorchOn(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const toggleCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode); startCamera(newMode);
  };

  const toggleTorch = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const track = videoRef.current.srcObject.getVideoTracks()[0];
      try {
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !isTorchOn }]
          });
          setIsTorchOn(!isTorchOn);
        } else {
          alert("Kamera/Browser Anda tidak mendukung fitur senter WebRTC.");
        }
      } catch (error) {
        console.error("Gagal mengakses fitur senter:", error);
      }
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const vw = video.videoWidth; const vh = video.videoHeight;
      let cropWidth = vw * 0.85; let cropHeight = cropWidth / 1.58;
      if (cropHeight > vh) { cropHeight = vh * 0.85; cropWidth = cropHeight * 1.58; }
      const startX = (vw - cropWidth) / 2; const startY = (vh - cropHeight) / 2;

      canvas.width = cropWidth; canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      canvas.toBlob((blob) => {
        stopCamera(); processOCR(new File([blob], "ktp-scan.jpg", { type: "image/jpeg" }));
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileUpload = (e) => { if (e.target.files[0]) processOCR(e.target.files[0]); };

  const cancelOCR = () => {
    ocrJobRef.current += 1;
    setOcrLoading(false);
    setOcrProgress(0);
    setOcrMode('');
    setOcrCandidates([]);
    setOcrReview(null);
    setOcrMeta(null);
    setOcrDuplicateWarning('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyOcrData = (extractedData, source = 'OCR', target = 'auto') => {
    if (!extractedData?.nik && !extractedData?.nama) return false;

    const normalizedData = {
      ...extractedData,
      j_kelamin: extractedData.j_kelamin || 'P',
      status_perkawinan: extractedData.status_perkawinan || 'Belum Kawin'
    };
    const finalDesa = Object.keys(WILAYAH_KERJA).includes(normalizedData.desa) ? normalizedData.desa : 'Luar Wilayah';
    const finalDusun = WILAYAH_KERJA[finalDesa][0] || 'Lainnya';
    const validOcrNik = isSixteenDigitNik(normalizedData.nik) ? normalizedData.nik : '';
    const validOcrBirthDate = isValidIsoDate(normalizedData.tgl_lahir) ? normalizedData.tgl_lahir : '';
    let newTglView = '';
    if (validOcrBirthDate) {
      const parts = validOcrBirthDate.split('-');
      if (parts.length === 3) newTglView = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const shouldFillWali = target === 'wali' || (target === 'auto' && tanpaNik);
    if (shouldFillWali) {
      setFormData(prev => ({ ...prev, nik_wali: validOcrNik || prev.nik_wali, nama_wali: normalizedData.nama || prev.nama_wali, tgl_lahir_wali: validOcrBirthDate || prev.tgl_lahir_wali }));
      if (newTglView) setTglLahirWaliView(newTglView);
    } else {
      setFormData(prev => ({ ...prev, nik: validOcrNik || prev.nik, nama: normalizedData.nama || prev.nama, tgl_lahir: validOcrBirthDate || prev.tgl_lahir, j_kelamin: normalizedData.j_kelamin || prev.j_kelamin, status_perkawinan: normalizedData.status_perkawinan || prev.status_perkawinan, desa: finalDesa, dusun: finalDusun }));
      if (newTglView) setTglLahirView(newTglView);
      if (validOcrNik) setTanpaNik(false);
    }

    setOcrMeta({
      documentType: normalizedData.document_type || 'UNKNOWN',
      confidence: Math.round(Number(normalizedData.confidence || 0) * 100),
      usedAt: new Date().toISOString(),
      usedBy: user?.uid || user?.email || 'unknown',
      warnings: normalizedData.warnings || [],
      source
    });
    const confidence = normalizedData.confidence ? ` (${Math.round(normalizedData.confidence * 100)}%)` : '';
    const warningText = normalizedData.warnings?.length ? ` Ada ${normalizedData.warnings.length} warning OCR.` : '';
    setPesan(`âœ… Data ${normalizedData.document_type || 'identitas'} dibaca via ${source}${confidence}. Periksa ulang NIK dan nama.${warningText}`);
    return true;
  };

  const processOCR = async (fileAsli) => {
    const jobId = ocrJobRef.current + 1;
    ocrJobRef.current = jobId;
    const isCurrentJob = () => ocrJobRef.current === jobId;

    setOcrLoading(true); setPesan(''); setOcrProgress(0); setOcrCandidates([]); setOcrReview(null); setOcrMeta(null); setOcrDuplicateWarning(''); let extractedData = null;

    setOcrMode('Mempersiapkan foto KTP...');
    try {
      const ocrResult = await runIdentityOcr(fileAsli, {
        onProgress: (progress) => { if (isCurrentJob()) setOcrProgress(progress); },
        onMode: (mode) => { if (isCurrentJob()) setOcrMode(mode); },
        preferBackend: true
      });
      if (!isCurrentJob()) return;
      extractedData = toLegacyOcrFormData(ocrResult?.data || {});
      if (extractedData) extractedData.source = ocrResult.source;
    } catch (localError) {
      if (!isCurrentJob()) return;
      setPesan('âŒ Gagal membaca dokumen. Lensa terlalu buram.'); setOcrLoading(false); setOcrProgress(0); return;
    }

    if (!isCurrentJob()) return;
    if (extractedData?.nik || extractedData?.nama) {
      if (['Kartu Keluarga', 'KK'].includes(extractedData.document_type) && extractedData.candidates?.length > 1) {
        setOcrCandidates(extractedData.candidates.map(c => ({ ...c, confidence: extractedData.confidence })));
        setPesan(`âš ï¸ Kartu Keluarga terbaca. Pilih anggota keluarga yang sedang diperiksa agar NIK tidak tertukar.`);
      } else {
        setOcrReview(extractedData);
        setPesan('Review hasil OCR, lalu klik Gunakan Data Ini jika NIK dan nama sudah benar.');
      }
    } else {
      setPesan('âŒ KTP tidak terbaca. Harap input manual.');
    }
    setOcrLoading(false); setOcrProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentDomain = window.location.origin;
  const raporLink = visitId ? `${currentDomain}/rapor/${visitId}` : '';
  useEffect(() => {
    let isActive = true;
    if (!raporLink) {
      setQrCodeUrl('');
      return undefined;
    }

    createQrDataUrl(raporLink)
      .then((dataUrl) => {
        if (isActive) setQrCodeUrl(dataUrl);
      })
      .catch(() => {
        if (isActive) setQrCodeUrl('');
      });

    return () => {
      isActive = false;
    };
  }, [raporLink]);

  const handleKirimWA = () => {
    let phone = normalizeWhatsappNumber(formData.no_hp || formData.no_hp_wali);
    if (!phone) { alert("Nomor WhatsApp tidak diisi saat pendaftaran."); return; }
    if (!/^62\d{8,15}$/.test(phone)) { alert("Nomor WhatsApp tidak valid. Gunakan format nomor Indonesia yang aktif."); return; }
    const nama = formData.nama || ''; const jk = formData.j_kelamin || 'P'; let sapaan;
    if (umurPasien >= 19) { sapaan = jk === 'L' ? 'Bapak' : 'Ibu'; } else if (umurPasien >= 12) { sapaan = jk === 'L' ? 'Saudara' : 'Saudari'; } else { sapaan = 'Adik'; }
    const tglPeriksa = new Date(); const hariTanggal = tglPeriksa.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const text = `Halo ${sapaan} *${nama}*\n\nTerima kasih telah mengikuti Medical Check-Up (Kunjungan Rumah Door-to-Door) pada *${hariTanggal}* bersama Tim Puskesmas Malimpung.\n\nKesehatan Anda adalah prioritas kami.\nBerikut tautan untuk melihat *Laporan Rapor Kesehatan Digital* Anda secara lengkap:\n\n${raporLink}\n\nTetap jaga pola hidup sehat. Mencegah selalu lebih baik daripada mengobati.\n\nSalam hangat dan sehat selalu,\n*Tim Medis Cek Kesehatan Gratis Puskesmas Malimpung.*\n_"Dekat Melayani, Ikhlas Mengabdi"_`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintRapor = () => {
    const originalTitle = document.title;
    const safeName = (formData.nama || 'Anonim').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
    const tgl = new Date();
    document.title = `Rapor_DoorToDoor_${safeName}_${String(tgl.getDate()).padStart(2, '0')}_${String(tgl.getMonth() + 1).padStart(2, '0')}_${tgl.getFullYear()}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  const resetModul = () => { window.location.reload(); };

  // --- CALCULATION FOR RAPOR VIEW ---
  const imtData = hitungIMT(tb, bb);
  const tensiData = evalTensi(td);
  const gulaData = evalGula(gds, gdp);
  const tglString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const waktuString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const isGigiAman = gigiLubang === 'Tidak' && gigiGoyang === 'Tidak' && gigiHilang === 'Tidak';
  const statusGigi = kategoriPasien === 'Bayi' ? '-' : (isGigiAman ? 'Normal / Sehat' : 'Terdapat Masalah Gigi/Mulut');
  const statusMata = mataKanan === 'N' && mataKiri === 'N' ? 'Batas Normal' : 'Butuh Pemeriksaan Lanjut';
  const statusTelinga = telingaInfeksi === 'Tidak' && telingaGgPendengaran === 'Tidak' ? 'Batas Normal' : 'Terdapat Gangguan';
  let statusMental = 'Dalam Batas Normal';
  if (kategoriPasien === 'Lansia' && (lansia.dep_sedih === 'Ya' || lansia.kog_ingat_3_kata === 'Tidak')) statusMental = 'Indikasi Risiko Kognitif/Emosi';
  if (kategoriPasien === 'Dewasa' && (jiwaSrqSemangat === 'Ya' || jiwaSrqMurung === 'Ya')) statusMental = 'Indikasi Stres/Kecemasan';
  if (isAnakSekolah(kategoriPasien) && jiwaFokusAnak === 'Ya') statusMental = 'Perlu Pendampingan Fokus';
  const namaPetugas = user?.nama || 'Nakes Kunjungan';

  return (
    <div className="door-page pos-page-container space-y-4 max-w-4xl mx-auto pb-40 md:pb-10 bg-[#f8fafc] min-h-screen">

      {/* CSS PRINT MAGIS: Mengabaikan semua struktur aplikasi dan memaksa ukuran A4 Penuh */}
      <style type="text/css" media="print">{`
          @page { size: A4 portrait; margin: 0; }
          html, body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: 100% !important;
              overflow: hidden !important;
          }
          body * { visibility: hidden; }
          .rapor-print-area, .rapor-print-area * { visibility: visible; }
          .rapor-print-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100% !important;
              max-width: 100% !important;
              max-height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              transform: none !important;
              z-index: 9999 !important;
              display: flex !important;
              flex-direction: column !important;
          }
          .no-print { display: none !important; }
      `}</style>

      {/* HEADER STEPPER UI */}
      {step < 5 && (
        <div className="sticky top-0 z-40 bg-[#f8fafc] pb-2 no-print">
          <div className="bg-gradient-to-br from-blue-950 to-indigo-900 p-4 md:p-6 rounded-b-2xl shadow-lg border-b border-blue-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 md:p-2.5 rounded-xl border border-emerald-400 shadow-[0_4px_10px_rgba(16,185,129,0.4)] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 6V4.5C8 3.11929 9.11929 2 10.5 2H13.5C14.8807 2 16 3.11929 16 4.5V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="2" y="6" width="20" height="15" rx="3.5" fill="white" />
                    <path d="M12 10.5V16.5M9 13.5H15" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm md:text-lg drop-shadow-md">CKG - Kunjungan Rumah</h2>
                  <p className="text-emerald-400 font-bold text-[9px] md:text-[10px] tracking-widest uppercase opacity-90">Puskesmas Malimpung</p>
                </div>
              </div>
              <div className="bg-white/10 text-emerald-300 px-4 py-2 rounded-full border border-white/10 font-bold text-xs font-mono shadow-inner backdrop-blur-sm">Langkah {step}/4</div>
            </div>
            <div className="w-full h-2.5 bg-slate-900/50 rounded-full overflow-hidden shadow-inner border border-slate-700/30 relative z-10">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out relative" style={{ width: `${(step / 4) * 100}%` }}><div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div></div>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 md:px-0 mt-2 relative z-10">
        {pesan && step < 5 && <div className={`p-4 rounded-xl font-bold flex items-start gap-3 text-xs md:text-sm shadow-sm transition-all mb-4 no-print border ${pesan.includes('âŒ') || pesan.includes('âš ï¸') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}><span className="text-lg leading-none">{pesan.includes('âŒ') ? 'ðŸš«' : (pesan.includes('âš ï¸') ? 'âš ï¸' : 'âœ…')}</span><span className="leading-relaxed">{pesan.replace(/[âŒâš ï¸âœ…]/g, '')}</span></div>}

        {/* KAMERA SCANNER KTP UI */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-[9999] bg-black flex flex-col justify-center items-center no-print">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={processCanvasRef} className="hidden" />

            {facingMode === 'environment' && (
              <button onClick={toggleTorch} className={`absolute top-8 right-6 z-30 p-3.5 rounded-full backdrop-blur-md border transition-all active:scale-90 shadow-xl ${isTorchOn ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : 'bg-black/60 text-white border-white/20 hover:bg-black/80'}`}><span className="text-2xl leading-none block">ðŸ”¦</span></button>
            )}

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
              <div className={`w-[90%] max-w-sm aspect-[1.58/1] relative box-content ring-[9999px] ring-black/75 rounded-2xl overflow-hidden transition-all duration-300 ${kameraStatus === 'aligned' ? 'border-emerald-500 scale-105' : 'border-amber-400'}`}>
                <div className={`absolute inset-0 border-[3px] border-dashed rounded-2xl flex items-center justify-center transition-colors duration-300 ${kameraStatus === 'aligned' ? 'border-emerald-400 bg-emerald-500/20' : (kameraStatus === 'ready' ? 'border-amber-400 bg-amber-500/10' : 'border-slate-400 bg-black/10')}`}>
                  <div className="relative z-10 text-center bg-black/60 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-2xl">
                    <p className={`font-black tracking-widest uppercase text-xs md:text-sm drop-shadow-md transition-colors ${kameraStatus === 'aligned' ? 'text-emerald-400 animate-pulse' : (kameraStatus === 'ready' ? 'text-amber-400' : 'text-slate-300')}`}>
                      {kameraStatus === 'aligned' ? 'âœ… TAHAN POSISI...' : (kameraStatus === 'ready' ? 'Posisikan KTP ke Kotak' : 'Fokus Kamera...')}
                    </p>
                    <p className="text-white font-bold text-[9px] md:text-[10px] mt-1.5 opacity-80">
                      {kameraStatus === 'aligned' ? 'Otomatis memfoto...' : 'Pastikan garis batas pas'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[80px] md:bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-sm flex justify-between items-center bg-black/50 backdrop-blur-xl border border-white/10 px-6 py-5 rounded-[2rem] z-20 shadow-2xl">
              <button onClick={stopCamera} className="text-white flex flex-col items-center justify-center w-14 gap-1.5 hover:text-red-400 transition active:scale-90"><span className="text-2xl font-light leading-none">âœ•</span><span className="text-[9px] font-bold tracking-wider">BATAL</span></button>
              <button onClick={captureImage} className="w-20 h-20 rounded-full flex items-center justify-center border-4 bg-white/10 border-white active:scale-90 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all"><div className={`w-16 h-16 rounded-full shadow-inner ${kameraStatus === 'aligned' ? 'bg-emerald-400' : 'bg-white'}`}></div></button>
              <button onClick={toggleCamera} className="text-white flex flex-col items-center justify-center w-14 gap-1.5 hover:text-blue-400 transition active:scale-90"><span className="text-2xl leading-none">ðŸ”„</span><span className="text-[9px] font-bold tracking-wider">GANTI</span></button>
            </div>
          </div>
        )}

        {/* STEP 1: IDENTITAS */}
        {step === 1 && (
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] shadow-sm border border-slate-200 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
              <div><h3 className="text-lg md:text-xl font-black text-slate-800">1. Data Kependudukan</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sesuai KTP/KK Pasien</p></div>
              <div className="flex w-full md:w-auto gap-3">
                <button type="button" onClick={() => startCamera()} disabled={!cvReady} className={`flex-1 md:flex-none min-h-[50px] px-4 rounded-xl text-[11px] md:text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${cvReady ? 'bg-blue-950 hover:bg-blue-900 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>{cvReady ? 'ðŸ“· Scan KTP' : 'â³ Memuat Scanner...'}</button>
                <button type="button" onClick={() => fileInputRef.current.click()} className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 min-h-[50px] px-4 rounded-xl text-[11px] md:text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95">ðŸ“ Galeri</button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {ocrLoading && (
              <div className="mb-6 p-4 bg-emerald-600 text-white rounded-xl shadow-inner flex items-center gap-4 animate-pulse">
                <span className="text-2xl animate-spin">âš™ï¸</span>
                <div className="flex-1"><p className="font-bold text-xs md:text-sm leading-tight">{ocrMode}</p>{ocrProgress > 0 && <p className="text-[9px] opacity-80 uppercase tracking-widest mt-1">Memproses ({ocrProgress}%)</p>}</div>
                <button onClick={cancelOCR} className="bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-90">BATAL</button>
              </div>
            )}

            <OcrResultReview
              result={ocrReview}
              onUse={() => {
                if (applyOcrData(ocrReview, ocrReview?.source || 'OCR', 'patient')) setOcrReview(null);
              }}
              onCancel={() => setOcrReview(null)}
            />

            {ocrDuplicateWarning && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                {ocrDuplicateWarning}
              </div>
            )}

            {ocrCandidates.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3">Pilih Anggota dari Kartu Keluarga</p>
                <div className="grid gap-2">
                  {ocrCandidates.map((candidate, index) => (
                    <button
                      key={`${candidate.nik || 'nik'}-${index}`}
                      type="button"
                      onClick={() => { applyOcrData(candidate, 'OCR Kartu Keluarga', 'patient'); setOcrCandidates([]); setOcrReview(null); }}
                      className="w-full text-left bg-white hover:bg-amber-100 border border-amber-200 rounded-xl p-3 transition active:scale-[0.99]"
                    >
                      <span className="block text-sm font-black text-slate-800">{candidate.nama || 'Nama belum terbaca'}</span>
                      <span className="block text-[11px] font-bold text-slate-500 mt-1">NIK: {candidate.nik || '-'} â€¢ Lahir: {candidate.tgl_lahir || candidate.tanggalLahir || '-'}</span>
                      <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-amber-700">Confidence: {Math.round(Number(candidate.confidence || 0) * (Number(candidate.confidence || 0) <= 1 ? 100 : 1))}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5 md:gap-6">
              <div className="col-span-2">
                <InputCustom type="tel" label={isBayiAtauAnak(dataUmur.kategori) ? "NIK WALI (16 Digit) *" : "NIK PASIEN (16 Digit) *"} name="nik" value={formData.nik} onChange={handleChange} disabled={tanpaNik} placeholder={tanpaNik ? "Sistem akan membuat NIK sementara..." : "Ketik 16 Digit NIK..."} required={!tanpaNik} maxLength="16" />
                <label className="flex items-center space-x-3 mt-3 cursor-pointer bg-slate-50 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition shadow-sm w-full md:w-max active:scale-[0.98]">
                  <input type="checkbox" checked={tanpaNik} onChange={(e) => setTanpaNik(e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5" />
                  <div><span className="text-xs font-bold text-slate-800 block leading-tight">Pasien Belum Punya NIK</span><span className="text-[10px] text-slate-500 mt-0.5 block">Centang khusus untuk Bayi/Anak (Wajib Isi Data Wali)</span></div>
                </label>
              </div>

              <div className="col-span-2"><InputCustom label="Nama Lengkap *" name="nama" value={formData.nama} onChange={handleChange} required={true} placeholder="Sesuai identitas resmi..." /></div>

              {tanpaNik && (
                <div className="col-span-2 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 md:p-6 rounded-[1.5rem] border border-amber-200 space-y-5 shadow-sm mt-2 animate-fade-in-up">
                  <div className="border-b border-amber-200 pb-3 flex items-center gap-3"><span className="text-3xl bg-white p-2 rounded-xl shadow-sm border border-amber-100">ðŸ‘¨â€ðŸ‘©â€ðŸ‘§</span><div><h4 className="font-black text-amber-900 text-sm md:text-base">Data Wali Pendamping</h4><p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-0.5">Wajib untuk Integrasi SATUSEHAT</p></div></div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2 md:col-span-1"><InputCustom type="tel" label="NIK Wali (16 Digit) *" name="nik_wali" value={formData.nik_wali} onChange={handleChange} required={true} placeholder="Ketik 16 digit..." maxLength="16" /></div>
                    <div className="col-span-2 md:col-span-1"><InputCustom label="Nama Wali *" name="nama_wali" value={formData.nama_wali} onChange={handleChange} required={true} placeholder="Nama lengkap wali..." /></div>
                    <div className="col-span-1"><label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Tgl Lahir Wali *</label><input type="tel" inputMode="numeric" value={tglLahirWaliView} onChange={(e) => handleDateMaskChange(e, 'tgl_lahir_wali')} placeholder="DD/MM/YYYY" maxLength="10" required={true} className="w-full min-h-[48px] rounded-xl border-slate-200 shadow-sm p-3 border focus:border-emerald-500 bg-white font-bold text-base md:text-sm outline-none" /></div>
                    <div className="col-span-1"><label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Hubungan</label><select name="hubungan_wali" value={formData.hubungan_wali} onChange={handleChange} className="w-full min-h-[48px] rounded-xl border-slate-200 shadow-sm px-3 border focus:border-emerald-500 bg-white font-bold text-base md:text-sm text-slate-700 outline-none"><option value="Ayah">Ayah</option><option value="Ibu">Ibu</option><option value="Kakek-Nenek">Kakek/Nenek</option><option value="Lainnya">Lainnya</option></select></div>
                    <div className="col-span-2"><InputCustom label="No. WhatsApp Wali" name="no_hp_wali" value={formData.no_hp_wali} onChange={handleChange} type="tel" required={false} placeholder="08..." /></div>
                  </div>
                </div>
              )}

              <div className="col-span-2 bg-emerald-50/60 p-5 md:p-6 rounded-[1.5rem] border border-emerald-100 flex flex-col md:flex-row gap-5 items-center mt-2 shadow-sm">
                <div className="w-full md:w-1/2">
                  <label className="block text-[11px] font-black text-emerald-700 mb-2 uppercase tracking-widest">Tanggal Lahir *</label>
                  <input type="tel" inputMode="numeric" value={tglLahirView} onChange={(e) => handleDateMaskChange(e, 'tgl_lahir')} placeholder="DD/MM/YYYY" maxLength="10" required={true} className="w-full min-h-[52px] rounded-xl border-emerald-200 shadow-inner p-3 md:p-4 border focus:border-emerald-500 font-black text-emerald-800 text-xl text-center tracking-widest bg-white outline-none transition-all focus:scale-[1.02]" />
                </div>
                <div className="w-full md:w-1/2 md:border-l md:border-emerald-200 md:pl-6 flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center md:text-left">Klaster Usia Terdeteksi:</p>
                  {dataUmur.kategori !== '-' ? (
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <span className="text-3xl font-black text-slate-800 leading-none">{dataUmur.kategori}</span>
                      <span className="bg-white text-emerald-700 font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest border border-emerald-200 shadow-sm">{dataUmur.kategori === 'Bayi' ? `${dataUmur.totalBulan} Bulan` : `${dataUmur.tahun} Tahun`}</span>
                    </div>
                  ) : <span className="text-slate-400 font-bold text-sm md:text-base italic text-center md:text-left block">Menunggu input tanggal...</span>}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Jenis Kelamin</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1.5 min-h-[56px] shadow-inner">
                  <button type="button" onClick={() => setFormData({ ...formData, j_kelamin: 'L' })} className={`flex-1 text-[11px] md:text-xs font-black rounded-lg transition-all active:scale-95 ${formData.j_kelamin === 'L' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>ðŸ‘¨ LAKI-LAKI</button>
                  <button type="button" onClick={() => setFormData({ ...formData, j_kelamin: 'P' })} className={`flex-1 text-[11px] md:text-xs font-black rounded-lg transition-all active:scale-95 ${formData.j_kelamin === 'P' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>ðŸ‘© PEREMPUAN</button>
                </div>
              </div>

              {!isBayiAtauAnak(dataUmur.kategori) && (
                <div className="col-span-2 md:col-span-1"><label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Status Perkawinan</label><select name="status_perkawinan" value={formData.status_perkawinan} onChange={handleChange} className="w-full min-h-[48px] rounded-xl border-slate-200 shadow-sm px-3 border focus:border-emerald-500 bg-white font-bold text-base md:text-sm text-slate-700 cursor-pointer outline-none"><option value="Belum Kawin">Belum Kawin</option><option value="Kawin">Kawin</option><option value="Cerai Hidup">Cerai Hidup</option><option value="Cerai Mati">Cerai Mati</option></select></div>
              )}
              <div className="col-span-2 md:col-span-1"><InputCustom label="No. HP / WhatsApp" name="no_hp" value={formData.no_hp} onChange={handleChange} type="tel" placeholder="08..." /></div>

              <div className="col-span-2 grid grid-cols-2 gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-2 shadow-inner">
                <div className="col-span-2 md:col-span-1"><label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Desa/Kelurahan</label><select name="desa" value={formData.desa} onChange={handleChange} className="w-full min-h-[48px] rounded-xl border-slate-200 px-3 border focus:border-emerald-500 bg-white font-bold text-base md:text-sm text-slate-700 outline-none cursor-pointer shadow-sm">{Object.keys(WILAYAH_KERJA).map(desa => (<option key={desa} value={desa}>{desa}</option>))}</select></div>
                <div className="col-span-2 md:col-span-1"><label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Dusun/Lingkungan</label><select name="dusun" value={formData.dusun} onChange={handleChange} className="w-full min-h-[48px] rounded-xl border-slate-200 px-3 border focus:border-emerald-500 bg-white font-bold text-base md:text-sm text-slate-700 outline-none cursor-pointer shadow-sm">{WILAYAH_KERJA[formData.desa]?.map(dusun => (<option key={dusun} value={dusun}>{dusun}</option>))}</select></div>
              </div>
            </div>

            <div className="workflow-action-bar door-action-bar form-action-row no-print">
              <div className="contents">
                <button type="button" onClick={handleBackToMenu} className="secondary-action w-full">â€¹ Menu</button>
                <button type="button" onClick={handleNextStep} className="primary-action w-full">Lanjut Ke-2 â€º</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ANTROPOMETRI & LAB */}
        {step === 2 && (
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] shadow-sm border border-slate-200 animate-fade-in-up">
            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6 border-b border-slate-100 pb-5 flex items-center gap-3"><span className="text-2xl bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shadow-sm">ðŸ”¬</span> 2. Antropometri & Lab</h3>
            <div className="space-y-8">
              <div>
                <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm md:text-base border-l-4 border-indigo-500 pl-3">Pengukuran Dasar</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <InputCustom type="tel" label="Tinggi/Panjang" hint="Dalam cm" value={tb} onChange={(e) => setTb(e.target.value)} placeholder="Msl: 165" />
                  <InputCustom type="tel" label="Berat Badan" hint="Dalam kg" value={bb} onChange={(e) => setBb(e.target.value)} placeholder="Msl: 60" />

                  {kategoriPasien === 'Bayi' && (
                    <>
                      <InputCustom type="tel" label="Berat Lahir" hint="Gram" value={bbLahir} onChange={(e) => setBbLahir(e.target.value)} placeholder="Msl: 3000" />
                      <InputCustom type="tel" label="Panjang Lahir" hint="cm" value={pbLahir} onChange={(e) => setPbLahir(e.target.value)} placeholder="Msl: 50" />
                    </>
                  )}

                  {(kategoriPasien === 'Bayi' || kategoriPasien === 'Balita') && <InputCustom type="tel" label="Lingkar Kepala" hint="cm" value={lk} onChange={(e) => setLk(e.target.value)} />}
                  {(kategoriPasien !== 'Bayi' && kategoriPasien !== 'Balita') && (<><InputCustom type="tel" label="Lingkar Perut" hint="cm" value={lp} onChange={(e) => setLp(e.target.value)} /><InputCustom type="tel" label="LILA" hint="Ling. Lengan (cm)" value={lila} onChange={(e) => setLila(e.target.value)} /></>)}
                </div>
                {hitungIMT(tb, bb).nilai !== '-' && (
                  <div className="mt-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex items-center justify-between shadow-lg border border-slate-700">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IMT Terhitung</p><span className="text-4xl font-black font-mono tracking-tighter drop-shadow-md">{hitungIMT(tb, bb).nilai}</span></div>
                    <span className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase bg-white shadow-sm ${hitungIMT(tb, bb).color}`}>{hitungIMT(tb, bb).status}</span>
                  </div>
                )}
              </div>

              {(kategoriPasien !== 'Bayi' && kategoriPasien !== 'Balita') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-orange-50/50 to-amber-50/50 p-5 md:p-6 rounded-[1.5rem] border border-orange-100 shadow-sm">
                  <div className="space-y-5">
                    <InputCustom type="tel" label="Tekanan Darah (Sis/Dia)" hint="Format: 120/80" value={td} onChange={(e) => handleTensiChange(e.target.value)} placeholder="Msl: 120/80" />
                    {isHipertensi && (
                      <div className="bg-white p-5 rounded-2xl border border-rose-200 space-y-5 shadow-sm animate-fade-in-up">
                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-2"><span className="text-base bg-rose-100 rounded-md p-1">âš ï¸</span> Tindak Lanjut Hipertensi</p>
                        <TogglePill label="Didiagnosis Hipertensi oleh dokter?" value={riwayatHipertensi} onChange={setRiwayatHipertensi} colorClass="bg-rose-500" />
                        {riwayatHipertensi === 'Ya' && (
                          <div className="pt-2"><label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">Lama Diagnosis (Bulan) *</label><input type="tel" inputMode="numeric" required value={lamaDiagnosisHipertensi} onChange={e => setLamaDiagnosisHipertensi(e.target.value)} placeholder="Msl: 12" className="w-full min-h-[48px] p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-base shadow-inner" /></div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-5">
                    <div className="bg-white border border-orange-200 p-5 rounded-[1.5rem] shadow-sm">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4"><span className="text-[11px] font-black uppercase text-orange-800 tracking-widest">Gula Darah</span><div className="flex gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto"><button type="button" onClick={() => setIsPuasa(false)} className={`flex-1 md:flex-none px-4 py-2.5 text-[10px] font-black rounded-lg transition-colors active:scale-95 ${!isPuasa ? 'bg-white shadow-sm text-orange-700' : 'text-slate-400'}`}>SEWAKTU</button><button type="button" onClick={() => setIsPuasa(true)} className={`flex-1 md:flex-none px-4 py-2.5 text-[10px] font-black rounded-lg transition-colors active:scale-95 ${isPuasa ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400'}`}>PUASA</button></div></div>
                      <div className="relative"><input type="tel" inputMode="numeric" value={isPuasa ? gdp : gds} onChange={e => isPuasa ? setGdp(e.target.value) : setGds(e.target.value)} className="w-full min-h-[56px] p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-2xl font-black text-center text-orange-600 outline-none focus:ring-2 focus:ring-orange-400 shadow-inner" placeholder="0" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] tracking-widest">mg/dL</span></div>
                    </div>
                    {isDiabetes && (
                      <div className="bg-white p-5 rounded-2xl border border-rose-200 space-y-5 shadow-sm animate-fade-in-up">
                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-2"><span className="text-base bg-rose-100 rounded-md p-1">âš ï¸</span> Tindak Lanjut Gula Tinggi</p>
                        <TogglePill label="Didiagnosis Diabetes oleh dokter?" value={riwayatDiabetes} onChange={setRiwayatDiabetes} colorClass="bg-rose-500" />
                        {riwayatDiabetes === 'Ya' && (
                          <div className="pt-2"><label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">Lama Diagnosis (Bulan) *</label><input type="tel" inputMode="numeric" required value={lamaDiagnosisDiabetes} onChange={e => setLamaDiagnosisDiabetes(e.target.value)} placeholder="Msl: 36" className="w-full min-h-[48px] p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-base shadow-inner" /></div>
                        )}
                      </div>
                    )}
                    {(!isAnakSekolah(kategoriPasien)) && (<div className="grid grid-cols-2 gap-5 border-t border-orange-200/50 pt-5 mt-2"><InputCustom type="tel" label="Kolesterol" value={kolesterol} onChange={(e) => setKolesterol(e.target.value)} placeholder="mg/dL" /><InputCustom type="tel" label="Asam Urat" value={asamUrat} onChange={(e) => setAsamUrat(e.target.value)} placeholder="mg/dL" /></div>)}
                  </div>
                </div>
              )}

              {kategoriPasien !== 'Bayi' && (
                <div>
                  <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 text-sm md:text-base border-l-4 border-indigo-500 pl-3">Kesehatan Gigi</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {kategoriPasien === 'Balita' ? (<InputCustom type="tel" label="Jml Karies" value={jmlKaries} onChange={(e) => setJmlKaries(e.target.value)} placeholder="Jumlah..." />) : (<><TogglePill label="Goyang" value={gigiGoyang} onChange={setGigiGoyang} /><TogglePill label="Berlubang" value={gigiLubang} onChange={setGigiLubang} /><TogglePill label="Hilang" value={gigiHilang} onChange={setGigiHilang} />{(!isAnakSekolah(kategoriPasien)) && <TogglePill label="Periodontal" value={gigiPeriodontal} onChange={setGigiPeriodontal} />}</>)}
                  </div>
                </div>
              )}
            </div>

            <div className="workflow-action-bar door-action-bar form-action-row no-print">
              <div className="contents">
                <button type="button" onClick={handlePrevStep} className="secondary-action w-full">â€¹ Kembali Ke-1</button>
                <button type="button" onClick={handleNextStep} className="primary-action w-full">Lanjut Ke-3 â€º</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PEMERIKSAAN KLINIS */}
        {step === 3 && (
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] shadow-sm border border-slate-200 animate-fade-in-up">
            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6 border-b border-slate-100 pb-5 flex items-center gap-3"><span className="text-2xl bg-rose-100 p-2.5 rounded-xl text-rose-600 shadow-sm">ðŸ©º</span> 3. Pemeriksaan Klinis</h3>
            <div className="space-y-8">

              {kategoriPasien === 'Bayi' && (
                <div className="bg-gradient-to-br from-sky-50 to-white p-5 md:p-6 rounded-[1.5rem] border border-sky-100 shadow-sm">
                  <h4 className="font-black text-sky-900 mb-5 border-b border-sky-100 pb-3 flex items-center gap-3 text-sm md:text-base"><span className="text-2xl bg-sky-200 p-2 rounded-xl">ðŸ‘¶</span> Bayi Baru Lahir (BBL)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <TogglePill label="PJB 1 (Tangan Kanan)" hint="Saturasi <90%?" value={pjb1} onChange={setPjb1} opt1="Negatif" opt2="Positif" />
                    <TogglePill label="PJB 2 (Kaki)" hint="Saturasi kaki <90%?" value={pjb2} onChange={setPjb2} opt1="Negatif" opt2="Positif" />
                    <div><label className="block text-[11px] md:text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Ikterus (Kramer)</label><p className="text-[10px] text-slate-500 mb-2">Derajat 1-5.</p><input type="number" inputMode="numeric" min="0" max="5" value={ikterus} onChange={e => setIkterus(e.target.value)} className="w-full min-h-[52px] p-3 bg-white border border-slate-200 rounded-xl font-bold text-base outline-none focus:ring-2 focus:ring-sky-500 shadow-sm" placeholder="Msl: 2" /></div>
                    <TogglePill label="Warna Kulit & Tinja" hint="Abnormal?" value={kulitTinja} onChange={setKulitTinja} opt1="Normal" opt2="Pucat" />
                    <TogglePill label="Edukasi BBL" hint="Diberikan ke ibu?" value={edukasiBbl} onChange={setEdukasiBbl} colorClass="bg-sky-600" />
                    <TogglePill label="Imunisasi HB0" hint="<24 jam lahir?" value={hb0} onChange={setHb0} colorClass="bg-sky-600" />
                  </div>
                </div>
              )}

              {kategoriPasien !== 'Bayi' && (
                <div>
                  <h4 className="font-black text-slate-700 mb-5 border-b border-slate-100 pb-3 flex items-center gap-3 text-sm md:text-base"><span className="text-2xl bg-slate-100 p-2 rounded-xl shadow-sm">ðŸ‘ï¸</span> Skrining Indera</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
                    <SelectCustom label="Mata Kanan" hint="Pemeriksaan luar." value={mataKanan} onChange={setMataKanan} options={['N', 'Curiga']} />
                    <SelectCustom label="Mata Kiri" hint="Pemeriksaan luar." value={mataKiri} onChange={setMataKiri} options={['N', 'Curiga']} />
                    {(isAnakSekolah(kategoriPasien) || kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') && (
                      <><div className="col-span-2 md:col-span-1"><label className="block text-[11px] md:text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Visus</label><p className="text-[10px] text-slate-500 mb-2">Snellen Chart.</p><input type="text" value={visus} onChange={e => setVisus(e.target.value)} className="w-full min-h-[48px] p-3 bg-white border border-slate-200 rounded-xl font-bold text-base shadow-sm outline-none focus:ring-2 focus:ring-rose-500" placeholder="Msl: 6/6" /></div>
                        <div className="col-span-2 md:col-span-1"><TogglePill label="Pakai Kacamata?" hint="Pasien rabun?" value={kacamata} onChange={setKacamata} colorClass="bg-slate-600" /></div></>
                    )}
                    {(kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') && (<div className="col-span-2 md:col-span-4"><label className="block text-[11px] md:text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Kondisi Pupil</label><input type="text" value={pupil} onChange={e => setPupil(e.target.value)} className="w-full min-h-[48px] p-3 bg-white border border-slate-200 rounded-xl font-bold text-base shadow-sm outline-none" placeholder="Keterangan reflek cahaya..." /></div>)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-gradient-to-br from-amber-50 to-white p-5 rounded-[1.5rem] border border-amber-100 shadow-sm">
                    <TogglePill label="Serumen" hint="Kotoran tebal?" value={telingaSerumen} onChange={setTelingaSerumen} colorClass="bg-amber-600" />
                    <TogglePill label="Infeksi / Cairan" hint="Telinga bernanah?" value={telingaInfeksi} onChange={setTelingaInfeksi} colorClass="bg-amber-600" />
                    {(isAnakSekolah(kategoriPasien) || kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') && (<TogglePill label="Gg. Pendengaran" hint="Tes bisik gagal?" value={telingaGgPendengaran} onChange={setTelingaGgPendengaran} colorClass="bg-amber-600" />)}
                    {kategoriPasien === 'Balita' && (<SelectCustom label="Tes Daya Dengar" hint="Respons suara." value={dayaDengar} onChange={setDayaDengar} options={['Sesuai', 'Tidak Sesuai']} />)}
                  </div>
                </div>
              )}

              {(kategoriPasien === 'Balita' || isAnakSekolah(kategoriPasien)) && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-orange-100 p-2 rounded-xl shadow-sm">ðŸ­</span> Risiko Gula Darah Anak</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <TogglePill label="Riw Gula Klg" hint="Keturunan DM?" value={gulaRiwKeluarga} onChange={setGulaRiwKeluarga} colorClass="bg-orange-500" />
                      <TogglePill label="Sering Lapar" hint="Banyak makan?" value={gulaLapar} onChange={setGulaLapar} colorClass="bg-orange-500" />
                      <TogglePill label="BB Turun Drastis" hint="Tanpa sebab?" value={gulaTurunBb} onChange={setGulaTurunBb} colorClass="bg-orange-500" />
                      <TogglePill label="Sering Haus" hint="Sering ngompol?" value={gulaHaus} onChange={setGulaHaus} colorClass="bg-orange-500" />
                    </div>
                  </div>
                  {kategoriPasien === 'Balita' && (
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-[1.5rem] border border-emerald-100 shadow-sm">
                      <h4 className="font-black text-emerald-900 mb-5 border-b pb-3 flex items-center gap-3">
   <span className="text-2xl bg-emerald-200 p-2 rounded-xl shadow-sm">ðŸ’‰</span> Imunisasi Dasar
</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 shadow-sm min-h-[56px] active:scale-95 transition-all"><input type="checkbox" checked={imunHep} onChange={e => setImunHep(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs font-bold text-slate-700">Hep &lt;24 Bln</span></label>
                        <label className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 shadow-sm min-h-[56px] active:scale-95 transition-all"><input type="checkbox" checked={imunOpv} onChange={e => setImunOpv(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs font-bold text-slate-700">Polio (OPV)</span></label>
                        <label className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 shadow-sm min-h-[56px] active:scale-95 transition-all"><input type="checkbox" checked={imunPcv} onChange={e => setImunPcv(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs font-bold text-slate-700">PCV</span></label>
                        <label className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 shadow-sm min-h-[56px] active:scale-95 transition-all"><input type="checkbox" checked={imunDpt} onChange={e => setImunDpt(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs font-bold text-slate-700">DPT-HB-Hib</span></label>
                        <label className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 shadow-sm min-h-[56px] active:scale-95 transition-all"><input type="checkbox" checked={imunBcg} onChange={e => setImunBcg(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs font-bold text-slate-700">BCG &lt;1 Bln</span></label>
                        <label className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 shadow-sm min-h-[56px] active:scale-95 transition-all"><input type="checkbox" checked={imunRota} onChange={e => setImunRota(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs font-bold text-slate-700">Rotavirus</span></label>
                        <label className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 shadow-sm min-h-[56px] active:scale-95 transition-all"><input type="checkbox" checked={imunIpv} onChange={e => setImunIpv(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs font-bold text-slate-700">Polio (IPV)</span></label>
                        <label className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-emerald-50 shadow-sm min-h-[56px] active:scale-95 transition-all"><input type="checkbox" checked={imunCampak} onChange={e => setImunCampak(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs font-bold text-slate-700">Campak-Rubella</span></label>
                      </div>
                    </div>
                  )}
                  {isAnakSekolah(kategoriPasien) && (
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-[1.5rem] border border-indigo-100 shadow-sm">
                      <h4 className="font-black text-indigo-900 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-indigo-200 p-2 rounded-xl shadow-sm">ðŸ§ </span> Skrining Jiwa SDQ</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <TogglePill label="Sering Khawatir" hint="Gelisah/takut?" value={jiwaKhawatirAnak} onChange={setJiwaKhawatirAnak} colorClass="bg-indigo-600" />
                        <TogglePill label="Sulit Kontrol Diri" hint="Sering tantrum/marah?" value={jiwaKontrolAnak} onChange={setJiwaKontrolAnak} colorClass="bg-indigo-600" />
                        <TogglePill label="Sulit Fokus" hint="Gampang teralihkan?" value={jiwaFokusAnak} onChange={setJiwaFokusAnak} colorClass="bg-indigo-600" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {kategoriPasien === 'Dewasa' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-[1.5rem] border border-indigo-100 shadow-sm">
                    <h4 className="font-black text-indigo-900 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-indigo-200 p-2 rounded-xl shadow-sm">ðŸ§ </span> Skrining Jiwa SRQ-20</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <TogglePill label="Tdk Semangat" hint="Sering merasa lelah?" value={jiwaSrqSemangat} onChange={setJiwaSrqSemangat} colorClass="bg-indigo-600" />
                      <TogglePill label="Sering Murung" hint="Merasa sedih/menangis?" value={jiwaSrqMurung} onChange={setJiwaSrqMurung} colorClass="bg-indigo-600" />
                      <TogglePill label="Sering Gugup" hint="Tegang/cemas?" value={jiwaSrqGugup} onChange={setJiwaSrqGugup} colorClass="bg-indigo-600" />
                      <TogglePill label="Sering Khawatir" hint="Takut hal buruk?" value={jiwaSrqKhawatir} onChange={setJiwaSrqKhawatir} colorClass="bg-indigo-600" />
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-white p-2 rounded-xl shadow-sm">ðŸ’</span> Skrining CATIN</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <TogglePill label="HIV" hint="Tes reaktif?" value={catinHiv} onChange={setCatinHiv} colorClass="bg-slate-700" />
                      <TogglePill label="Sifilis" hint="Tes reaktif?" value={catinSifilis} onChange={setCatinSifilis} colorClass="bg-slate-700" />
                      <TogglePill label="Tetanus (TT)" hint="Sudah vaksin TT?" value={catinTt} onChange={setCatinTt} colorClass="bg-slate-700" />
                    </div>
                  </div>
                </div>
              )}

              {(kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-md">
                    <h4 className="font-black text-slate-800 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-amber-100 p-2 rounded-xl shadow-sm">ðŸŽ—ï¸</span> Risiko Kanker Umum</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <TogglePill label="Ca Usus" hint="Riw. BAB darah" value={caUsus} onChange={setCaUsus} colorClass="bg-amber-500" />
                      <TogglePill label="Ca Lainnya" hint="Riw. kanker lainnya" value={caLain} onChange={setCaLain} colorClass="bg-amber-500" />
                    </div>
                  </div>
                  {isPerempuan && (
                    <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-[1.5rem] border border-pink-100 shadow-md">
                      <h4 className="font-black text-pink-900 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-pink-200 p-2 rounded-xl shadow-sm">ðŸ‘©â€âš•ï¸</span> Kanker Wanita</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <TogglePill label="Ca Payudara" hint="Benjolan/keturunan" value={caPayudara} onChange={setCaPayudara} colorClass="bg-pink-600" />
                        <TogglePill label="Ca Serviks" hint="Pendarahan" value={caServiks} onChange={setCaServiks} colorClass="bg-pink-600" />
                        {kategoriPasien === 'Dewasa' && <TogglePill label="Sedang Hamil?" hint="Pasien mengandung?" value={hamil} onChange={setHamil} colorClass="bg-pink-600" />}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <SelectCustom label="SADANIS" hint="Periksa Payudara" value={sadanis} onChange={setSadanis} options={['Tidak Diperiksa', 'Normal', 'Curiga']} />
                        <SelectCustom label="Tes IVA" hint="Asam Asetat" value={iva} onChange={setIva} options={['Tidak Diperiksa', 'Negatif', 'Positif']} />
                        <SelectCustom label="HPV-DNA" hint="Virus HPV" value={hpvDna} onChange={setHpvDna} options={['Tidak Diperiksa', 'Negatif', 'Positif']} />
                        <div><label className="block text-[11px] md:text-xs font-bold text-pink-700 uppercase tracking-widest mb-1">Hasil USG</label><p className="text-[10px] text-pink-500 leading-tight mb-2">Jika ada.</p><input type="text" value={usg} onChange={e => setUsg(e.target.value)} className="w-full min-h-[48px] p-3 bg-white border border-pink-200 rounded-xl font-bold text-base shadow-sm outline-none focus:ring-2 focus:ring-pink-500" /></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isUsiaKankerParu && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 md:p-6 rounded-[1.5rem] border border-slate-700 shadow-xl mt-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <h4 className="relative z-10 font-black text-white mb-6 border-b border-slate-600 pb-4 flex items-center gap-3 text-sm md:text-base"><span className="text-2xl bg-slate-800 p-2.5 rounded-xl border border-slate-600 shadow-inner">ðŸš¬</span> Skrining Kanker Paru (Usia 45+)</h4>
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectCustom darkTheme label="Riwayat Kanker" value={kankerParu.riwayat_kanker} onChange={v => setKankerParu({...kankerParu, riwayat_kanker: v})} options={['Tidak pernah didiagnosis menderita kanker', 'Pernah didiagnosis menderita kanker']} />
                    <SelectCustom darkTheme label="Riwayat Keluarga" value={kankerParu.riwayat_keluarga} onChange={v => setKankerParu({...kankerParu, riwayat_keluarga: v})} options={['Tidak ada keluarga yang terdiagnosis kanker', 'Ada keluarga terdiagnosis kanker']} />
                    <SelectCustom darkTheme label="Riwayat Merokok" value={kankerParu.riwayat_merokok} onChange={v => setKankerParu({...kankerParu, riwayat_merokok: v})} options={['Tidak pernah merokok', 'Mantan perokok (berhenti > 1 tahun)', 'Perokok aktif (dalam 1 tahun ini masih merokok)']} />

                    {kankerParu.riwayat_merokok !== 'Tidak pernah merokok' && (
                      <div className="col-span-1 md:col-span-2">
                          <InputCustom type="tel" label="Jumlah Bungkus Tahun (IB)" hint="Rumus: (Jml rokok/hari x Lama merokok dlm tahun) / 20" value={kankerParu.jml_bungkus_tahun} onChange={e => setKankerParu({...kankerParu, jml_bungkus_tahun: e.target.value})} placeholder="Msl: 400" />
                      </div>
                    )}

                    <SelectCustom darkTheme label="Paparan Karsinogenik" value={kankerParu.riwayat_karsinogenik} onChange={v => setKankerParu({...kankerParu, riwayat_karsinogenik: v})} options={['Tidak tempat kerja mengandung zat karsinogenik', 'Ada tempat kerja mengandung zat karsinogenik']} />
                    <SelectCustom darkTheme label="Lingkungan Berisiko" value={kankerParu.lingkungan_tinggi} onChange={v => setKankerParu({...kankerParu, lingkungan_tinggi: v})} options={['Tidak memiliki tempat tinggal berpotensi tinggi', 'Memiliki tempat tinggal berpotensi tinggi']} />
                    <SelectCustom darkTheme label="Lingkungan Dalam Rumah" value={kankerParu.lingkungan_rumah} onChange={v => setKankerParu({...kankerParu, lingkungan_rumah: v})} options={['Memiliki lingkungan dalam rumah yang sehat', 'Tidak memiliki lingkungan dalam rumah yang sehat']} />
                    <SelectCustom darkTheme label="Penyakit Paru Kronik" value={kankerParu.penyakit_paru} onChange={v => setKankerParu({...kankerParu, penyakit_paru: v})} options={['Tidak pernah didiagnosis penyakit paru kronik', 'Pernah didiagnosis penyakit paru kronik']} />
                    <SelectCustom darkTheme label="Hasil Foto Torax" value={kankerParu.foto_torax} onChange={v => setKankerParu({...kankerParu, foto_torax: v})} options={['Normal', 'Abnormal']} />
                  </div>
                </div>
              )}

              {kategoriPasien === 'Lansia' && (
                <div className="space-y-6 mt-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-[1.5rem] border border-indigo-100 shadow-sm">
                    <h4 className="font-black text-indigo-900 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-indigo-200 p-2 rounded-xl shadow-sm">ðŸ§ </span> 1. Penurunan Kognitif</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <TogglePill label="Mengingat 3 kata?" hint="Bunga, pintu, nasi." value={lansia.kog_ingat_3_kata} onChange={v => handleLansia('kog_ingat_3_kata', v)} colorClass="bg-indigo-600" />
                      <SelectCustom label="Orientasi Waktu/Tempat" hint="Tgl/Bulan/Tahun." value={lansia.kog_orientasi} onChange={v => handleLansia('kog_orientasi', v)} options={['Benar semua', 'Salah satu/Dua', 'Tidak Tahu']} />
                      <TogglePill label="Ulangi 3 kata lagi?" hint="Ingat kata tadi?" value={lansia.kog_ingat_kembali} onChange={v => handleLansia('kog_ingat_kembali', v)} colorClass="bg-indigo-600" />
                    </div>
                  </div>

                  {showMiniCog && (
                    <div className="bg-indigo-100 p-5 rounded-[1.5rem] border-2 border-dashed border-indigo-400 animate-fade-in-up shadow-inner">
                      <h4 className="font-black text-indigo-900 mb-4 border-b border-indigo-200 pb-3">âš ï¸ Tindak Lanjut Kognitif (Mini Cog)</h4>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-indigo-200/50 p-4 rounded-xl mb-5 border border-indigo-300 gap-4">
                        <p className="text-xs font-bold text-indigo-900">Instruksi: Minta pasien menggambar jam angka lengkap di pukul 11:10.</p>
                        <div className={`flex items-center gap-2 font-mono font-black text-2xl px-5 py-2.5 rounded-xl border-2 shadow-sm ${timeLeft <= 30 ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-white text-indigo-700 border-indigo-200'}`}>
                          <span>â±ï¸</span> {formatTime(timeLeft)}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <TogglePill label="Hasil Gambar Jam" hint="Posisi benar/salah?" value={lansia.minicog_jam} onChange={v => handleLansia('minicog_jam', v)} opt1="Salah" opt2="Benar" colorClass="bg-indigo-600" />
                        <SelectCustom label="Mengulang 3 Kata" hint="Setelah menggambar." value={lansia.minicog_ingat} onChange={v => handleLansia('minicog_ingat', v)} options={['Benar semua kata', 'Benar 2 Kata', 'Benar 1 kata', 'Tidak dapat mengingat/mengulang kata']} />
                      </div>
                      {timeLeft === 0 && lansia.minicog_jam === 'Salah' && (<p className="text-xs font-bold text-red-600 mt-4 flex gap-2 items-center bg-red-100 p-4 rounded-xl border border-red-200"><span className="text-xl">âš ï¸</span> Waktu habis (3 Menit). Hasil dikunci "Salah".</p>)}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-orange-50 p-5 rounded-[1.5rem] border border-orange-100 shadow-sm">
                      <h4 className="font-black text-orange-900 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-orange-200 p-2 rounded-xl shadow-sm">ðŸ¦¿</span> 2. Mobilisasi</h4>
                      <TogglePill label="Berdiri dari kursi" hint="5x dlm 14 dtk tanpa tangan?" value={lansia.mob_berdiri_kursi} onChange={v => handleLansia('mob_berdiri_kursi', v)} colorClass="bg-orange-600" />
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-[1.5rem] border border-emerald-100 shadow-sm">
                      <h4 className="font-black text-emerald-900 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-emerald-200 p-2 rounded-xl shadow-sm">âš–ï¸</span> 3. Malnutrisi</h4>
                      <div className="space-y-5">
                        <TogglePill label="BB turun >3 kg?" hint="Dlm 3 bln / baju melonggar?" value={lansia.gizi_bb_turun} onChange={v => handleLansia('gizi_bb_turun', v)} colorClass="bg-emerald-600" />
                        <TogglePill label="Hilang nafsu makan?" hint="Atau sulit menelan?" value={lansia.gizi_nafsu_makan} onChange={v => handleLansia('gizi_nafsu_makan', v)} colorClass="bg-emerald-600" />
                        <TogglePill label="LILA < 21 cm?" hint="Lingkar lengan kecil?" value={lansia.gizi_lila_kurang} onChange={v => handleLansia('gizi_lila_kurang', v)} colorClass="bg-emerald-600" />
                      </div>
                    </div>
                  </div>

                  {showSPPB && (
                    <div className="bg-orange-100 p-5 rounded-[1.5rem] border-2 border-dashed border-orange-400 animate-fade-in-up shadow-inner">
                      <h4 className="font-black text-orange-900 mb-5 border-b border-orange-200 pb-3">âš ï¸ Tindak Lanjut Mobilisasi (SPPB)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <SelectCustom label="Berdiri Berdampingan" hint="Keseimbangan (10 Dtk)" value={lansia.sppb_samping} onChange={v => handleLansia('sppb_samping', v)} options={['Bertahan 10 detik', 'Tidak bertahan 10 detik', 'Tidak dilakukan']} />
                        <SelectCustom label="Berdiri Semi Tandem" hint="Keseimbangan (10 Dtk)" value={lansia.sppb_semitandem} onChange={v => handleLansia('sppb_semitandem', v)} options={['Bertahan 10 detik', 'Tidak bertahan 10 detik', 'Tidak dilakukan']} />
                        <SelectCustom label="Berdiri Tandem" hint="Keseimbangan (10 Dtk)" value={lansia.sppb_tandem} onChange={v => handleLansia('sppb_tandem', v)} options={['Bertahan 10 detik', 'Bertahan 3 - 9.99 detik', 'Bertahan < 3 detik', 'Tidak dilakukan']} />
                        <SelectCustom label="Kec. Berjalan" hint="Waktu tempuh 4 Meter" value={lansia.sppb_jalan} onChange={v => handleLansia('sppb_jalan', v)} options={['4', '3', '2', '1', '0.1']} />
                        <SelectCustom label="Bangkit dari Kursi" hint="Waktu berdiri 5x" value={lansia.sppb_kursi} onChange={v => handleLansia('sppb_kursi', v)} options={['4', '3', '2', '1', '0.1']} />
                      </div>
                    </div>
                  )}

                  {showMNA && (
                    <div className="bg-emerald-100 p-5 rounded-[1.5rem] border-2 border-dashed border-emerald-400 animate-fade-in-up shadow-inner">
                      <h4 className="font-black text-emerald-900 mb-5 border-b border-emerald-200 pb-3">âš ï¸ Tindak Lanjut Malnutrisi (MNA-SF)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <SelectCustom label="Asupan Makanan" hint="Dalam 3 bln terakhir" value={lansia.mna_asupan} onChange={v => handleLansia('mna_asupan', v)} options={['Nafsu Makan Biasa saja', 'Nafsu Makan Sedikit Berkurang', 'Nafsu Makan Yang Sangat Berkurang']} />
                        <SelectCustom label="Penurunan BB" hint="Dalam 3 bln terakhir" value={lansia.mna_bb} onChange={v => handleLansia('mna_bb', v)} options={['Tidak Tahu', 'Penurunan BB antara 1 - 3 kg', 'Penurunan BB > 3 Kg']} />
                        <SelectCustom label="Mobilitas" hint="Kemampuan gerak/keluar rumah" value={lansia.mna_mobilitas} onChange={v => handleLansia('mna_mobilitas', v)} options={['Bisa bepergian keluar rumah', 'Bisa bangun dari tempat tidur atau kursi roda, tetapi tidak bisa keluar rumah']} />
                        <TogglePill label="Stress/Penyakit Akut" hint="Dalam 3 bulan terakhir?" value={lansia.mna_stress} onChange={v => handleLansia('mna_stress', v)} colorClass="bg-emerald-600" />
                        <SelectCustom label="Neuropsikologis" hint="Kondisi demensia/pikun" value={lansia.mna_neuro} onChange={v => handleLansia('mna_neuro', v)} options={['Tidak ada masalah psikologis', 'Demensia/kepikunan ringan', 'Dementia atau depresi berat']} />
                        <SelectCustom label="Skor IMT" hint="(Auto dari Pos 2)" value={lansia.mna_imt} onChange={v => handleLansia('mna_imt', v)} options={['IMT >= 23', 'IMT 21 - < 23', 'IMT 19 - < 21', 'IMT < 19']} />
                        {!imtTersedia && (<SelectCustom label="Lingkar Betis" hint="Jika IMT kosong/tidak valid" value={lansia.mna_betis} onChange={v => handleLansia('mna_betis', v)} options={['= 31 cm', '< 31 cm']} />)}
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-sky-50 to-white p-5 rounded-[1.5rem] border border-sky-100 shadow-sm">
                    <h4 className="font-black text-sky-900 mb-5 border-b pb-3 flex gap-3"><span className="text-2xl bg-sky-200 p-2 rounded-xl shadow-sm">ðŸ˜”</span> 4. Gejala Depresi</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <TogglePill label="Sedih/Putus Asa?" hint="2 minggu terakhir" value={lansia.dep_sedih} onChange={v => handleLansia('dep_sedih', v)} colorClass="bg-sky-600" />
                      <TogglePill label="Hilang Minat?" hint="2 minggu terakhir" value={lansia.dep_minat_turun} onChange={v => handleLansia('dep_minat_turun', v)} colorClass="bg-sky-600" />
                    </div>
                  </div>

                  {showDepresiLanjut && (
                    <div className="bg-sky-100 p-5 rounded-[1.5rem] border-2 border-dashed border-sky-400 animate-fade-in-up shadow-inner">
                      <h4 className="font-black text-sky-900 mb-5 border-b border-sky-200 pb-3">âš ï¸ Tindak Lanjut Depresi (GDS)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                        <TogglePill label="Puas dgn Hidup?" hint="Saat ini" value={lansia.depl_puas} onChange={v => handleLansia('depl_puas', v)} colorClass="bg-sky-600" />
                        <TogglePill label="Sering Bosan?" hint="2 mgg terakhir" value={lansia.depl_bosan} onChange={v => handleLansia('depl_bosan', v)} colorClass="bg-sky-600" />
                        <TogglePill label="Tidak Berdaya?" hint="2 mgg terakhir" value={lansia.depl_tak_berdaya} onChange={v => handleLansia('depl_tak_berdaya', v)} colorClass="bg-sky-600" />
                        <TogglePill label="Tidak Berharga?" hint="2 mgg terakhir" value={lansia.depl_tak_berharga} onChange={v => handleLansia('depl_tak_berharga', v)} colorClass="bg-sky-600" />
                      </div>
                    </div>
                  )}

                  <div className="bg-rose-50 p-5 rounded-[1.5rem] border border-rose-100 shadow-sm">
                    <h4 className="font-black text-rose-900 mb-5 border-b pb-3 flex gap-3"><span className="text-2xl bg-rose-200 p-2 rounded-xl shadow-sm">ðŸƒ</span> 5. Gangguan Fungsional (Barthel Index)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <SelectCustom label="Kendalikan BAB" hint="Rangsang buang air besar" value={lansia.adl_bab} onChange={v => handleLansia('adl_bab', v)} options={['Terkendali teratur', 'Kadang-kadang tak terkendali (1x/minggu)', 'Tidak terkendali/tak teratur (perlu pencahar)']} />
                      <SelectCustom label="Kendalikan BAK" hint="Rangsang buang air kecil" value={lansia.adl_bak} onChange={v => handleLansia('adl_bak', v)} options={['Mandiri', 'Kadang-kadang tak terkendali (hanya 1x/24 jam)', 'Tak terkendali atau pakai kateter']} />
                      <SelectCustom label="Membersihkan Diri" hint="Seka wajah, sisir, sikat gigi" value={lansia.adl_seka} onChange={v => handleLansia('adl_seka', v)} options={['Mandiri', 'Butuh pertolongan orang lain']} />
                      <SelectCustom label="Penggunaan Jamban" hint="Keluar masuk, siram" value={lansia.adl_jamban} onChange={v => handleLansia('adl_jamban', v)} options={['Mandiri', 'Perlu pertolongan pada beberapa kegiatan', 'Tergantung pertolongan orang lain']} />
                      <SelectCustom label="Makan dan Minum" hint="Jika perlu dipotong, dianggap dibantu" value={lansia.adl_makan} onChange={v => handleLansia('adl_makan', v)} options={['Mandiri', 'Perlu ditolong memotong makanan', 'Tergantung orang lain']} />
                      <SelectCustom label="Berbaring ke Duduk" hint="Berubah sikap" value={lansia.adl_bangun} onChange={v => handleLansia('adl_bangun', v)} options={['Mandiri', 'Bantuan minimal 1 orang', 'Perlu banyak bantuan untuk bias duduk (2 orang)']} />
                      <SelectCustom label="Berpindah/Berjalan" hint="Mobilitas dasar" value={lansia.adl_jalan} onChange={v => handleLansia('adl_jalan', v)} options={['Mandiri', 'Bantuan minimal 1 orang']} />
                      <SelectCustom label="Memakai Baju" hint="Mampu mengancing baju?" value={lansia.adl_baju} onChange={v => handleLansia('adl_baju', v)} options={['Mandiri', 'Sebagian dibantu (misalnya: mengancing baju)', 'Tergantung orang lain']} />
                      <SelectCustom label="Naik Turun Tangga" hint="" value={lansia.adl_tangga} onChange={v => handleLansia('adl_tangga', v)} options={['Mandiri', 'Butuh pertolongan']} />
                      <SelectCustom label="Mandi" hint="Kebersihan tubuh utuh" value={lansia.adl_mandi} onChange={v => handleLansia('adl_mandi', v)} options={['Mandiri', 'Tergantung orang lain']} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-700 mb-5 border-b pb-3 flex gap-3"><span className="text-2xl bg-white p-2 rounded-xl shadow-sm">ðŸ§©</span> 11. Kognitif Lainnya (AD8 / IADL)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <SelectCustom label="Membuat Keputusan" hint="Mampu urus uang/belanja?" value={lansia.ad8_keputusan} onChange={v => handleLansia('ad8_keputusan', v)} options={['Tidak Berubah', 'Ya, Berubah', 'Tidak Tahu']} />
                      <SelectCustom label="Menekuni Hobi" hint="Rajut, jahit, dll." value={lansia.ad8_hobi} onChange={v => handleLansia('ad8_hobi', v)} options={['Tidak Berubah', 'Ya, Berubah', 'Tidak Tahu']} />
                      <SelectCustom label="Mengulang Cerita" hint="Pertanyaan sama?" value={lansia.ad8_ulang} onChange={v => handleLansia('ad8_ulang', v)} options={['Tidak Berubah', 'Ya, Berubah', 'Tidak Tahu']} />
                      <SelectCustom label="Memakai Alat Baru" hint="Kesulitan setel TV/HP?" value={lansia.ad8_alat} onChange={v => handleLansia('ad8_alat', v)} options={['Tidak Berubah', 'Ya, Berubah', 'Tidak Tahu']} />
                      <SelectCustom label="Lupa Bulan/Tahun" hint="Orientasi waktu jauh." value={lansia.ad8_waktu} onChange={v => handleLansia('ad8_waktu', v)} options={['Tidak Berubah', 'Ya, Berubah', 'Tidak Tahu']} />
                      <SelectCustom label="Kesulitan Atur Keuangan" hint="Bayar listrik/bank." value={lansia.ad8_uang} onChange={v => handleLansia('ad8_uang', v)} options={['Tidak Berubah', 'Ya, Berubah', 'Tidak Tahu']} />
                      <SelectCustom label="Lupa Janji Temu" hint="Mengingat jadwal dgn org lain." value={lansia.ad8_janji} onChange={v => handleLansia('ad8_janji', v)} options={['Tidak Berubah', 'Ya, Berubah', 'Tidak Tahu']} />
                      <SelectCustom label="Gangguan Memori" hint="Sering lupa naruh kunci." value={lansia.ad8_memori} onChange={v => handleLansia('ad8_memori', v)} options={['Tidak Berubah', 'Ya, Berubah', 'Tidak Tahu']} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="workflow-action-bar door-action-bar form-action-row no-print">
              <div className="contents">
                <button type="button" onClick={handlePrevStep} className="secondary-action w-full">â€¹ Kembali Ke-2</button>
                <button type="button" onClick={handleNextStep} className="primary-action w-full">Lanjut Ke-4 â€º</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PARU & CATATAN AKHIR */}
        {step === 4 && (
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] shadow-sm border border-slate-200 animate-fade-in-up">
            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-6 border-b border-slate-100 pb-5 flex items-center gap-3"><span className="text-2xl bg-purple-100 p-2.5 rounded-xl text-purple-600 shadow-sm">ðŸ«</span> 4. Evaluasi Akhir</h3>

            <div className="space-y-6">
              {(kategoriPasien === 'Bayi' || kategoriPasien === 'Balita') && (
                <div className="bg-gradient-to-b from-emerald-50 to-white p-6 md:p-8 rounded-[1.5rem] text-center border border-emerald-100 shadow-sm">
                  <span className="text-5xl block mb-5 bg-white w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-sm border border-emerald-50">ðŸ‘¶</span>
                  <h3 className="font-black text-emerald-800 text-lg md:text-xl">Pasien Anak Usia Dini</h3>
                  <p className="text-sm font-bold text-emerald-600 mt-2 max-w-sm mx-auto leading-relaxed">Pemeriksaan khusus selesai. Anda bisa langsung mengisi catatan akhir dan menekan tombol Simpan.</p>
                </div>
              )}

              {(isAnakSekolah(kategoriPasien) || kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') && (
                <>
                  <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-5 border-b pb-3 flex items-center gap-3"><span className="text-2xl bg-white p-2 rounded-xl shadow-sm">ðŸ¦ </span> Skrining Kulit</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <TogglePill label="Kusta" hint="Bercak putih mati rasa?" value={kulitKusta} onChange={setKulitKusta} colorClass="bg-slate-700" />
                      <TogglePill label="Skabies" hint="Gatal malam hari?" value={kulitSkabies} onChange={setKulitSkabies} colorClass="bg-slate-700" />
                      <TogglePill label="Frambusia" hint="Koreng menular?" value={kulitFrambusia} onChange={setKulitFrambusia} colorClass="bg-slate-700" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-[1.5rem] border border-purple-100 shadow-sm">
                      <h4 className="font-black text-purple-900 mb-5 border-b border-purple-100 pb-3 flex items-center gap-3"><span className="text-2xl bg-purple-200 p-2 rounded-xl shadow-sm">ðŸ«</span> Risiko & X-Ray TB</h4>
                      <div className="space-y-5">
                        <MultiTogglePill label="Batuk Lama" hint="Lebih/kurang 2 Minggu?" value={resTbBatuk} onChange={setResTbBatuk} options={['>2Mg', '<2Mg', 'Tdk']} />
                        <MultiTogglePill label="Kontak TB" hint="Kontak pasien TB?" value={resTbKontak} onChange={setResTbKontak} options={['Riw', 'Erat', 'Tdk']} />
                        {(kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') && (<TogglePill label="Riw. TB / PPOK" hint="Pernah diobati TB/PPOK?" value={resTbRiwPpok} onChange={setResTbRiwPpok} />)}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 pt-5 border-t border-purple-200/50">
                          <TogglePill label="BB Turun Drastis" hint="Tanpa diet?" value={xrayDewasaBb} onChange={setXrayDewasaBb} />
                          <TogglePill label="Keringat Malam" hint="Tanpa aktivitas?" value={xrayDewasaKeringat} onChange={setXrayDewasaKeringat} />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-[1.5rem] border border-rose-100 shadow-sm">
                      <h4 className="font-black text-rose-900 mb-5 border-b border-rose-100 pb-3 flex items-center gap-3"><span className="text-2xl bg-rose-200 p-2 rounded-xl shadow-sm">ðŸ©¸</span> Skrining Hepatitis</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <TogglePill label="Riw. Transfusi" hint="Pernah terima donor?" value={hepTransfusi} onChange={setHepTransfusi} colorClass="bg-rose-600" />
                        <TogglePill label="Cuci Darah (HD)" hint="Rutin hemodialisa?" value={hepHd} onChange={setHepHd} colorClass="bg-rose-600" />
                        <div className="col-span-1 sm:col-span-2"><TogglePill label="Klg Hepatitis" hint="Keluarga positif?" value={hepKlg} onChange={setHepKlg} colorClass="bg-rose-600" /></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {isUsiaKankerParu ? (
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-[1.5rem] border border-slate-700 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      <h4 className="relative z-10 font-black text-white mb-5 border-b border-slate-700 pb-3 flex items-center gap-3 text-sm md:text-base"><span className="text-2xl bg-slate-700 p-2 rounded-xl shadow-inner border border-slate-600">ðŸš¬</span> Risiko Kanker Paru</h4>
                      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <TogglePill label={<span className="text-slate-300">Merokok &lt; 1th</span>} hint={<span className="text-slate-400">Berhenti &lt; 1 thn?</span>} value={caParuMerokokKrg1th} onChange={setCaParuMerokokKrg1th} colorClass="bg-emerald-600" />
                        <TogglePill label={<span className="text-slate-300">Riw Merokok</span>} hint={<span className="text-slate-400">Pernah/masih merokok?</span>} value={caParuRiwMerokok} onChange={setCaParuRiwMerokok} colorClass="bg-emerald-600" />
                        <TogglePill label={<span className="text-slate-300">Terpapar Asap</span>} hint={<span className="text-slate-400">Asap pabrik/lainnya?</span>} value={caParuAsap} onChange={setCaParuAsap} colorClass="bg-emerald-600" />
                        <TogglePill label={<span className="text-slate-300">Riw CA Klg</span>} hint={<span className="text-slate-400">Keluarga kanker paru?</span>} value={caParuRiwKlg} onChange={setCaParuRiwKlg} colorClass="bg-emerald-600" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-dashed border-slate-300 flex items-center justify-center text-center shadow-inner">
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">Skrining Kanker Paru (ASIK) dilewati<br />(Hanya untuk usia 45 tahun ke atas)</p>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-sky-50 to-white p-5 rounded-[1.5rem] border border-sky-100 shadow-sm">
                    <h4 className="font-black text-sky-900 mb-5 border-b border-sky-100 pb-3 flex items-center gap-3"><span className="text-2xl bg-sky-200 p-2 rounded-xl shadow-sm">ðŸ˜®â€ðŸ’¨</span> Merokok & PPOK</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <TogglePill label="Batuk Berdahak" hint="Pagi hari?" value={rokokBatukLama} onChange={setRokokBatukLama} colorClass="bg-sky-600" />
                      <TogglePill label="Nyeri / Sesak" hint="Dada terasa berat?" value={rokokSesak} onChange={setRokokSesak} colorClass="bg-sky-600" />
                      <TogglePill label="Nafas Pendek" hint="Jalan cepat?" value={ppokNafas} onChange={setPpokNafas} colorClass="bg-sky-600" />
                      <TogglePill label="Sulit Dahak" hint="Dahak kental?" value={ppokDahak} onChange={setPpokDahak} colorClass="bg-sky-600" />
                    </div>
                  </div>
                </div>
              )}

              {(isAnakSekolah(kategoriPasien) || kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') && (
                <div className="bg-emerald-50 p-5 rounded-[1.5rem] border border-emerald-200 mt-6 shadow-sm">
                  <h4 className="font-black text-emerald-900 mb-5 border-b border-emerald-200 pb-3 flex items-center gap-3"><span className="text-2xl bg-emerald-200 p-2 rounded-xl shadow-sm">ðŸƒ</span> Aktivitas Fisik</h4>
                  <div className="w-full">
                    <label className="block text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Kategori Aktivitas Sehari-hari</label>
                    <select value={aktivitasFisik} onChange={(e) => setAktivitasFisik(e.target.value)} className="w-full min-h-[52px] p-4 bg-white border border-emerald-200 rounded-xl outline-none text-base md:text-sm font-bold text-slate-700 shadow-sm focus:border-emerald-500 cursor-pointer transition-all active:scale-[0.98]">
                      {aktivitasOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-8 bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
                <div className="mb-6"><TogglePill label="Penyandang Disabilitas" hint="Kondisi kecacatan?" value={disabilitas} onChange={setDisabilitas} colorClass="bg-rose-600" /></div>
                <label className="block text-[11px] md:text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Catatan Khusus / Diagnosa Akhir</label>
                <textarea rows="4" value={catatanAkhir} onChange={e => setCatatanAkhir(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-base md:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 shadow-inner resize-none transition-all" placeholder="Opsional (Catatan khusus, resep obat, rekomendasi, dll)..." />
              </div>
            </div>

            <div className="workflow-action-bar door-action-bar form-action-row no-print">
              <div className="contents">
                <button type="button" onClick={handlePrevStep} className="secondary-action w-full">â€¹ Kembali Ke-3</button>
                <button type="button" onClick={handleSimpanKeDatabase} disabled={loading || ocrLoading} className="primary-action w-full disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><span className="animate-spin text-lg">âš™ï¸</span> MEMPROSES...</> : 'ðŸŽ¯ SIMPAN & RAPOR'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS & RAPOR GENERATOR */}
        {step === 5 && (
          <div className="animate-fade-in-up">
            <div className="bg-gradient-to-br from-blue-950 to-indigo-900 p-6 md:p-8 rounded-[1.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-6 no-print border border-blue-800/50">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full mb-3 border border-emerald-500/30">
                  <span className="text-sm">ðŸŽ‰</span><span className="text-[10px] font-black uppercase tracking-widest">Tersimpan di Cloud</span>
                </div>
                <h2 className="text-white text-xl md:text-2xl font-bold">Pemeriksaan Selesai</h2>
              </div>
              <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                <button onClick={handlePrintRapor} className="flex-1 md:flex-none bg-white text-slate-900 px-5 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 hover:bg-slate-100 text-[11px] md:text-xs uppercase tracking-widest"><span className="text-lg">ðŸ–¨ï¸</span> PDF/CETAK</button>
                <button onClick={handleKirimWA} className="flex-1 md:flex-none bg-green-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 hover:bg-green-400 text-[11px] md:text-xs uppercase tracking-widest"><span className="text-lg">ðŸ’¬</span> KIRIM WA</button>
              </div>
              <button onClick={resetModul} className="w-full md:w-auto bg-slate-800 text-white px-5 py-3 rounded-xl font-bold border border-slate-600 hover:bg-slate-700 uppercase tracking-widest text-[10px] md:text-xs transition-colors active:scale-95">PASIEN BARU âž”</button>
            </div>

            {/* Kontainer Rapor */}
            <div className="w-full rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm bg-slate-50 p-3 md:p-6 no-print-wrapper">
              <div className="rapor-print-area text-slate-800 font-sans shadow-lg md:shadow-2xl mx-auto rounded-2xl relative bg-white flex flex-col overflow-hidden w-full max-w-[210mm] aspect-[1/1.414]">

                {/* Header Rapor */}
                <div className="bg-gradient-to-r from-[#00796b] to-[#009288] text-white px-5 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row print:flex-row items-center gap-4 md:gap-5 shrink-0 border-b-4 border-emerald-500/30 text-center sm:text-left print:text-left">
                  <div className="bg-white p-2 md:p-2.5 rounded-2xl shrink-0 shadow-md">
                    <img src="/logo_malimpung.png" alt="Logo" className="h-12 w-12 md:h-14 md:w-14 object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-black drop-shadow-sm">Laporan Medical Check-Up (MCU)</h1>
                    <p className="text-[9px] md:text-[10px] opacity-90 font-bold tracking-widest uppercase mt-1 text-emerald-100">Puskesmas Malimpung â€¢ Tgl Terbit: {tglString}, {waktuString} WITA</p>
                  </div>
                </div>

                {/* Identitas Pasien */}
                <div className="p-4 md:p-6 pb-4 shrink-0 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row print:flex-row items-center gap-3 sm:gap-5 mb-5 text-center sm:text-left print:text-left">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center text-2xl md:text-3xl shadow-sm">{formData.j_kelamin === 'P' ? 'ðŸ‘©' : 'ðŸ‘¨'}</div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-wide">{formData.nama || 'Pasien Cek Kesehatan Gratis'}</h2>
                      <p className="text-[10px] md:text-xs text-slate-500 font-mono mt-0.5 font-bold">NIK: {tanpaNik ? formData.nik_wali : formData.nik}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 md:gap-4 text-[10px] md:text-xs font-bold bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm text-center sm:text-left print:text-left">
                    <div><p className="text-[8px] md:text-[9px] text-slate-400 uppercase tracking-widest mb-1">Tgl Lahir</p><p className="text-slate-700">{formData.tgl_lahir}</p></div>
                    <div><p className="text-[8px] md:text-[9px] text-slate-400 uppercase tracking-widest mb-1">Kategori Usia</p><p className="text-slate-700">{kategoriPasien} ({umurPasien} Thn)</p></div>
                    <div><p className="text-[8px] md:text-[9px] text-slate-400 uppercase tracking-widest mb-1">Jalur Periksa</p><p className="text-slate-700">Door-to-Door</p></div>
                    <div><p className="text-[8px] md:text-[9px] text-slate-400 uppercase tracking-widest mb-1">Alamat Asal</p><p className="truncate text-slate-700">{formData.dusun}</p></div>
                  </div>
                </div>

                <div className="px-4 md:px-6 py-5 flex-1 flex flex-col">
                  {/* Indikator Kritis */}
                  <h3 className="text-[10px] md:text-[11px] font-black text-slate-800 mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2">1. Rangkuman Indikator Kritis</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <RangkumanCardPrint icon="â¤ï¸" title="Tekanan Darah" value={kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? '-' : `${td || '-'}`} status={kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? 'Pantau KIA' : tensiData.status} textColor={kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? 'text-slate-500' : tensiData.color} dotPos={kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? 50 : tensiData.pos} />
                    <RangkumanCardPrint icon="ðŸ©¸" title="Gula Darah" value={kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? '-' : gulaData.nilai} status={kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? 'Pantau KIA' : gulaData.status} textColor={kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? 'text-slate-500' : gulaData.color} dotPos={kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? 50 : gulaData.pos} />
                    <RangkumanCardPrint icon="âš–ï¸" title={(kategoriPasien === 'Bayi' || kategoriPasien === 'Balita') ? "BB / TB" : "IMT / Status Gizi"} value={(kategoriPasien === 'Bayi' || kategoriPasien === 'Balita') ? `${bb || '-'} Kg / ${tb || '-'} cm` : imtData.nilai} status={(kategoriPasien === 'Bayi' || kategoriPasien === 'Balita') ? 'Pantau Grafik KIA' : imtData.status} textColor={(kategoriPasien === 'Bayi' || kategoriPasien === 'Balita') ? 'text-slate-500' : imtData.color} dotPos={(kategoriPasien === 'Bayi' || kategoriPasien === 'Balita') ? 50 : imtData.pos} />
                    <RangkumanCardPrint icon="ðŸ«" title="Risiko Paru/TB" value={resTbBatuk === '>2Mg' ? 'Suspek/Risiko' : 'Aman'} status="" textColor={resTbBatuk === '>2Mg' ? 'text-red-600' : 'text-emerald-600'} dotPos={resTbBatuk === '>2Mg' ? 85 : 15} />
                  </div>

                  {/* Tabel Hasil */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-5 md:gap-6">
                    <div>
                      <h3 className="text-[10px] md:text-[11px] font-black text-slate-800 mb-3 uppercase tracking-widest border-b-2 border-slate-100 pb-2">2. Parameter Fisik & Lab</h3>
                      <table className="w-full text-[9px] sm:text-[10px] md:text-xs print:text-[10px] border-collapse bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <thead><tr className="bg-slate-100"><th className="p-2 md:p-2.5 print:p-1.5 border-b border-slate-200 text-left font-black">Pemeriksaan</th><th className="p-2 md:p-2.5 print:p-1.5 border-b border-slate-200 font-black">Hasil</th><th className="p-2 md:p-2.5 print:p-1.5 border-b border-slate-200 text-slate-500 font-black">Rujukan</th></tr></thead>
                        <tbody className="text-center">
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 text-left font-bold">Tensi (mmHg)</td><td className={`p-2 md:p-2.5 print:p-1.5 font-black ${tensiData.color}`}>{td || '-'}</td><td className="p-2 md:p-2.5 print:p-1.5 text-slate-500 font-medium">120/80</td></tr>
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 text-left font-bold">Gula Darah</td><td className={`p-2 md:p-2.5 print:p-1.5 font-black ${gulaData.color}`}>{gds || gdp || '-'}</td><td className="p-2 md:p-2.5 print:p-1.5 text-slate-500 font-medium">&lt;140</td></tr>
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 text-left font-bold">Kolesterol</td><td className="p-2 md:p-2.5 print:p-1.5 font-black text-slate-700">{kolesterol || '-'}</td><td className="p-2 md:p-2.5 print:p-1.5 text-slate-500 font-medium">&lt;200</td></tr>
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 text-left font-bold">Asam Urat</td><td className="p-2 md:p-2.5 print:p-1.5 font-black text-slate-700">{asamUrat || '-'}</td><td className="p-2 md:p-2.5 print:p-1.5 text-slate-500 font-medium">&lt;7.0</td></tr>
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 text-left font-bold">Tinggi/Berat</td><td className="p-2 md:p-2.5 print:p-1.5 font-black text-slate-700">{tb || '-'}/{bb || '-'}</td><td className="p-2 md:p-2.5 print:p-1.5 text-slate-500 font-medium">Proporsional</td></tr>
                          <tr><td className="p-2 md:p-2.5 print:p-1.5 text-left font-bold">{kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? 'LK (cm)' : 'LP (cm)'}</td><td className="p-2 md:p-2.5 print:p-1.5 font-black text-slate-700">{kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? (lk || '-') : (lp || '-')}</td><td className="p-2 md:p-2.5 print:p-1.5 text-slate-500 font-medium">{kategoriPasien === 'Bayi' || kategoriPasien === 'Balita' ? '-' : 'L<90|P<80'}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h3 className="text-[10px] md:text-[11px] font-black text-slate-800 mb-3 uppercase tracking-widest border-b-2 border-slate-100 pb-2">3. Tinjauan Klinis & Sistemik</h3>
                      <table className="w-full text-[9px] sm:text-[10px] md:text-xs print:text-[10px] border-collapse bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <thead><tr className="bg-slate-100"><th className="p-2 md:p-2.5 print:p-1.5 border-b border-slate-200 text-left font-black">Sistem/Organ</th><th className="p-2 md:p-2.5 print:p-1.5 border-b border-slate-200 text-left font-black">Status Skrining Akhir</th></tr></thead>
                        <tbody>
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 font-bold text-slate-700">Mata / Visus</td><td className={`p-2 md:p-2.5 print:p-1.5 font-black ${statusMata.includes('Normal') ? 'text-emerald-600' : 'text-amber-600'}`}>{statusMata}</td></tr>
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 font-bold text-slate-700">Telinga</td><td className={`p-2 md:p-2.5 print:p-1.5 font-black ${statusTelinga.includes('Normal') ? 'text-emerald-600' : 'text-amber-600'}`}>{statusTelinga}</td></tr>
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 font-bold text-slate-700">Kesehatan Gigi</td><td className={`p-2 md:p-2.5 print:p-1.5 font-black ${statusGigi.includes('Normal') ? 'text-emerald-600' : (statusGigi === '-' ? 'text-slate-500' : 'text-amber-600')}`}>{statusGigi}</td></tr>
                          <tr className="border-b border-slate-100"><td className="p-2 md:p-2.5 print:p-1.5 font-bold text-slate-700">Kognitif/Mental</td><td className={`p-2 md:p-2.5 print:p-1.5 font-black ${statusMental.includes('Normal') ? 'text-emerald-600' : 'text-rose-600'}`}>{statusMental}</td></tr>
                          <tr className="bg-rose-50/30"><td className="p-2 md:p-2.5 print:p-1.5 font-black text-rose-800">Diagnosis Akhir</td><td className="p-2 md:p-2.5 print:p-1.5 italic font-bold text-rose-900 leading-relaxed">{catatanAkhir || 'Dalam batas normal / Tidak ada keluhan spesifik'}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-auto pt-5 border-t-2 border-dashed border-slate-200">
                    <h3 className="text-[8px] md:text-[9px] font-black text-slate-400 mb-4 uppercase tracking-widest text-center">Tim Medis & Validasi Pemeriksaan Door-to-Door</h3>
                    <div className="flex flex-col sm:flex-row print:flex-row justify-between items-center text-center sm:text-left print:text-left px-2 md:px-6 gap-3">
                      <div><p className="text-[8px] text-slate-400 uppercase mb-1">Petugas Medis Lapangan</p><p className="text-[10px] md:text-[11px] print:text-[10px] font-black text-slate-800 uppercase bg-slate-100 py-1.5 px-4 rounded-lg inline-block border border-slate-200">{namaPetugas}</p></div>
                      <div><p className="text-[8px] text-slate-400 uppercase mb-1">Status Sinkronisasi</p><p className="text-[10px] md:text-[11px] print:text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 py-1.5 px-4 rounded-lg inline-block border border-emerald-200">âœ… Terverifikasi RME</p></div>
                    </div>
                  </div>
                </div>

                {/* Footer Laporan */}
                <div className="bg-slate-900 text-white px-4 md:px-6 py-5 md:py-6 flex flex-col-reverse sm:flex-row print:flex-row justify-between items-center shrink-0 gap-4 mt-auto">
                  <div className="w-full sm:w-[75%] print:w-[75%] sm:pr-6 print:pr-6 text-center sm:text-left print:text-left">
                    <p className="text-[9px] md:text-[10px] lg:text-[11px] print:text-[10px] leading-relaxed font-bold tracking-wide opacity-90">Laporan Cek Kesehatan Gratis (Jalur Kunjungan Rumah) ini sah dan otomatis terintegrasi dengan Rekam Medis Elektronik (RME) Puskesmas Malimpung. Mencegah lebih baik daripada mengobati.</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl shrink-0 shadow-lg">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code Validasi" className="w-14 h-14 md:w-[24mm] md:h-[24mm] print:w-[24mm] print:h-[24mm]" />
                    ) : (
                      <div className="w-14 h-14 md:w-[24mm] md:h-[24mm] print:w-[24mm] print:h-[24mm] bg-slate-100" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Teks panduan diganti karena tidak perlu scroll lagi */}
            <p className="text-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
               Laporan ini otomatis berformat A4 saat ditekan PDF/Cetak
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default KunjunganRumah;
