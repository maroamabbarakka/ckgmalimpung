import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scanDocumentWithGemini } from './smartScanGemini.js';
import { normalizeSmartScanResult } from '../src/utils/documentOcrParser.js';

// Muat variabel environment
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Konfigurasi middleware CORS
app.use(cors());

// Middleware untuk parsing JSON payload berukuran besar (karena base64 image)
app.use(express.json({ limit: '15mb' }));

/**
 * Endpoint Utama Smart Scan Dokumen
 * Menerima payload base64 gambar dan mengembalikan data terstruktur
 */
app.post('/api/smart-scan-document', async (req, res) => {
  const { imageBase64, source, clientMode } = req.body;

  if (!imageBase64) {
    return res.status(400).json({
      ok: false,
      error: 'Missing imageBase64 payload',
      message: 'Foto dokumen wajib dikirimkan.'
    });
  }

  const startTimestamp = Date.now();
  console.log(`[SmartScan] 📥 Menerima permintaan pemindaian dari source: ${source || 'unknown'}, mode: ${clientMode || 'unknown'}`);

  // Cek apakah Gemini AI diaktifkan di environment variable
  const geminiEnabled = process.env.SMART_SCAN_ENABLE_GEMINI !== 'false';
  if (!geminiEnabled) {
    console.log('[SmartScan] ⚠️ Gemini AI dinonaktifkan di server. Mengarahkan klien untuk fallback.');
    return res.status(200).json({
      ok: false,
      engine: 'gemini',
      fallbackRequired: true,
      reason: 'GEMINI_DISABLED_BY_SERVER'
    });
  }

  try {
    // 1. Jalankan pemindaian dengan Gemini 2.5 Flash
    const geminiRawResult = await scanDocumentWithGemini(imageBase64);
    
    // 2. Normalisasi hasil ekstraksi
    const normalizedResult = normalizeSmartScanResult(geminiRawResult, 'gemini');
    
    const processingTime = ((Date.now() - startTimestamp) / 1000).toFixed(2);
    console.log(`[SmartScan] ✅ Gemini sukses mengekstrak dokumen tipe ${normalizedResult.documentType} dalam ${processingTime} detik.`);

    // 3. Logging Aman (Masking NIK, tidak menyimpan base64/foto)
    let maskedNik = 'KOSONG';
    if (normalizedResult.data.nik) {
      const cleanNikStr = normalizedResult.data.nik;
      if (cleanNikStr.length >= 8) {
        maskedNik = `${cleanNikStr.substring(0, 4)}********${cleanNikStr.substring(cleanNikStr.length - 4)}`;
      } else {
        maskedNik = '********';
      }
    }

    const technicalLog = {
      feature: 'smart_scan_document',
      engine: 'gemini',
      success: true,
      confidence: normalizedResult.confidence,
      documentType: normalizedResult.documentType,
      processingTimeMs: Date.now() - startTimestamp,
      nikMasked: maskedNik,
      warningsCount: normalizedResult.warnings.length,
      timestamp: new Date().toISOString()
    };
    console.log('[SmartScan Log Technical]:', JSON.stringify(technicalLog));

    // 4. Return data hasil scan terstruktur
    return res.status(200).json({
      ok: true,
      engine: 'gemini',
      documentType: normalizedResult.documentType,
      confidence: normalizedResult.confidence,
      data: normalizedResult.data,
      warnings: normalizedResult.warnings
    });

  } catch (error) {
    const processingTime = ((Date.now() - startTimestamp) / 1000).toFixed(2);
    const isTimeout = error.message === 'GEMINI_TIMEOUT';
    
    console.error(`[SmartScan] ❌ Gagal memproses gambar menggunakan Gemini (waktu berjalan: ${processingTime} detik):`, error.message);

    // Logging kegagalan teknis secara aman
    const errorLog = {
      feature: 'smart_scan_document',
      engine: 'gemini',
      success: false,
      reason: isTimeout ? 'GEMINI_TIMEOUT' : 'GEMINI_ERROR',
      errorMessage: error.message,
      processingTimeMs: Date.now() - startTimestamp,
      timestamp: new Date().toISOString()
    };
    console.log('[SmartScan Log Error]:', JSON.stringify(errorLog));

    // Kirim sinyal fallbackRequired ke frontend
    return res.status(200).json({
      ok: false,
      engine: 'gemini',
      fallbackRequired: true,
      reason: isTimeout ? 'GEMINI_TIMEOUT' : 'GEMINI_API_ERROR'
    });
  }
});

// Endpoint Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Smart Scan Backend Server running on http://localhost:${PORT}`);
  console.log(`⚙️  Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}`);
  console.log(`⏱️  Gemini Timeout: ${process.env.GEMINI_TIMEOUT_MS || '12000'} ms`);
  console.log(`==================================================\n`);
});
