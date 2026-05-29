import ai from './geminiClient.js';

/**
 * Memindai dokumen menggunakan Gemini 2.5 Flash Vision
 * @param {string} imageBase64 Base64 gambar dokumen (bisa diawali data:image/jpeg;base64,)
 * @returns {Promise<object>} Data hasil ekstraksi terstruktur
 */
export async function scanDocumentWithGemini(imageBase64) {
  // Bersihkan data base64 jika memiliki skema data:image/...;base64,
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `Anda adalah sistem ekstraksi data dokumen identitas untuk aplikasi Cek Kesehatan Gratis.

Baca gambar dokumen yang diberikan. Dokumen bisa berupa KTP, KK, BPJS, JKN, atau dokumen identitas lain.

Ambil hanya data berikut:
- NIK
- Nama
- Jenis Kelamin
- Tanggal Lahir
- Alamat atau Dusun jika ada
- Desa atau Kelurahan jika ada

Jangan ambil nomor BPJS/JKN.
Jangan ambil nomor KK.
Jangan mengarang data yang tidak terlihat.
Jika field tidak terbaca, isi null.

Kembalikan hanya JSON valid tanpa markdown.

Format JSON wajib:
{
  "documentType": "KTP|KK|BPJS|JKN|LAINNYA|TIDAK_TERBACA",
  "nik": string|null,
  "nama": string|null,
  "jenisKelamin": "LAKI-LAKI"|"PEREMPUAN"|null,
  "tanggalLahir": "YYYY-MM-DD"|null,
  "alamatDusun": string|null,
  "desaKelurahan": string|null,
  "confidence": number,
  "warnings": string[]
}

Aturan:
- NIK harus 16 digit angka.
- Nama gunakan huruf kapital.
- Tanggal lahir ubah ke format YYYY-MM-DD.
- Jika hanya terlihat tempat/tanggal lahir, ambil tanggal lahirnya saja.
- Jika desa/kelurahan tidak terbaca jelas, isi null.
- Jangan menebak desa/kelurahan jika tidak terlihat.
- Jika hasil tidak yakin, turunkan confidence dan tambahkan warning.`;

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  
  // Siapkan pemanggilan dengan timeout
  const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '12000', 10);
  
  const scanPromise = ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    config: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  });

  // Bungkus dalam promise timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('GEMINI_TIMEOUT'));
    }, timeoutMs);
  });

  const response = await Promise.race([scanPromise, timeoutPromise]);
  const text = response.text;
  
  if (!text) {
    throw new Error('Ekstraksi teks kosong dari Gemini');
  }

  const parsed = JSON.parse(text);
  return parsed;
}
