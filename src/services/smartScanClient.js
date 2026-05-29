const DEFAULT_ENDPOINT = '/api/smart-scan-document';

/**
 * Mengirim gambar base64 ke API backend untuk dipindai oleh Gemini
 * @param {string} imageBase64 
 * @param {string} source 'camera' | 'file'
 * @returns {Promise<object>} Response JSON dari backend
 */
export async function sendToSmartScanBackend(imageBase64, source = 'camera') {
  const endpoint = import.meta.env.VITE_SMART_SCAN_ENDPOINT || DEFAULT_ENDPOINT;
  const timeoutMs = parseInt(import.meta.env.VITE_GEMINI_TIMEOUT_MS || '12000', 10);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      imageBase64,
      source,
      clientMode: 'web',
      requestedFields: [
        'nik',
        'nama',
        'jenisKelamin',
        'tanggalLahir',
        'alamatDusun',
        'desaKelurahan',
        'statusWilayah'
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP_ERROR_${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        ok: false,
        engine: 'gemini',
        fallbackRequired: true,
        reason: 'TIMEOUT'
      };
    }

    return {
      ok: false,
      engine: 'gemini',
      fallbackRequired: true,
      reason: 'NETWORK_ERROR',
      message: error.message
    };
  }
}
export default sendToSmartScanBackend;
