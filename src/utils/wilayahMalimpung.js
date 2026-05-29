export const WILAYAH_KERJA_MALIMPUNG = [
  {
    canonical: "Desa Malimpung",
    aliases: ["MALIMPUNG", "DESA MALIMPUNG", "KELURAHAN MALIMPUNG"],
  },
  {
    canonical: "Desa Padang Loang",
    aliases: ["PADANG LOANG", "PADANGLOANG", "DESA PADANG LOANG"],
  },
  {
    canonical: "Kelurahan Maccirinna",
    aliases: ["MACCIRINNA", "MACCIRINA", "DESA MACCIRINNA", "KELURAHAN MACCIRINNA"],
  },
];

/**
 * Mencocokkan input desa/kelurahan dengan daftar wilayah kerja resmi
 * @param {string} input Nama desa/kelurahan dari hasil OCR
 * @returns {object} Hasil pencocokan berisi desaKelurahan, statusWilayah, dan matched
 */
export function resolveWilayahKerja(input) {
  const value = String(input || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!value) {
    return {
      desaKelurahan: "",
      statusWilayah: "perlu_konfirmasi", // Jika kosong/tidak terbaca
      matched: false,
    };
  }

  for (const wilayah of WILAYAH_KERJA_MALIMPUNG) {
    if (wilayah.aliases.some(alias => value.includes(alias))) {
      return {
        desaKelurahan: wilayah.canonical,
        statusWilayah: "wilayah_kerja",
        matched: true,
      };
    }
  }

  // Jika terdeteksi tapi di luar wilayah kerja
  return {
    desaKelurahan: "LUAR WILAYAH",
    statusWilayah: "luar_wilayah",
    matched: false,
  };
}
