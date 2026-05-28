export function maskNik(value) {
  const raw = String(value || '').trim();
  if (!raw) return '-';
  if (raw.startsWith('NONIK-')) return 'NONIK-********';

  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8) return raw;

  return `${digits.slice(0, 4)}********${digits.slice(-4)}`;
}

export function maskPhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '-';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;

  return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
}
