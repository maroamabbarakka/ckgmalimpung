import { useState, useEffect, useRef } from 'react';
import { useSmartDocumentScan } from '../hooks/useSmartDocumentScan.js';
import { validateIdentity } from '../utils/identityValidation.js';
import { resolveWilayahKerja } from '../utils/wilayahMalimpung.js';

export default function SmartDocumentScanner({ onDataExtracted, onClose }) {
  const ocr = useSmartDocumentScan();
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // State untuk form preview hasil scan yang editable
  const [editableData, setEditableData] = useState({
    nik: '',
    nama: '',
    jenisKelamin: '',
    tanggalLahir: '',
    alamatDusun: '',
    desaKelurahan: '',
    statusWilayah: ''
  });
  const [validationErrors, setValidationErrors] = useState([]);

  // Sinkronisasi data ketika OCR selesai
  useEffect(() => {
    if (ocr.result?.data) {
      setEditableData({
        nik: ocr.result.data.nik || '',
        nama: ocr.result.data.nama || '',
        jenisKelamin: ocr.result.data.jenisKelamin || '',
        tanggalLahir: ocr.result.data.tanggalLahir || '',
        alamatDusun: ocr.result.data.alamatDusun || '',
        desaKelurahan: ocr.result.data.desaKelurahan || '',
        statusWilayah: ocr.result.data.statusWilayah || 'perlu_konfirmasi'
      });
      setShowPreview(true);
      setCameraActive(false);
    }
  }, [ocr.result]);

  // Mengelola inisialisasi stream kamera ketika cameraActive atau facingMode berubah
  useEffect(() => {
    let active = true;
    if (cameraActive) {
      ocr.startCamera(facingMode).then(success => {
        if (!success && active) {
          setCameraActive(false);
        }
      });
    } else {
      ocr.stopCamera();
      setTorchEnabled(false);
    }
    return () => {
      active = false;
      ocr.stopCamera();
    };
  }, [cameraActive, facingMode]);

  // Handler Kamera
  const handleStartCamera = () => {
    setCameraActive(true);
    setShowPreview(false);
    ocr.reset();
  };

  const handleStopCamera = () => {
    setCameraActive(false);
  };

  const handleToggleFacingMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
  };

  const handleToggleTorch = async () => {
    if (ocr.videoRef.current?.srcObject) {
      const track = ocr.videoRef.current.srcObject.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled }]
        });
        setTorchEnabled(!torchEnabled);
      } catch (err) {
        console.log('Senter tidak didukung pada kamera/browser ini.');
      }
    }
  };

  const handleCapture = async () => {
    const base64 = await ocr.captureFromCamera();
    if (base64) {
      handleStopCamera();
      await ocr.processImage(base64, 'camera');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleStopCamera();
      await ocr.processFile(file);
    }
  };

  // Handler Perubahan Form Preview
  const handleFieldChange = (fieldName, value) => {
    setEditableData(prev => {
      const updated = { ...prev, [fieldName]: value };
      
      // Jika desaKelurahan berubah, otomatis hitung statusWilayah
      if (fieldName === 'desaKelurahan') {
        const resolved = resolveWilayahKerja(value);
        updated.statusWilayah = resolved.statusWilayah;
        // Gunakan canonical name jika matched
        if (resolved.matched) {
          updated.desaKelurahan = resolved.desaKelurahan;
        }
      }
      
      return updated;
    });
  };

  // Kirim data terverifikasi ke form utama
  const handleUseData = () => {
    // Validasi data
    const validation = validateIdentity(editableData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    if (onDataExtracted) {
      // Petakan field sesuai form Pos 1 / Loket
      onDataExtracted({
        nik: editableData.nik,
        nama: editableData.nama,
        jenisKelamin: editableData.jenisKelamin,
        tanggalLahir: editableData.tanggalLahir,
        alamatDusun: editableData.alamatDusun,
        desaKelurahan: editableData.desaKelurahan,
        statusWilayah: editableData.statusWilayah
      });
    }
    
    // Reset dan tutup
    ocr.reset();
    onClose();
  };

  const handleRetry = () => {
    ocr.reset();
    setShowPreview(false);
    setValidationErrors([]);
    handleStartCamera();
  };

  const handleClose = () => {
    handleStopCamera();
    ocr.reset();
    onClose();
  };

  // Menentukan tingkat keyakinan (Confidence)
  const getConfidenceLevel = () => {
    if (!ocr.result) return { label: '-', color: 'text-slate-400 bg-slate-100' };
    const conf = ocr.result.confidence;
    const isGemini = ocr.result.engine === 'gemini';
    const minThreshold = isGemini ? 0.65 : 0.50;

    if (conf >= 0.85) {
      return { label: 'Tinggi', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
    } else if (conf >= minThreshold) {
      return { label: 'Sedang', color: 'text-amber-700 bg-amber-100 border-amber-200' };
    } else {
      return { label: 'Rendah', color: 'text-rose-700 bg-rose-100 border-rose-200' };
    }
  };

  const confidence = getConfidenceLevel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md animate-fade-in no-print">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700 bg-[#0f172a] shadow-2xl text-slate-100 animate-fade-in-up">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-purple-900 px-6 py-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
              ✨ Smart Scan Dokumen
            </h2>
            <button 
              onClick={handleClose}
              className="rounded-full bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
            Ambil foto atau unggah gambar dokumen. Sistem akan mencoba membaca NIK, nama, jenis kelamin, tanggal lahir, alamat/dusun, dan desa/kelurahan. Periksa kembali hasil scan sebelum digunakan.
          </p>
        </div>

        {/* Content Area */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          
          {/* Error Message */}
          {ocr.error && (
            <div className="rounded-2xl border border-rose-800 bg-rose-950/50 p-4 text-rose-300 text-xs font-semibold">
              ⚠️ {ocr.error}
            </div>
          )}

          {/* LOADING STATE */}
          {ocr.isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-blue-500"></div>
                <span className="absolute text-xs font-black text-blue-400">{ocr.progress}%</span>
              </div>
              <div className="text-center">
                <h4 className="font-black text-white text-sm">
                  {ocr.activeEngine === 'gemini' ? 'Menganalisis dengan Gemini 2.5 Flash...' : 'Memproses OCR lokal (Tesseract)...'}
                </h4>
                <p className="text-slate-400 text-xs mt-1">Mohon tunggu sebentar, sedang mengekstrak data identitas.</p>
              </div>
            </div>
          )}

          {/* CAMERA / FILE UPLOAD SCREEN */}
          {!ocr.isLoading && !showPreview && (
            <div className="space-y-4">
              
              {/* Kamera aktif */}
              {cameraActive ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800">
                  <video 
                    ref={ocr.videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={ocr.canvasRef} className="hidden" />

                  {/* Visual Guide Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                    <div className="w-full max-w-md aspect-[1.58/1] border-2 border-dashed border-yellow-400/70 rounded-2xl bg-slate-900/10 shadow-[0_0_0_999px_rgba(15,23,42,0.4)]"></div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 rounded-full bg-red-600/90 text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider animate-pulse">
                    LIVE CAMERA
                  </div>

                  {/* Torch Toggle */}
                  {facingMode === 'environment' && (
                    <button 
                      onClick={handleToggleTorch}
                      className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md border transition-all active:scale-95 ${
                        torchEnabled ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-black/60 text-white border-white/20'
                      }`}
                    >
                      🔦
                    </button>
                  )}
                </div>
              ) : (
                /* Upload Area */
                <div 
                  onClick={() => document.getElementById('scan-file-upload')?.click()}
                  className="group rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 hover:border-blue-500 transition duration-300 py-10 flex flex-col items-center justify-center cursor-pointer"
                >
                  <span className="text-4xl group-hover:scale-110 transition duration-300">📄</span>
                  <h4 className="font-bold text-white mt-3 text-sm">Pilih Gambar atau Ambil Foto</h4>
                  <p className="text-slate-400 text-xs mt-1">Mendukung KTP, KK, BPJS, JKN</p>
                  <input 
                    id="scan-file-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </div>
              )}

              {/* Kamera Kontrol */}
              <div className="grid grid-cols-2 gap-3">
                {!cameraActive ? (
                  <button 
                    onClick={handleStartCamera}
                    className="col-span-2 min-h-[50px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    📷 Aktifkan Kamera
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleCapture}
                      className="col-span-2 min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      📸 Ambil Foto Dokumen
                    </button>
                    
                    <button 
                      onClick={handleToggleFacingMode}
                      className="min-h-[46px] bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition active:scale-95 flex items-center justify-center gap-2 text-xs"
                    >
                      🔄 Balik Kamera
                    </button>
                    
                    <button 
                      onClick={handleStopCamera}
                      className="min-h-[46px] bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold rounded-xl transition active:scale-95 flex items-center justify-center gap-2 text-xs border border-rose-800"
                    >
                      ✕ Tutup Kamera
                    </button>
                  </>
                )}
              </div>

              {/* Panduan Visual */}
              <div className="rounded-2xl bg-slate-800/30 border border-slate-800 p-4 space-y-2.5">
                <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-wider">💡 Panduan Pemotretan Dokumen</h5>
                <ul className="text-slate-300 text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
                  <li>Letakkan dokumen pada permukaan datar</li>
                  <li>Pastikan cahaya ruangan cukup terang</li>
                  <li>Pastikan NIK dan nama terlihat jelas dan tidak buram</li>
                  <li>Hindari pantulan cahaya langsung pada permukaan dokumen</li>
                  <li>Foto seluruh bagian kartu/dokumen dengan pas</li>
                </ul>
              </div>
            </div>
          )}

          {/* EDITABLE PREVIEW RESULTS */}
          {showPreview && ocr.result && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Hasil Metadata Card */}
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700 p-4 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi OCR</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white font-black text-sm">{ocr.result.documentType}</span>
                    <span className="text-slate-500 font-bold text-xs">•</span>
                    <span className="text-slate-300 font-semibold text-xs">Mesin: {ocr.result.engine === 'gemini' ? 'Gemini 2.5 Flash' : 'Tesseract Lokal'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tingkat Keyakinan</h5>
                    <span className={`inline-block rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider mt-1.5 ${confidence.color}`}>
                      {confidence.label} ({(ocr.result.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {ocr.result.warnings.length > 0 && (
                <div className="rounded-2xl border border-amber-900 bg-amber-950/40 p-4">
                  <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-wider">⚠️ Perlu Pengecekan Petugas</h5>
                  <ul className="text-amber-300 text-xs space-y-1 list-disc list-inside mt-2 font-semibold">
                    {ocr.result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Input Editable */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-white border-l-4 border-blue-500 pl-3">Koreksi Data Hasil Scan</h4>
                
                {validationErrors.length > 0 && (
                  <div className="rounded-xl bg-rose-950/60 border border-rose-800 p-3 text-rose-300 text-xs font-semibold space-y-1">
                    {validationErrors.map((err, idx) => (
                      <p key={idx}>• {err}</p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* NIK */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">NIK (16 Digit)</label>
                    <input 
                      type="text" 
                      value={editableData.nik}
                      onChange={(e) => handleFieldChange('nik', e.target.value.replace(/\D/g, '').substring(0, 16))}
                      placeholder="Masukkan NIK..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white font-bold p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Nama */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={editableData.nama}
                      onChange={(e) => handleFieldChange('nama', e.target.value.toUpperCase())}
                      placeholder="Masukkan nama lengkap..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white font-bold p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Jenis Kelamin</label>
                    <select 
                      value={editableData.jenisKelamin}
                      onChange={(e) => handleFieldChange('jenisKelamin', e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white font-bold p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="">Pilih...</option>
                      <option value="LAKI-LAKI">👨 LAKI-LAKI</option>
                      <option value="PEREMPUAN">👩 PEREMPUAN</option>
                    </select>
                  </div>

                  {/* Tanggal Lahir */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Lahir</label>
                    <input 
                      type="date" 
                      value={editableData.tanggalLahir}
                      onChange={(e) => handleFieldChange('tanggalLahir', e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white font-bold p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Alamat Dusun */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Alamat / Dusun</label>
                    <input 
                      type="text" 
                      value={editableData.alamatDusun}
                      onChange={(e) => handleFieldChange('alamatDusun', e.target.value.toUpperCase())}
                      placeholder="Masukkan Dusun/Jalan..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white font-bold p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Desa/Kelurahan */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Desa / Kelurahan</label>
                    <select 
                      value={editableData.desaKelurahan}
                      onChange={(e) => handleFieldChange('desaKelurahan', e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white font-bold p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="">Pilih...</option>
                      <option value="Desa Malimpung">DESA MALIMPUNG</option>
                      <option value="Desa Padang Loang">DESA PADANG LOANG</option>
                      <option value="Kelurahan Maccirinna">KELURAHAN MACCIRINNA</option>
                      <option value="Luar Wilayah">LUAR WILAYAH</option>
                    </select>
                  </div>

                  {/* Status Wilayah (Read-only status info) */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Status Wilayah</label>
                    <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider text-center">
                      {editableData.statusWilayah === 'wilayah_kerja' && '🟢 Wilayah Kerja'}
                      {editableData.statusWilayah === 'luar_wilayah' && '🟡 Luar Wilayah'}
                      {editableData.statusWilayah === 'perlu_konfirmasi' && '⚪ Perlu Konfirmasi'}
                      {!editableData.statusWilayah && '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Visual Mandatori */}
              <p className="text-[10px] font-black text-rose-400 text-center uppercase tracking-wider">
                📢 Periksa kembali data dengan dokumen asli sebelum digunakan.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={handleUseData}
                  className="min-h-[50px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-emerald-500/10 transition active:scale-95"
                >
                  ✓ Gunakan Data ke Form
                </button>
                
                <button 
                  onClick={handleRetry}
                  className="min-h-[50px] bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl transition active:scale-95"
                >
                  🔄 Scan Ulang
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-white text-xs font-bold transition"
          >
            Batal
          </button>
          
          <button 
            onClick={handleClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 transition active:scale-95"
          >
            Isi Manual
          </button>
        </div>

      </div>
    </div>
  );
}
