import AppBadge from './AppBadge';

const getQueueTone = (status) => {
  const value = String(status || '').toLowerCase();

  if (!value) return 'neutral';
  if (value.includes('selesai')) return 'success';
  if (value.includes('rujuk') || value.includes('risiko')) return 'danger';
  if (value.includes('periksa') || value.includes('pemeriksaan')) return 'warning';
  if (value.includes('panggil') || value.includes('pos')) return 'info';

  return 'neutral';
};

export default function QueueStatusBadge({ status, className = '' }) {
  const label = status || 'Menunggu';

  return (
    <AppBadge tone={getQueueTone(label)} className={`uppercase tracking-widest ${className}`}>
      {label}
    </AppBadge>
  );
}
