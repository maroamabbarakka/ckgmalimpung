// Baseline penduduk wilayah kerja Puskesmas Malimpung.
// Sumber: Data Penduduk Malimpung.jpg yang diberikan pengguna.
export const WILAYAH_PENDUDUK = Object.freeze({
  'Desa Malimpung': Object.freeze({ population: 4013, areaKm2: 5.78 }),
  'Desa Padang Loang': Object.freeze({ population: 3279, areaKm2: 28.89 }),
  'Kelurahan Maccirinna': Object.freeze({ population: 1533, areaKm2: 5.01 })
});

export const TOTAL_PENDUDUK_WILAYAH = Object.values(WILAYAH_PENDUDUK)
  .reduce((total, wilayah) => total + wilayah.population, 0);

export const TOTAL_LUAS_WILAYAH_KM2 = Object.values(WILAYAH_PENDUDUK)
  .reduce((total, wilayah) => total + wilayah.areaKm2, 0);

export const getWilayahPopulation = (desa) => WILAYAH_PENDUDUK[desa] || null;

export const calculatePopulationCoverage = (count, desa) => {
  const population = getWilayahPopulation(desa)?.population || 0;
  return population ? (Number(count || 0) / population) * 100 : 0;
};
