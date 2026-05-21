import { useState, useRef, useCallback } from 'react';
import { enhanceKtpImage, parseKTPText } from './utils/ktpOcr';

/**
 * Custom Hook untuk OCR KTP
 * Mendukung: camera capture, file upload, base64 processing
 * Fallback ke Tesseract.js jika backend tidak tersedia
 */

export const useKTPOCR = (backendUrl = 'http://localhost:8000') => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [useBackend, setUseBackend] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ==================== CAMERA FUNCTIONS ====================

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
  }, []);

  const captureFromCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Kamera belum siap');
      return null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Get base64
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // ==================== OCR PROCESSING ====================

  const processWithBackend = async (imageBase64) => {
    try {
      setProgress(10);

      // Remove data:image/jpeg;base64, prefix
      let base64Data = imageBase64;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      
      console.log('📤 Sending to backend, base64 length:', base64Data.length);

      const response = await fetch(`${backendUrl}/ocr/ktp/base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ base64_image: base64Data })
      });

      setProgress(80);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();
      setProgress(100);

      if (data.success) {
        return {
          success: true,
          data: data.data,
          source: 'PaddleOCR Backend'
        };
      } else {
        throw new Error(data.error || 'OCR processing failed');
      }
    } catch (err) {
      console.error('Backend error:', err);
      return null; // Will fallback to browser OCR
    }
  };

  const processWithTesseract = async (imageBase64) => {
    try {
      // Lazy load Tesseract only when needed
      const Tesseract = (await import('tesseract.js')).default;

      setProgress(20);
      let imageForOcr = imageBase64;
      try {
        if (typeof imageBase64 === 'string' && imageBase64.startsWith('data:')) {
          const blob = await fetch(imageBase64).then(res => res.blob());
          imageForOcr = await enhanceKtpImage(new File([blob], 'ktp.jpg', { type: blob.type || 'image/jpeg' }));
        }
      } catch (preprocessError) {
        console.info('Preprocess OCR dilewati:', preprocessError.message);
      }

      const worker = Tesseract.createWorker({
        logger: (m) => {
          setProgress(Math.min(20 + (m.progress * 60), 80));
        }
      });

      await worker.load();
      setProgress(40);

      const { data: { text, confidence } } = await worker.recognize(imageForOcr);
      setProgress(90);

      await worker.terminate();
      setProgress(100);

      // Parse OCR text into KTP data
      const ktpData = parseKTPText(text, Number(confidence || 0) / 100);

      return {
        success: true,
        data: ktpData,
        source: 'Tesseract.js (Browser)',
        raw_text: text,
        confidence: ktpData.confidence
      };
    } catch (err) {
      setError(`Tesseract error: ${err.message}`);
      return null;
    }
  };

  const processImage = async (imageBase64) => {
    try {
      setIsLoading(true);
      setProgress(0);
      setError(null);

      // Try backend first if enabled
      if (useBackend) {
        setProgress(5);
        const backendResult = await processWithBackend(imageBase64);
        if (backendResult) {
          setResult(backendResult);
          return backendResult;
        }
        // Backend failed, fallback to browser
        console.log('⚠️ Backend unavailable, using browser OCR...');
      }

      // Fallback to Tesseract.js
      const browserResult = await processWithTesseract(imageBase64);
      if (browserResult) {
        setResult(browserResult);
        return browserResult;
      }

      throw new Error('Semua metode OCR gagal');
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== FILE UPLOAD ====================

  const processFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        const result = await processImage(base64);
        resolve(result);
      };
      reader.onerror = () => {
        setError('Gagal membaca file');
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  // ==================== RESET ====================

  const reset = () => {
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return {
    // Camera
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureFromCamera,

    // Processing
    processImage,
    processFile,

    // State
    isLoading,
    progress,
    error,
    result,
    useBackend,
    setUseBackend,

    // Utils
    reset
  };
};
export default useKTPOCR;
