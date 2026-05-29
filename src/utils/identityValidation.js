/**
 * Memeriksa apakah NIK valid (16 digit angka)
 * @param {string} nik 
 * @returns {boolean}
 */
export function isValidNik(nik) {
  if (!nik) return false;
  return /^\d{16}$/.test(String(nik).trim());
}

/**
 * Memeriksa apakah Nama valid (minimal 3 karakter)
 * @param {string} nama 
 * @returns {boolean}
 */
export function isValidNama(nama) {
  if (!nama) return false;
  return String(nama).trim().length >= 3;
}

/**
 * Memeriksa apakah format tanggal ISO YYYY-MM-DD valid
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isValidBirthDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  
  if (year < 1900 || year > new Date().getFullYear()) return false;
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day && dateObj <= new Date();
}

/**
 * Memeriksa apakah Jenis Kelamin valid
 * @param {string} gender 
 * @returns {boolean}
 */
export function isValidGender(gender) {
  return ['LAKI-LAKI', 'PEREMPUAN'].includes(String(gender).toUpperCase());
}

/**
 * Memeriksa apakah Desa/Kelurahan valid terhadap daftar wilayah kerja Puskesmas Malimpung atau LUAR WILAYAH
 * @param {string} desa 
 * @returns {boolean}
 */
export function isValidDesa(desa) {
  if (!desa) return false;
  const normalized = String(desa).toUpperCase().trim();
  return ['DESA MALIMPUNG', 'DESA PADANG LOANG', 'KELURAHAN MACCIRINNA', 'LUAR WILAYAH'].includes(normalized);
}

/**
 * Memvalidasi data identitas secara keseluruhan
 * @param {object} data Objek data berisi nik, nama, jenisKelamin, tanggalLahir, desaKelurahan
 * @returns {object} Berisi isValid (boolean) dan errors (array of string)
 */
export function validateIdentity(data) {
  const errors = [];

  if (data.nik && !isValidNik(data.nik)) {
    errors.push('NIK harus 16 digit angka.');
  }

  if (data.nama && !isValidNama(data.nama)) {
    errors.push('Nama minimal 3 karakter.');
  }

  if (data.tanggalLahir && !isValidBirthDate(data.tanggalLahir)) {
    errors.push('Tanggal lahir tidak valid.');
  }

  if (data.jenisKelamin && !isValidGender(data.jenisKelamin)) {
    errors.push('Jenis kelamin harus LAKI-LAKI atau PEREMPUAN.');
  }

  if (data.desaKelurahan && !isValidDesa(data.desaKelurahan)) {
    errors.push('Desa/Kelurahan tidak valid.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
