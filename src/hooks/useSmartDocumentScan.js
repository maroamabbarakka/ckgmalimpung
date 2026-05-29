import { useState, useRef, useCallback } from 'react';
import { sendToSmartScanBackend } from '../services/smartScanClient.js';
import { normalizeSmartScanResult, parseTesseractText } from '../utils/documentOcrParser.js';

/**
 * Kompresi gambar client-side agar hemat payload dan mempercepat scan
 * Sisi terpanjang maks 1600px, convert ke JPEG dengan quality 0.82
 */
async function compressImageClientSide(imageBase64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      const MAX_SIDE = 1600;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width > height) {
          height = Math.round((height * MAX_SIDE) / width);
          width = MAX_SIDE;
        } else {
          width = Math.round((width * MAX_SIDE) / height);
          height = MAX_SIDE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert ke JPEG dengan quality 0.82
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
      resolve(compressedBase64);
    };
    img.onerror = (err) => reject(new Error('Gagal memuat gambar untuk kompresi: ' + err.message));
    img.src = imageBase64;
  });
}

export const useSmartDocumentScan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  // Status pemicu pembacaan lokal (Tesseract)
  const [activeEngine, setActiveEngine] = useState(''); // 'gemini' | 'tesseract' | ''

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ==================== CAMERA CONTROLS ====================

  const startCamera = useCallback(async (facingMode = 'environment') => {
    try {
      setError(null);
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      return true;
    } catch (err) {
      setError(`Kamera tidak tersedia: ${err.message}`);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureFromCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Kamera belum siap');
      return null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // ==================== OCR ENGINES ====================

  /**
   * Pemindaian menggunakan Tesseract.js (Lokal Browser Fallback)
   */
  const scanWithTesseractLocal = async (imageBase64) => {
    try {
      setActiveEngine('tesseract');
      setProgress(10);

      // Lazy import tesseract.js
      const Tesseract = (await import('tesseract.js')).default;
      setProgress(20);

      const worker = await Tesseract.createWorker('ind', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.min(30 + Math.round(m.progress * 60), 90));
          }
        }
      });

      const { data: { text, confidence } } = await worker.recognize(imageBase64);
      await worker.terminate();
      
      setProgress(95);

      // Parsing teks mentah ke format raw CKG
      const rawParsed = parseTesseractText(text, Number(confidence || 0) / 100);
      
      // Normalisasi terpadu
      const finalResult = normalizeSmartScanResult(rawParsed, 'tesseract');
      setProgress(100);

      return finalResult;
    } catch (err) {
      console.error('Tesseract local scan error:', err);
      throw new Error(`Tesseract lokal gagal membaca dokumen: ${err.message}`);
    }
  };

  /**
   * Memproses pemindaian hybrid (Gemini -> Tesseract Fallback)
   */
  const processImage = async (imageBase64, source = 'camera') => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);
    setActiveEngine('gemini');

    try {
      // 1. Kompresi gambar client-side
      setProgress(5);
      const compressedBase64 = await compressImageClientSide(imageBase64);
      
      // 2. Hubungi Backend Gemini
      setProgress(15);
      const backendResponse = await sendToSmartScanBackend(compressedBase64, source);

      // 3. Evaluasi respon backend
      if (backendResponse.ok && !backendResponse.fallbackRequired) {
        setProgress(100);
        const finalResult = {
          success: true,
          engine: 'gemini',
          documentType: backendResponse.documentType,
          confidence: backendResponse.confidence,
          data: backendResponse.data,
          warnings: backendResponse.warnings || []
        };
        setResult(finalResult);
        return finalResult;
      }

      // 4. Fallback ke Tesseract jika terindikasi timeout / error
      console.warn(`[SmartScan] Backend Gemini menyarankan fallback (Alasan: ${backendResponse.reason || 'UNKNOWN'}). Menjalankan Tesseract lokal...`);
      setProgress(25);
      
      const tesseractResult = await scanWithTesseractLocal(compressedBase64);
      
      const finalResult = {
        success: true,
        engine: 'tesseract',
        documentType: tesseractResult.documentType,
        confidence: tesseractResult.confidence,
        data: tesseractResult.data,
        warnings: [
          'Menggunakan OCR cadangan lokal (Gemini offline/timeout). Harap periksa lebih teliti.',
          ...tesseractResult.warnings
        ]
      };
      setResult(finalResult);
      return finalResult;

    } catch (err) {
      console.error('[SmartScan] Kegagalan total pemindaian hybrid:', err);
      setError('Sistem tidak dapat membaca dokumen. Silakan coba lagi atau isi data secara manual.');
      return null;
    } finally {
      setIsLoading(false);
      setActiveEngine('');
    }
  };

  const processFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        const result = await processImage(base64, 'file');
        resolve(result);
      };
      reader.onerror = () => {
        setError('Gagal membaca berkas gambar.');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setProgress(0);
    setActiveEngine('');
  };

  return {
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureFromCamera,
    processImage,
    processFile,
    reset,
    isLoading,
    progress,
    error,
    result,
    activeEngine
  };
};

export default useSmartDocumentScan;
