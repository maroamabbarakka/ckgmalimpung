export const emptyAge = { tahun: 0, bulan: 0, totalBulan: 0, kategori: '-' };

export function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function calculateAge(tglLahir, referenceDate = new Date()) {
  if (!isValidIsoDate(tglLahir)) return emptyAge;

  const birthDate = new Date(tglLahir);
  let years = referenceDate.getFullYear() - birthDate.getFullYear();
  let months = referenceDate.getMonth() - birthDate.getMonth();

  if (referenceDate.getDate() < birthDate.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = Math.max(0, years * 12 + months);
  let kategori = 'Dewasa';
  if (totalMonths < 12) kategori = 'Bayi';
  else if (years < 6) kategori = 'Balita';
  else if (years < 18) kategori = 'Anak';
  else if (years >= 60) kategori = 'Lansia';

  return { tahun: Math.max(0, years), bulan: months, totalBulan: totalMonths, kategori };
}
