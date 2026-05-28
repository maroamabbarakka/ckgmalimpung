export const HEALTH_MESSAGES = [
  'Cek tekanan darah secara rutin untuk mencegah risiko hipertensi.',
  'Biasakan aktivitas fisik minimal 30 menit setiap hari.',
  'Kurangi gula, garam, dan lemak untuk menjaga kesehatan.',
  'Cuci tangan pakai sabun sebelum makan dan setelah dari toilet.',
  'Berhenti merokok untuk melindungi diri dan keluarga.',
];

export function maskPublicQueueName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return parts.map((part) => `${part[0] || ''}.`).join(' ');
}

export function sanitizePublicQueueItem(visit = {}) {
  return {
    nomorAntrian: visit.nomor_antrian || visit.queueNumber || '-',
    namaSingkat: maskPublicQueueName(visit.nama || visit.patientName || ''),
    posTujuan: visit.posTujuan || visit.status_antrian || visit.status || '-',
    status: visit.status_antrian || visit.status || '-',
  };
}

export function enterFullscreen(target = document.documentElement) {
  return target?.requestFullscreen?.();
}

export function speakQueue(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'id-ID';
  msg.rate = 0.9;
  window.speechSynthesis.speak(msg);
}
