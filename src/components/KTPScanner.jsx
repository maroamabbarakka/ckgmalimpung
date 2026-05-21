import { useState, useEffect } from 'react';
import useKTPOCR from '../useKTPOCR';

/**
 * KTPScanner Component
 * Complete UI untuk scanning KTP dengan:
 * - Live camera preview
 * - Manual capture & file upload
 * - Real-time OCR processing
 * - Data validation & display
 */

export const KTPScanner = ({ 
  onDataExtracted, 
  backendUrl = 'http://localhost:8000',
  initialData = null 
}) => {
  const ocr = useKTPOCR(backendUrl);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Initialize with provided data
  useEffect(() => {
    if (initialData) {
      // Can preload data if needed
    }
  }, [initialData]);

  // ==================== CAMERA CONTROLS ====================

  const handleStartCamera = async () => {
    const success = await ocr.startCamera(facingMode);
    if (success) {
      setCameraActive(true);
      setShowResult(false);
    }
  };

  const handleStopCamera = () => {
    ocr.stopCamera();
    setCameraActive(false);
  };

  const handleToggleFacingMode = () => {
    handleStopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => handleStartCamera(), 500);
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
        console.log('Torch tidak tersedia');
      }
    }
  };

  // ==================== CAPTURE & PROCESS ====================

  const handleCapture = async () => {
    const base64 = await ocr.captureFromCamera();
    if (base64) {
      setShowResult(true);
      handleStopCamera();
      await ocr.processImage(base64);
    }
  };

  const handleFileUpload = async (file) => {
    if (file) {
      setCameraActive(false);
      setShowResult(true);
      await ocr.processFile(file);
    }
  };

  const handleAcceptData = () => {
    if (ocr.result?.data && onDataExtracted) {
      onDataExtracted(ocr.result.data);
    }
  };

  const handleRetry = () => {
    ocr.reset();
    setShowResult(false);
  };

  // ==================== RENDER ====================

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
        <h2 className="font-black text-xl flex items-center gap-3">
          📸 Scanner KTP / Identitas
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {ocr.result ? '✅ Data berhasil diekstrak' : 'Ambil foto KTP dengan kualitas baik'}
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-4">
        {/* Backend Status */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
          <span className={`w-3 h-3 rounded-full ${ocr.useBackend ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          <span className="text-slate-700 font-bold flex-1">
            {ocr.useBackend ? '🚀 Backend PaddleOCR' : '🌐 Browser Tesseract'}
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ocr.useBackend}
              onChange={(e) => ocr.setUseBackend(e.target.checked)}
              disabled={ocr.isLoading}
              className="w-4 h-4"
            />
            <span className="text-xs">Gunakan Backend</span>
          </label>
        </div>

        {/* Camera Preview */}
        {!showResult && (
          <div className="space-y-3">
            {/* Video/Camera View */}
            {cameraActive ? (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={ocr.videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={ocr.canvasRef} className="hidden" />

                {/* Camera Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-yellow-400 rounded-lg w-4/5 aspect-video opacity-70"></div>
                </div>

                {/* Camera Status Badge */}
                <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <span className="animate-pulse">●</span> REC
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-slate-700 font-bold text-center">
                  Klik untuk upload foto
                </p>
                <p className="text-slate-500 text-sm mt-1">atau gunakan kamera di bawah</p>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </div>
            )}

            {/* Camera Controls */}
            <div className="grid grid-cols-2 gap-2">
              {!cameraActive ? (
                <button
                  onClick={handleStartCamera}
                  disabled={ocr.isLoading}
                  className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  📱 Buka Kamera
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCapture}
                    disabled={ocr.isLoading}
                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {ocr.isLoading ? (
                      <>
                        <span className="animate-spin">⏳</span> Memproses...
                      </>
                    ) : (
                      <>
                        📸 Ambil Foto
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleToggleFacingMode}
                    disabled={ocr.isLoading}
                    className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    🔄 Balik
                  </button>

                  <button
                    onClick={handleToggleTorch}
                    disabled={ocr.isLoading}
                    className={`font-bold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                      torchEnabled
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-slate-500 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {torchEnabled ? '🔦' : '💡'}
                  </button>

                  <button
                    onClick={handleStopCamera}
                    disabled={ocr.isLoading}
                    className="col-span-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    ✕ Tutup Kamera
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {ocr.isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-700">Memproses OCR...</span>
              <span className="text-blue-600 font-bold">{Math.round(ocr.progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300"
                style={{ width: `${ocr.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {ocr.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            <p className="font-bold">❌ Error</p>
            <p>{ocr.error}</p>
          </div>
        )}

        {/* Results Display */}
        {showResult && ocr.result && (
          <div className="space-y-4">
            {ocr.result.success ? (
              <>
                {/* Data Grid */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200 space-y-3">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    ✅ Data Diekstrak (Confidence: {(ocr.result.data.confidence * 100).toFixed(0)}%)
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* NIK */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        NIK
                      </label>
                      <input
                        type="text"
                        value={ocr.result.data.nik}
                        readOnly
                        className="w-full bg-white border border-emerald-200 rounded p-2 font-bold text-slate-800"
                      />
                    </div>

                    {/* Nama */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={ocr.result.data.nama}
                        readOnly
                        className="w-full bg-white border border-emerald-200 rounded p-2 font-bold text-slate-800"
                      />
                    </div>

                    {/* Gender & Tanggal Lahir */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Jenis Kelamin
                      </label>
                      <input
                        type="text"
                        value={ocr.result.data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        readOnly
                        className="w-full bg-white border border-emerald-200 rounded p-2 font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="text"
                        value={ocr.result.data.tanggal_lahir}
                        readOnly
                        className="w-full bg-white border border-emerald-200 rounded p-2 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Processing Info */}
                  <p className="text-xs text-emerald-600 text-center font-bold mt-3">
                    ⚡ Diproses dalam {ocr.result.data.processing_time.toFixed(2)}s via {ocr.result.source}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAcceptData}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    ✅ Gunakan Data
                  </button>
                  <button
                    onClick={handleRetry}
                    className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    🔄 Ulangi Scan
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700 font-bold mb-3">⚠️ {ocr.result.message}</p>
                <button
                  onClick={handleRetry}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded-lg transition"
                >
                  🔄 Coba Lagi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KTPScanner;
