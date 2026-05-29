import { useState, useEffect, useRef } from 'react';
import { useAuth } from './auth/AuthContext';
import { STATUS_MAPPING } from './utils/constants';
import { VISIT_STATUS } from './features/workflow/workflowStatus';
import {
  buildChildIdentityKey,
  buildStableNonNik,
  formatVisitDate
} from './utils/ckgValidation';
import { writeAuditLog } from './services/auditService';
import { claimVisitForStaff, createTvQueueCall } from './services/queueService';
import { buildPatientPayload, findCurrentYearCkgVisit, getPatientByNik, upsertPatient } from './services/patientService';
import { buildPatientSnapshot, getVisitsByPatientNik, nowTimestamp, updateVisit } from './services/visitService';
import { runIdentityOcr, toLegacyOcrFormData } from './features/ocr/ocrPipeline';
import OcrResultReview from './features/ocr/OcrResultReview';
import useQueue from './hooks/useQueue';
import { Camera, UploadCloud } from 'lucide-react';
import QueueCallList from './components/patient/QueueCallList';
import { alertDialog } from './utils/appDialog';

const OPENCV_SCRIPT_ID = 'opencv-script';
const OPENCV_SCRIPT_SRC = '/vendor/opencv-4.8.0.js';

const WILAYAH_KERJA = {
  "Desa Malimpung": ["Dusun Palita", "Dusun Malimpung", "Dusun Pajalele"],
  "Desa Padang Loang": ["Dusun Padang", "Dusun Banga", "Dusun Palita"],
  "Kelurahan Maccirinna": ["Lingkungan Dioang", "Lingkungan Bulu Dua", "Lingkungan Paraungan"],
  "Luar Wilayah": ["Lainnya"]
};

// ==========================================
// 🛡️ HELPER FUNCTIONS
// ==========================================
const emptyUmur = { tahun: 0, bulan: 0, totalBulan: 0, kategori: '-' };

const isValidIsoDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1900 || year > new Date().getFullYear()) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date <= new Date();
};

const isoToDateView = (value) => {
    if (!isValidIsoDate(value)) return '';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
};

const dateViewToIso = (value) => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(String(value || ''))) return '';
    const [day, month, year] = value.split('/');
    const iso = `${year}-${month}-${day}`;
    return isValidIsoDate(iso) ? iso : '';
};

const hitungUmur = (tglLahir) => {
    if (!isValidIsoDate(tglLahir)) return emptyUmur;
    const birthDate = new Date(tglLahir);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) { years--; months += 12; }
    const totalBulan = (years * 12) + months;
    let kategori = '-';
    
    // Klaster Usia (Diperbarui agar sinkron dengan routing schema Pos 2)
    if (totalBulan >= 0 && totalBulan <= 11) kategori = 'Bayi';
    else if (years >= 1 && years <= 5) kategori = 'Balita';
    else if (years >= 6 && years <= 12) kategori = 'SD';
    else if (years >= 13 && years <= 15) kategori = 'SMP';
    else if (years >= 16 && years <= 18) kategori = 'SMA';
    else if (years >= 19 && years <= 59) kategori = 'Dewasa';
    else if (years >= 60) kategori = 'Lansia';
    return { tahun: years, bulan: months, totalBulan, kategori };
};

const getVisitMillis = (visit) => {
    const raw = visit.waktu_selesai_total || visit.tanggal_kunjungan || visit.waktu_ambil_tiket;
    return raw?.toMillis ? raw.toMillis() : 0;
};
const formatTanggalKunjungan = (visit) => {
    const raw = visit.waktu_selesai_total || visit.tanggal_kunjungan || visit.waktu_ambil_tiket;
    if (raw?.toDate) return raw.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return visit.tanggal_pelaksanaan || '-';
};

const NUMERIC_FIELD_NAMES = new Set(['nik', 'nik_wali', 'no_hp', 'no_hp_wali']);
const CHILD_CATEGORIES = new Set(['Bayi', 'Balita', 'SD', 'SMP', 'SMA']);

const isChildCategory = (kategori) => CHILD_CATEGORIES.has(kategori);

const InputCustom = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  maxLength,
  error = '',
  hint = '',
  inputMode,
  autoComplete,
}) => {
  const fieldId = `pos1-${name}`;
  const helpId = `${fieldId}-help`;
  const resolvedInputMode = inputMode || (NUMERIC_FIELD_NAMES.has(name) || type === 'tel' || type === 'number' ? 'numeric' : 'text');
  const pattern = resolvedInputMode === 'numeric' ? '[0-9]*' : undefined;

  return (
    <div className="pos1-field w-full">
      <label htmlFor={fieldId} className="pos1-label block text-[11px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={fieldId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={resolvedInputMode}
        pattern={pattern}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? helpId : undefined}
        className={`pos1-input w-full min-h-[44px] rounded-xl shadow-sm p-3 border focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-colors bg-slate-50 focus:bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 font-bold text-base md:text-sm outline-none ${
          error ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
        }`}
      />
      {(hint || error) && (
        <p id={helpId} className={`mt-1.5 text-[11px] font-bold ${error ? 'text-rose-600' : 'text-slate-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
};

// ==========================================
// 🚀 MAIN COMPONENT: POS 1
// ==========================================
function Pos1() {
  const { user, hasRole } = useAuth();
  const antrian = useQueue('POS1');
  const [pasienAktif, setPasienAktif] = useState(null);

  const [cvReady, setCvReady] = useState(false);
  useEffect(() => {
      if (!window.cv && !document.getElementById(OPENCV_SCRIPT_ID)) {
          const script = document.createElement('script');
          script.id = OPENCV_SCRIPT_ID;
          script.src = OPENCV_SCRIPT_SRC;
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.referrerPolicy = 'no-referrer';
          document.body.appendChild(script);
      }

      const checkCV = setInterval(() => {
          if (window.cv && window.cv.Mat) {
              setCvReady(true);
              clearInterval(checkCV);
          }
      }, 500);
      return () => clearInterval(checkCV);
  }, []);

  const fileInputRef = useRef(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrCandidates, setOcrCandidates] = useState([]);
  const [ocrReview, setOcrReview] = useState(null);
  const [ocrMeta, setOcrMeta] = useState(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); 
  const [kameraStatus, setKameraStatus] = useState('idle'); 
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef(null); 
  const canvasRef = useRef(null); 
  const processCanvasRef = useRef(null); 
  const scanRafRef = useRef(null); 
  const alignCountRef = useRef(0); 
  const isCapturingRef = useRef(false); 

  const [dataUmur, setDataUmur] = useState({ tahun: 0, bulan: 0, totalBulan: 0, kategori: '-' });
  const [tanpaNik, setTanpaNik] = useState(false);
  const [tglLahirView, setTglLahirView] = useState('');
  const [tglLahirWaliView, setTglLahirWaliView] = useState('');

  const [formData, setFormData] = useState({
    nik: '', nama: '', status_perkawinan: 'Belum Kawin', tgl_lahir: '', j_kelamin: 'P', 
    no_hp: '', desa: 'Desa Malimpung', dusun: 'Dusun Palita',
    nik_wali: '', nama_wali: '', tgl_lahir_wali: '', hubungan_wali: 'Ibu', no_hp_wali: ''
  });

  const [loading, setLoading] = useState(false); 
  const [callingVisitId, setCallingVisitId] = useState(null);
  const [pesan, setPesan] = useState('');
  const [statusPasien, setStatusPasien] = useState('idle');
  const [riwayatKunjungan, setRiwayatKunjungan] = useState([]);

  const getFieldError = (fieldName) => {
    if (fieldName === 'nik' && !tanpaNik && formData.nik && formData.nik.length !== 16) return 'NIK pasien harus 16 digit angka.';
    if (fieldName === 'nik_wali' && tanpaNik && formData.nik_wali && formData.nik_wali.length !== 16) return 'NIK wali harus 16 digit angka.';
    if (fieldName === 'tgl_lahir' && tglLahirView.length === 10 && !isValidIsoDate(formData.tgl_lahir)) return 'Tanggal lahir pasien tidak valid.';
    if (fieldName === 'tgl_lahir_wali' && tglLahirWaliView.length === 10 && !isValidIsoDate(formData.tgl_lahir_wali)) return 'Tanggal lahir wali tidak valid.';
    return '';
  };

  const readinessItems = [
    { label: 'Pasien aktif dipilih', done: Boolean(pasienAktif?.id) },
    { label: tanpaNik ? 'NIK wali 16 digit' : 'NIK pasien 16 digit', done: tanpaNik ? formData.nik_wali.length === 16 : formData.nik.length === 16 },
    { label: 'Nama pasien terisi', done: Boolean(formData.nama.trim()) },
    { label: 'Tanggal lahir valid', done: isValidIsoDate(formData.tgl_lahir) },
    { label: 'Kategori usia otomatis', done: dataUmur.kategori !== '-' },
    { label: 'Domisili lengkap', done: Boolean(formData.desa && formData.dusun) },
    ...(tanpaNik ? [
      { label: 'Nama wali terisi', done: Boolean(formData.nama_wali.trim()) },
      { label: 'Tanggal lahir wali valid', done: isValidIsoDate(formData.tgl_lahir_wali) },
    ] : []),
  ];

  useEffect(() => {
      if (isValidIsoDate(formData.tgl_lahir)) {
          const umur = hitungUmur(formData.tgl_lahir); 
          setDataUmur(umur);
          if (umur.kategori === 'Bayi' || umur.kategori === 'Balita' || umur.kategori === 'SD' || umur.kategori === 'SMP' || umur.kategori === 'SMA') {
              setTanpaNik(true);
          }
      } else { 
          setDataUmur(emptyUmur); 
      }
  }, [formData.tgl_lahir]);

  useEffect(() => {
    if (formData.nik.length < 16 && (pesan.includes('✅') || pesan.includes('✨'))) setPesan('');
    const cekDataPasien = async () => {
      if (!tanpaNik && formData.nik.length === 16 && !ocrLoading) {
        setLoading(true);
        try {
          const data = await getPatientByNik(formData.nik);
          if (data) {
            const validBirthDate = isValidIsoDate(data.birthDate) ? data.birthDate : '';
            setFormData(prev => ({
              ...prev, nama: data.name || prev.nama, status_perkawinan: data.status_perkawinan || prev.status_perkawinan,
              tgl_lahir: validBirthDate, j_kelamin: data.gender || prev.j_kelamin, no_hp: data.phone || prev.no_hp,
              desa: data.desa || prev.desa, dusun: data.dusun || prev.dusun
            }));
            setTglLahirView(isoToDateView(validBirthDate));
            setPesan(`✅ Data master pasien ditemukan.`);
          } else setPesan(`✨ NIK belum terdaftar. Silakan lengkapi data pasien baru.`);
        } catch (error) { console.warn("Gagal memuat data pasien:", error); } finally { setLoading(false); }
      }
    };
    cekDataPasien();
  }, [formData.nik, tanpaNik, ocrLoading]);

  useEffect(() => {
    const cekRiwayatKunjungan = async () => {
      if (tanpaNik || formData.nik.length !== 16 || ocrLoading) {
        setStatusPasien('idle');
        setRiwayatKunjungan([]);
        return;
      }

      try {
        const patient = await getPatientByNik(formData.nik);
        if (!patient) {
          setStatusPasien('baru');
          setRiwayatKunjungan([]);
          return;
        }

        const riwayat = (await getVisitsByPatientNik(formData.nik)).filter((visit) => visit.id !== pasienAktif?.id);
        riwayat.sort((a, b) => getVisitMillis(b) - getVisitMillis(a));
        const recentRiwayat = riwayat.slice(0, 5);
        setRiwayatKunjungan(recentRiwayat);
        setStatusPasien(recentRiwayat.length > 0 ? 'lama' : 'terdaftar');
      } catch (error) {
        setStatusPasien('idle');
        setRiwayatKunjungan([]);
      }
    };

    cekRiwayatKunjungan();
  }, [formData.nik, tanpaNik, ocrLoading, pasienAktif?.id]);

  const handlePanggil = async (item) => {
    if (callingVisitId || pasienAktif) return;
    setCallingVisitId(item.id);
    try {
      const latestItem = await claimVisitForStaff({
        visitId: item.id,
        staffName: user?.nama || 'Petugas',
        isAdmin: hasRole ? hasRole('admin') : false,
        actor: user,
        module: 'POS1',
        workflowStatus: VISIT_STATUS.POS1_IN_PROGRESS
      });

      setPasienAktif(latestItem); setPesan(''); setStatusPasien('idle'); setRiwayatKunjungan([]); window.scrollTo({ top: 0, behavior: 'smooth' });
      const snap = latestItem.pasien_snapshot || {}; const isTanpaNik = latestItem.patientNIK?.startsWith('NONIK') || false;
      const validSnapBirthDate = isValidIsoDate(snap.tgl_lahir) ? snap.tgl_lahir : '';
      const tglView = isoToDateView(validSnapBirthDate);
      
      setTanpaNik(isTanpaNik); setTglLahirView(tglView); setTglLahirWaliView(''); 
      setFormData({
          nik: isTanpaNik ? '' : (latestItem.patientNIK || ''), nama: snap.nama || '',
          status_perkawinan: snap.status && snap.status !== '-' ? snap.status : 'Belum Kawin',
          tgl_lahir: validSnapBirthDate, j_kelamin: snap.j_kelamin || 'P', no_hp: snap.no_hp || '',
          desa: latestItem.desa_pelaksanaan || 'Desa Malimpung', dusun: latestItem.tempat_pelaksanaan || WILAYAH_KERJA[latestItem.desa_pelaksanaan || 'Desa Malimpung'][0],
          nik_wali: '', nama_wali: '', tgl_lahir_wali: '', hubungan_wali: 'Ibu', no_hp_wali: ''
      });

      try {
          let teksPanggilan = `Nomor antrean... ${latestItem.nomor_antrian.replace(/-/g, ' ')}... Silakan menuju ke meja pendaftaran Pos Satu.`;
          if (latestItem.nomor_antrian.includes('-')) {
              const parts = latestItem.nomor_antrian.split('-');
              const angkaDiucapkan = parts[1].split('').map(n => n === '0' ? 'kosong' : n).join(' ');
              teksPanggilan = `Nomor antrean... ${parts[0]}... ${angkaDiucapkan}... Silakan menuju meja pendaftaran Pos Satu.`;
          }
          await createTvQueueCall({ pos: 'POS 1', queueNumber: latestItem.nomor_antrian, speechText: teksPanggilan });
      } catch (error) { console.warn("Gagal membuat panggilan TV Pos 1:", error); }
    } catch (e) {
      await alertDialog({ title: 'Pasien belum dapat dipanggil', message: e.message, variant: 'warning' });
    } finally {
      setCallingVisitId(null);
    }
  };

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
          if (approx.rows === 4) isAligned = true;
          approx.delete();
        }
        cnt.delete();
      }

      src.delete(); gray.delete(); blurred.delete(); edges.delete(); contours.delete(); hierarchy.delete();

      if (isAligned) {
        alignCountRef.current += 1;
        if (alignCountRef.current > 5) setKameraStatus('aligned'); 
        if (alignCountRef.current > 25) { 
           isCapturingRef.current = true;
           captureImage(); 
           return; 
        }
      } else {
        alignCountRef.current = 0;
        setKameraStatus('ready'); 
      }
    } catch (err) { console.warn("Gagal memproses frame KTP:", err); }
    
    if (!isCapturingRef.current) scanRafRef.current = requestAnimationFrame(processVideoFrame);
  };

  const startCamera = async (mode = facingMode) => {
    if (!cvReady) return setPesan('Sistem pemindai identitas sedang dimuat. Mohon tunggu sebentar lalu coba lagi.');
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
        videoRef.current.srcObject.getTracks().forEach(track => track.stop()); 
    }
    setIsCameraOpen(false); setKameraStatus('idle'); setIsTorchOn(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current; const canvas = canvasRef.current;
      const vw = video.videoWidth; const vh = video.videoHeight;
      let cropWidth = vw * 0.85; let cropHeight = cropWidth / 1.58; 
      if (cropHeight > vh) { cropHeight = vh * 0.85; cropWidth = cropHeight * 1.58; }
      const startX = (vw - cropWidth) / 2; const startY = (vh - cropHeight) / 2;
      canvas.width = cropWidth; canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      canvas.toBlob((blob) => { stopCamera(); processOCR(new File([blob], "ktp.jpg", { type: "image/jpeg" })); }, 'image/jpeg', 0.95);
    }
  };

  const handleFileUpload = (e) => { if (e.target.files[0]) processOCR(e.target.files[0]); };

  const applyOcrData = (extractedData, source = 'OCR') => {
    if (!extractedData?.nik && !extractedData?.nama) return false;

    const normalizedData = {
      ...extractedData,
      j_kelamin: extractedData.j_kelamin || 'P',
      status_perkawinan: extractedData.status_perkawinan || 'Belum Kawin'
    };
    const finalDesa = Object.keys(WILAYAH_KERJA).includes(normalizedData.desa) ? normalizedData.desa : 'Luar Wilayah';
    const finalDusun = WILAYAH_KERJA[finalDesa][0] || 'Lainnya';
    const validOcrBirthDate = isValidIsoDate(normalizedData.tgl_lahir) ? normalizedData.tgl_lahir : '';
    const newTglView = isoToDateView(validOcrBirthDate);

    if (tanpaNik) {
        setFormData(prev => ({ ...prev, nik_wali: normalizedData.nik || prev.nik_wali, nama_wali: normalizedData.nama || prev.nama_wali, tgl_lahir_wali: validOcrBirthDate || prev.tgl_lahir_wali }));
        if (newTglView) setTglLahirWaliView(newTglView);
    } else {
        setFormData(prev => ({ ...prev, nik: normalizedData.nik || prev.nik, nama: normalizedData.nama || prev.nama, tgl_lahir: validOcrBirthDate || prev.tgl_lahir, j_kelamin: normalizedData.j_kelamin || prev.j_kelamin, status_perkawinan: normalizedData.status_perkawinan || prev.status_perkawinan, desa: finalDesa, dusun: finalDusun }));
        if (newTglView) setTglLahirView(newTglView);
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
    setPesan(`⚠️ Data ${normalizedData.document_type || 'identitas'} berhasil dibaca via ${source}${confidence}. Periksa ulang NIK dan nama.${warningText}`);
    return true;
  };

  const processOCR = async (fileAsli) => {
    setOcrLoading(true); setPesan(''); setOcrProgress(0); setOcrCandidates([]); setOcrReview(null); setOcrMeta(null);

    try {
        const ocrResult = await runIdentityOcr(fileAsli, {
            onProgress: setOcrProgress,
            onMode: () => {},
            preferBackend: true
        });
        const extractedData = toLegacyOcrFormData(ocrResult?.data || {});

        if (extractedData.nik || extractedData.nama) {
            if (['Kartu Keluarga', 'KK'].includes(extractedData.document_type) && extractedData.candidates?.length > 1) {
                setOcrCandidates(extractedData.candidates.map(c => ({ ...c, confidence: extractedData.confidence })));
                setPesan(`⚠️ Kartu Keluarga terbaca. Pilih anggota keluarga yang sedang diperiksa agar NIK tidak tertukar.`);
            } else {
                setOcrReview({ ...extractedData, source: ocrResult.source });
                setPesan('Review hasil OCR, lalu klik Gunakan Data Ini jika NIK dan nama sudah benar.');
            }
        } else {
            setPesan('❌ KTP tidak terbaca. Harap ketik manual.');
        }

    } catch (localError) {
        setPesan('❌ Gagal membaca dokumen. Lensa buram atau cahaya kurang.');
    } finally {
        setOcrLoading(false); setOcrProgress(0); if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const handleDateMaskChange = (e, fieldName) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 8) val = val.substring(0, 8); 
      let formatted = val;
      if (val.length >= 3 && val.length <= 4) formatted = `${val.substring(0, 2)}/${val.substring(2)}`;
      else if (val.length >= 5) formatted = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4)}`;

      if (fieldName === 'tgl_lahir') {
          setTglLahirView(formatted);
          setFormData(prev => ({...prev, tgl_lahir: dateViewToIso(formatted)}));
      } else {
          setTglLahirWaliView(formatted);
          setFormData(prev => ({...prev, tgl_lahir_wali: dateViewToIso(formatted)}));
      }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = NUMERIC_FIELD_NAMES.has(name) ? value.replace(/\D/g, '') : value;
    if (name === "desa") { setFormData({ ...formData, desa: value, dusun: WILAYAH_KERJA[value][0] }); } 
    else { setFormData({ ...formData, [name]: type === 'checkbox' ? checked : nextValue }); }
  };

  const handleTanpaNikChange = (e) => {
      setTanpaNik(e.target.checked);
      if (e.target.checked) {
        setFormData(prev => ({ ...prev, nik: '' }));
        setStatusPasien('idle');
        setRiwayatKunjungan([]);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pasienAktif || loading || ocrLoading) return;
      if (!isValidIsoDate(formData.tgl_lahir)) return setPesan('⚠️ Tanggal Lahir harus valid (DD/MM/YYYY).');
    
    let finalNik = formData.nik;
    let identityKey = '';
    if (tanpaNik) {
        if (dataUmur.tahun >= 19) return setPesan('⚠️ Pasien Dewasa (19+) WAJIB memiliki NIK sendiri.');
        if (formData.nik_wali.length !== 16) return setPesan('⚠️ NIK Wali/Pendamping wajib 16 digit.');
        if (!isValidIsoDate(formData.tgl_lahir_wali)) return setPesan('⚠️ Tanggal Lahir Wali harus valid.');
        identityKey = buildChildIdentityKey({
          patientName: formData.nama,
          birthDate: formData.tgl_lahir,
          waliNik: formData.nik_wali
        });
        finalNik = buildStableNonNik({
          patientName: formData.nama,
          birthDate: formData.tgl_lahir,
          waliNik: formData.nik_wali
        });
        if (!identityKey || !finalNik) return setPesan('Data identitas pasien tanpa NIK belum lengkap.');
    } else {
        if (finalNik.length !== 16) return setPesan('⚠️ NIK Pasien wajib 16 digit angka.'); 
    }

    setLoading(true); setPesan('');
    const namaPetugas = user?.nama || 'Sistem / Anonim';

    try {
      const kunjunganTahunIni = await findCurrentYearCkgVisit({
        patientNik: tanpaNik ? null : finalNik,
        identityKey: tanpaNik ? identityKey : null,
        excludeVisitId: pasienAktif.id
      });
      if (kunjunganTahunIni) {
        setPesan(`⚠️ NIK ini sudah mendapatkan layanan CKG pada ${formatVisitDate(kunjunganTahunIni)}. CKG hanya dapat dilakukan 1 kali dalam tahun yang sama.`);
        setLoading(false);
        return;
      }

      const patientData = buildPatientPayload({
        nik: finalNik,
        identityKey: identityKey || null,
        name: formData.nama,
        birthDate: formData.tgl_lahir,
        gender: formData.j_kelamin,
        phone: formData.no_hp,
        statusPerkawinan: formData.status_perkawinan,
        desa: formData.desa,
        dusun: formData.dusun,
        wali: tanpaNik ? { nik_wali: formData.nik_wali, nama_wali: formData.nama_wali, tgl_lahir_wali: formData.tgl_lahir_wali, hubungan: formData.hubungan_wali, no_hp_wali: formData.no_hp_wali } : null
      });
      await upsertPatient(finalNik, patientData);

      await updateVisit(pasienAktif.id, {
        patientNIK: finalNik,
        patient_identity_key: identityKey || null,
        kategori_usia_satusehat: dataUmur.kategori, 
        umur_saat_periksa: dataUmur.tahun,
        status: VISIT_STATUS.POS1_COMPLETE,
        status_antrian: STATUS_MAPPING.POS2, 
        tanggal_kunjungan: nowTimestamp(),
        pasien_snapshot: buildPatientSnapshot({
            nama: formData.nama,
            gender: formData.j_kelamin,
            birthDate: formData.tgl_lahir,
            desa: formData.desa,
            dusun: formData.dusun,
            phone: formData.no_hp,
            status: (dataUmur.kategori === 'Bayi' || dataUmur.kategori === 'Balita' || dataUmur.kategori === 'SD' || dataUmur.kategori === 'SMP' || dataUmur.kategori === 'SMA') ? '-' : formData.status_perkawinan
        }), 
        petugas_pos1: namaPetugas,
        petugas_aktif: null,
        ...(ocrMeta ? { ocrMeta } : {})
      });
      await writeAuditLog({
        action: 'Registrasi pasien Pos 1 dan lanjut ke Pos 2',
        module: 'Pos 1',
        visitId: pasienAktif.id,
        patientKey: identityKey || finalNik,
        after: {
          patientNIK: finalNik,
          patient_identity_key: identityKey || null,
          status: VISIT_STATUS.POS1_COMPLETE,
          status_antrian: STATUS_MAPPING.POS2
        }
      });
      
      setPesan(`✅ Registrasi berhasil! Pasien diarahkan ke POS 2.`);
      setPasienAktif(null);
      setFormData({
        nik: '', nama: '', status_perkawinan: 'Belum Kawin', tgl_lahir: '', j_kelamin: 'P', no_hp: '', desa: 'Desa Malimpung', dusun: 'Dusun Palita',
        nik_wali: '', nama_wali: '', tgl_lahir_wali: '', hubungan_wali: 'Ibu', no_hp_wali: ''
      });
      setTglLahirView(''); setTglLahirWaliView(''); setTanpaNik(false);
      setOcrReview(null);
      setOcrMeta(null);
      setDataUmur({ tahun: 0, bulan: 0, totalBulan: 0, kategori: '-' });
      setStatusPasien('idle'); setRiwayatKunjungan([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { setPesan('❌ Gagal menyimpan data: ' + error.message); } finally { setLoading(false); }
  };

  return (
    <div className="pos1-page space-y-4 max-w-4xl mx-auto px-2 md:px-0 relative z-10">
      
      {/* OVERLAY KAMERA KTP */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col justify-center items-center">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={processCanvasRef} className="hidden" />
            
            {facingMode === 'environment' && (
              <button onClick={async () => {
                  try {
                    const track = videoRef.current.srcObject.getVideoTracks()[0];
                    await track.applyConstraints({ advanced: [{ torch: !isTorchOn }] });
                    setIsTorchOn(!isTorchOn);
                  } catch (e) { alertDialog({ title: 'Senter tidak didukung', message: 'Kamera atau browser ini tidak mendukung fitur senter.', variant: 'warning' }); }
              }} className={`absolute top-8 right-6 z-30 p-3.5 rounded-full backdrop-blur-md border transition-all active:scale-90 shadow-xl ${isTorchOn ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-black/60 text-white border-white/20'}`}>
                <span className="text-2xl block">🔦</span>
              </button>
            )}

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
                <div className={`w-[90%] max-w-sm aspect-[1.58/1] relative box-content ring-[9999px] ring-black/75 rounded-2xl overflow-hidden transition-all duration-300 ${kameraStatus === 'aligned' ? 'border-emerald-500 scale-105' : 'border-amber-400'}`}>
                    <div className={`absolute inset-0 border-[3px] border-dashed rounded-2xl flex items-center justify-center transition-colors ${kameraStatus === 'aligned' ? 'border-emerald-400 bg-emerald-500/20' : (kameraStatus === 'ready' ? 'border-amber-400 bg-amber-500/10' : 'border-slate-400 bg-black/10')}`}>
                         <div className="relative z-10 text-center bg-black/60 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-2xl">
                             <p className={`font-black tracking-widest uppercase text-xs drop-shadow-md ${kameraStatus === 'aligned' ? 'text-emerald-400 animate-pulse' : (kameraStatus === 'ready' ? 'text-amber-400' : 'text-slate-300')}`}>
                               {kameraStatus === 'aligned' ? '✅ TAHAN POSISI...' : (kameraStatus === 'ready' ? 'Posisikan KTP ke Kotak' : 'Fokus Kamera...')}
                             </p>
                             <p className="text-white font-bold text-[9px] mt-1.5 opacity-80">{kameraStatus === 'aligned' ? 'Otomatis memfoto...' : 'Pastikan garis KTP pas'}</p>
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-[80px] md:bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-sm flex justify-between items-center bg-black/50 backdrop-blur-xl border border-white/10 px-6 py-5 rounded-[2rem] z-20 shadow-2xl pointer-events-auto">
                <button onClick={stopCamera} className="text-white flex flex-col items-center justify-center w-14 gap-1.5 hover:text-rose-400 transition active:scale-90">
                    <span className="text-2xl font-light block">✕</span><span className="text-[9px] font-bold tracking-wider">BATAL</span>
                </button>
                <button onClick={captureImage} className="w-20 h-20 rounded-full flex items-center justify-center border-4 bg-white/10 border-white active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">
                    <div className={`w-16 h-16 rounded-full shadow-inner ${kameraStatus === 'aligned' ? 'bg-emerald-400' : 'bg-white'}`}></div>
                </button>
                <button onClick={() => { setFacingMode(facingMode === 'environment' ? 'user' : 'environment'); startCamera(facingMode === 'environment' ? 'user' : 'environment'); }} className="text-white flex flex-col items-center justify-center w-14 gap-1.5 hover:text-blue-400 transition active:scale-90">
                    <span className="text-2xl block">🔄</span><span className="text-[9px] font-bold tracking-wider">GANTI</span>
                </button>
            </div>
        </div>
      )}

      {/* HEADER & DAFTAR ANTREAN */}
      {!pasienAktif ? (
        <>
            <div className="pos-hero flex flex-col md:flex-row md:justify-between md:items-center bg-white/70 backdrop-blur-lg p-5 rounded-[2rem] shadow-sm border border-white/60 mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><span className="text-3xl block">🪪</span></div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pos 1: Registrasi</h2>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Identifikasi Pasien</p>
                    </div>
                </div>
            </div>

            {pesan && <div className={`p-4 rounded-xl font-bold flex items-center gap-3 text-xs md:text-sm shadow-sm mb-4 animate-fade-in-up ${pesan.includes('❌') || pesan.includes('⚠️') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}><span>{pesan}</span></div>}

            <QueueCallList
              queue={antrian}
              onCall={handlePanggil}
              callingVisitId={callingVisitId}
            />
            <div className="hidden pos1-queue-panel bg-white/70 backdrop-blur-lg p-6 rounded-[2rem] shadow-sm border border-white/60">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-200/60 pb-3">Daftar Panggilan Pasien ({antrian.length})</h3>
              {antrian.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200"><span className="text-5xl block mb-3 opacity-30">☕</span><p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Tidak ada pasien menunggu</p></div>
              ) : (
                <div className="pos1-queue-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {antrian.map((item) => (
                    <button type="button" key={item.id} disabled={Boolean(callingVisitId)} className="queue-card border border-slate-200/60 p-5 rounded-3xl flex flex-col justify-between items-center bg-white hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group disabled:cursor-wait disabled:opacity-60" onClick={() => handlePanggil(item)}>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-blue-500">Antrean</p>
                      <p className="queue-number font-black text-slate-800 group-hover:text-blue-600 text-4xl font-mono my-2">{item.nomor_antrian}</p>
                      <div className="queue-call-btn w-full bg-slate-100 group-hover:bg-blue-600 text-slate-500 group-hover:text-white text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">{callingVisitId === item.id ? 'Memanggil...' : 'Panggil ➔'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
        </>
      ) : (

      // FORMULIR PENGISIAN POS 1
      <>
      <div className="pos1-form-shell bg-white/90 backdrop-blur-lg rounded-[2rem] shadow-xl border border-white/60 overflow-hidden animate-fade-in-up">
        
        <div className="pos1-active-banner bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Melayani Antrean</p>
              <h2 className="pos1-active-number text-5xl font-black font-mono tracking-tighter drop-shadow-md">{pasienAktif.nomor_antrian}</h2>
            </div>
            <button type="button" onClick={() => setPasienAktif(null)} className="pos1-cancel-btn relative z-10 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-bold text-xs transition border border-white/20 flex items-center gap-1.5 active:scale-95 shadow-sm">x Batalkan</button>
        </div>

        <form id="pos1-registration-form" onSubmit={handleSubmit} className="pos1-form p-6 md:p-8 space-y-6">
          {pesan && <div className={`p-4 rounded-xl font-bold text-xs shadow-sm ${pesan.includes('❌') || pesan.includes('⚠️') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{pesan}</div>}

          {statusPasien === 'lama' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[1.5rem] p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-emerald-100 pb-4 mb-4">
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Pasien Lama Terdeteksi</p>
                  <h3 className="font-black text-slate-800 text-lg leading-tight">Pasien memiliki riwayat kunjungan</h3>
                  <p className="text-xs font-bold text-emerald-700 mt-1">Identitas otomatis dimuat. Periksa riwayat terakhir sebelum lanjut ke Pos 2.</p>
                </div>
                <div className="bg-white text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest w-max">
                  {riwayatKunjungan.length} Riwayat
                </div>
              </div>

              <div className="grid gap-2">
                {riwayatKunjungan.map((visit) => (
                  <div key={visit.id} className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-black text-slate-800 text-sm">{formatTanggalKunjungan(visit)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{visit.jalur_pemeriksaan || 'Kunjungan Pos'} - {visit.nomor_antrian || '-'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{visit.status_antrian || '-'}</span>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{visit.kategori_usia_satusehat || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {statusPasien === 'terdaftar' && (
            <div className="bg-teal-50 border border-teal-200 rounded-[1.5rem] p-5 shadow-sm">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mb-1">Master Pasien Ditemukan</p>
              <h3 className="font-black text-slate-800 text-lg leading-tight">Identitas pasien sudah ada</h3>
              <p className="text-xs font-bold text-teal-700 mt-1">Belum ada riwayat kunjungan sebelumnya. Data identitas dimuat agar petugas tidak mengetik ulang.</p>
            </div>
          )}

          {statusPasien === 'baru' && (
            <div className="bg-sky-50 border border-sky-200 rounded-[1.5rem] p-5 shadow-sm">
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-1">Pasien Baru</p>
              <h3 className="font-black text-slate-800 text-lg leading-tight">NIK belum pernah terdaftar</h3>
              <p className="text-xs font-bold text-sky-700 mt-1">Lengkapi identitas pasien, lalu sistem akan membuat master pasien baru saat disimpan.</p>
            </div>
          )}

          <div className="form-section bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100 shadow-inner">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 pb-4">
                  <div>
                      <h3 className="text-xl font-black text-slate-800">Identifikasi Pasien</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sesuai KTP / KK</p>
                  </div>
                  <div className="flex w-full sm:w-auto gap-2">
                      <button type="button" onClick={() => startCamera()} className={`pos1-scan-btn flex-1 sm:flex-none min-h-[44px] px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95 bg-slate-800 hover:bg-slate-900 text-white`}><Camera className="h-4 w-4" aria-hidden="true" /> Scan E-KTP</button>
                      <button type="button" onClick={() => fileInputRef.current.click()} className="pos1-upload-btn flex-1 sm:flex-none bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 min-h-[44px] px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95"><UploadCloud className="h-4 w-4" aria-hidden="true" /> Unggah KTP</button>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  </div>
              </div>

              {ocrLoading && (
                  <div className="mb-6 p-4 bg-teal-600 text-white rounded-2xl shadow-inner flex items-center gap-4 animate-pulse">
                      <span className="text-2xl animate-spin">⚙️</span>
                      <div className="flex-1">
                          <p className="font-bold text-sm">Mesin AI Membaca Teks...</p>
                          <p className="text-[10px] opacity-80 uppercase tracking-widest mt-1">Mengekstrak ({ocrProgress}%)</p>
                      </div>
                  </div>
              )}

              <OcrResultReview
                  result={ocrReview}
                  onUse={() => {
                      if (applyOcrData(ocrReview, ocrReview?.source || 'OCR')) setOcrReview(null);
                  }}
                  onCancel={() => setOcrReview(null)}
              />

              {ocrCandidates.length > 0 && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3">Pilih Anggota dari Kartu Keluarga</p>
                      <div className="grid gap-2">
                          {ocrCandidates.map((candidate, index) => (
                              <button
                                  key={`${candidate.nik || 'nik'}-${index}`}
                                  type="button"
                                  onClick={() => { applyOcrData(candidate, 'OCR Kartu Keluarga'); setOcrCandidates([]); setOcrReview(null); }}
                                  className="w-full text-left bg-white hover:bg-amber-100 border border-amber-200 rounded-xl p-3 transition active:scale-[0.99]"
                              >
                                  <span className="block text-sm font-black text-slate-800">{candidate.nama || 'Nama belum terbaca'}</span>
                                  <span className="block text-[11px] font-bold text-slate-500 mt-1">NIK: {candidate.nik || '-'} • Lahir: {candidate.tgl_lahir || candidate.tanggalLahir || '-'}</span>
                                  <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-amber-700">Confidence: {Math.round(Number(candidate.confidence || 0) * (Number(candidate.confidence || 0) <= 1 ? 100 : 1))}%</span>
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              <div className="form-grid grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                  <div className="form-group-heading md:col-span-2">
                    <p>Identitas Utama</p>
                    <span>NIK, nama, tanggal lahir, dan jenis kelamin</span>
                  </div>
                  <div>
                      <InputCustom type="tel" label={isChildCategory(dataUmur.kategori) ? "NIK Wali (16 digit)" : "NIK Pasien (16 digit)"} name="nik" value={formData.nik} onChange={handleChange} disabled={tanpaNik} placeholder={tanpaNik ? "Auto-generate setelah simpan" : "16 digit NIK"} required={!tanpaNik} maxLength="16" autoComplete="off" error={getFieldError('nik')} hint={tanpaNik ? 'Untuk bayi/anak tanpa NIK, sistem memakai data wali.' : 'Ketik angka saja. Data master pasien dicari otomatis.'} />
                      <label className="flex items-center space-x-3 mt-3 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition shadow-sm w-max">
                          <input type="checkbox" checked={tanpaNik} onChange={handleTanpaNikChange} className="rounded border-slate-300 text-teal-600 w-4 h-4"/>
                          <div>
                              <span className="text-[11px] font-black text-slate-700 block">Belum Punya NIK?</span>
                              <span className="text-[9px] text-slate-500">(Khusus Bayi/Anak)</span>
                          </div>
                      </label>
                  </div>
                  
                  <div><InputCustom label="Nama Lengkap" name="nama" value={formData.nama} onChange={handleChange} required={true} placeholder="Sesuai KTP..." autoComplete="name" /></div>

                  {tanpaNik && (
                      <div className="md:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 p-5 md:p-6 rounded-2xl border border-amber-200 space-y-4 shadow-inner mt-2 animate-fade-in-up">
                          <div className="border-b border-amber-200 pb-3 flex items-center gap-3">
                              <span className="text-2xl bg-white p-2 rounded-xl shadow-sm border border-amber-100">👨‍👩‍👧</span>
                              <div>
                                  <h4 className="font-black text-amber-900 text-sm">Data Wali Pendamping</h4>
                                  <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mt-0.5">Wajib untuk SATUSEHAT</p>
                              </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div><InputCustom type="tel" label="NIK Wali (16 digit)" name="nik_wali" value={formData.nik_wali} onChange={handleChange} required={true} placeholder="16 digit" maxLength="16" autoComplete="off" error={getFieldError('nik_wali')} /></div>
                              <div><InputCustom label="Nama Wali" name="nama_wali" value={formData.nama_wali} onChange={handleChange} required={true} placeholder="Nama lengkap wali..." autoComplete="name" /></div>
                              <div>
                                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Tgl Lahir Wali *</label>
                                  <input type="tel" inputMode="numeric" pattern="[0-9/]*" value={tglLahirWaliView} onChange={(e) => handleDateMaskChange(e, 'tgl_lahir_wali')} placeholder="DD/MM/YYYY" maxLength="10" required={true} aria-invalid={Boolean(getFieldError('tgl_lahir_wali'))} className={`w-full min-h-[44px] rounded-xl p-3 border focus:border-teal-500 bg-white font-bold text-base md:text-sm outline-none ${getFieldError('tgl_lahir_wali') ? 'border-rose-300' : 'border-slate-200'}`} />
                                  {getFieldError('tgl_lahir_wali') && <p className="mt-1.5 text-[11px] font-bold text-rose-600">{getFieldError('tgl_lahir_wali')}</p>}
                              </div>
                              <div>
                                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Hubungan</label>
                                  <select name="hubungan_wali" value={formData.hubungan_wali} onChange={handleChange} className="w-full min-h-[44px] rounded-xl border-slate-200 px-3 border focus:border-teal-500 bg-white font-bold text-sm text-slate-700 outline-none"><option value="Ayah">Ayah</option><option value="Ibu">Ibu</option><option value="Kakek-Nenek">Kakek/Nenek</option><option value="Lainnya">Lainnya</option></select>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="age-helper-panel md:col-span-2 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col md:flex-row gap-5 items-center mt-2">
                      <div className="w-full md:w-1/2">
                          <label className="block text-[11px] font-black text-blue-600 mb-2 uppercase tracking-widest">Tanggal Lahir Pasien *</label>
                          <input type="tel" inputMode="numeric" pattern="[0-9/]*" value={tglLahirView} onChange={(e) => handleDateMaskChange(e, 'tgl_lahir')} placeholder="DD/MM/YYYY" maxLength="10" required={true} aria-invalid={Boolean(getFieldError('tgl_lahir'))} className={`w-full min-h-[50px] rounded-xl shadow-inner p-3 md:p-4 border focus:border-blue-500 font-black text-blue-700 text-xl text-center tracking-widest bg-white outline-none ${getFieldError('tgl_lahir') ? 'border-rose-300' : 'border-blue-200'}`} />
                          {getFieldError('tgl_lahir') && <p className="mt-1.5 text-center text-[11px] font-bold text-rose-600">{getFieldError('tgl_lahir')}</p>}
                      </div>
                      <div className="w-full md:w-1/2 md:border-l border-blue-200 md:pl-6 flex flex-col justify-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 text-center md:text-left">Kalkulasi Usia Otomatis:</p>
                          {dataUmur.kategori !== '-' ? (
                              <div className="flex items-center justify-center md:justify-start gap-3">
                                  <span className="text-3xl font-black text-slate-800 leading-none">{dataUmur.kategori}</span>
                                  <span className="bg-teal-100 text-teal-700 font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest shadow-sm border border-teal-200">{dataUmur.kategori === 'Bayi' ? `${dataUmur.totalBulan} Bulan` : `${dataUmur.tahun} Tahun`}</span>
                              </div>
                          ) : <span className="smart-helper-card text-slate-500 font-bold text-sm text-center md:text-left block">Usia otomatis akan dihitung setelah tanggal lahir dipilih</span>}
                      </div>
                  </div>

                  <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Jenis Kelamin</label>
                      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 min-h-[52px]">
                          <button type="button" onClick={() => setFormData({...formData, j_kelamin: 'L'})} className={`gender-option gender-male flex-1 text-xs font-black rounded-lg transition-all ${formData.j_kelamin === 'L' ? 'gender-active-male' : 'text-slate-500 hover:bg-white'}`}>LAKI-LAKI</button>
                          <button type="button" onClick={() => setFormData({...formData, j_kelamin: 'P'})} className={`gender-option gender-female flex-1 text-xs font-black rounded-lg transition-all ${formData.j_kelamin === 'P' ? 'gender-active-female' : 'text-slate-500 hover:bg-white'}`}>PEREMPUAN</button>
                      </div>
                  </div>

                  <div className="form-group-heading md:col-span-2">
                    <p>Kontak & Domisili</p>
                    <span>Nomor kontak dan lokasi layanan pasien</span>
                  </div>

                  {dataUmur.kategori !== 'Bayi' && dataUmur.kategori !== 'Balita' && dataUmur.kategori !== 'SD' && dataUmur.kategori !== 'SMP' && dataUmur.kategori !== 'SMA' && (
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Status Perkawinan</label>
                        <select name="status_perkawinan" value={formData.status_perkawinan} onChange={handleChange} className="w-full min-h-[44px] rounded-xl border-slate-200 px-3 border focus:border-teal-500 bg-white font-bold text-sm text-slate-700 outline-none">
                            <option value="Belum Kawin">Belum Kawin</option><option value="Kawin">Kawin</option><option value="Cerai Hidup">Cerai Hidup</option><option value="Cerai Mati">Cerai Mati</option>
                        </select>
                    </div>
                  )}
                  <div><InputCustom label="No. HP / WhatsApp" name="no_hp" value={formData.no_hp} onChange={handleChange} type="tel" placeholder="08..." autoComplete="tel" hint="Opsional, angka saja." /></div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 gap-4 bg-white p-5 rounded-2xl border border-slate-200 mt-2 shadow-sm md:grid-cols-2">
                      <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Desa/Kelurahan Domisili</label>
                          <select name="desa" value={formData.desa} onChange={handleChange} className="w-full min-h-[44px] rounded-xl border-slate-200 px-3 border focus:border-teal-500 bg-slate-50 font-bold text-sm text-slate-700 outline-none">
                              {Object.keys(WILAYAH_KERJA).map(desa => (<option key={desa} value={desa}>{desa}</option>))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Dusun/Posyandu</label>
                          <select name="dusun" value={formData.dusun} onChange={handleChange} className="w-full min-h-[44px] rounded-xl border-slate-200 px-3 border focus:border-teal-500 bg-slate-50 font-bold text-sm text-slate-700 outline-none">
                              {WILAYAH_KERJA[formData.desa]?.map(dusun => (<option key={dusun} value={dusun}>{dusun}</option>))}
                          </select>
                      </div>
                  </div>
              </div>
          </div>

          <div className="form-section rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Checklist sebelum lanjut</p>
            <div className="validation-chip-list grid gap-2 sm:grid-cols-2">
              {readinessItems.map((item) => (
                <div key={item.label} className={`validation-chip rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider ${item.done ? 'border-teal-100 bg-teal-50 text-teal-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                  {item.done ? 'OK' : 'Perlu'} - {item.label}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading || ocrLoading} className="pos1-save-btn w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-sm uppercase tracking-widest py-5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><span className="animate-spin">...</span> MENYIMPAN DATA...</> : 'SIMPAN & LANJUT POS 2'}
          </button>
        </form>
      </div>
      <div className="workflow-action-bar pos1-floating-action-bar pos-bottom-action-bar form-action-row md:hidden">
        <button type="button" className="secondary-action" disabled>
          Draft Otomatis
        </button>
        <button type="submit" form="pos1-registration-form" className="primary-action" disabled={loading || ocrLoading}>
          {loading ? 'Menyimpan...' : 'Lanjut Pos 2'}
        </button>
      </div>
      </>
      )}
    </div>
  );
}

export default Pos1;
