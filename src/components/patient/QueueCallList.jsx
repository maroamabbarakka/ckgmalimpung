function QueueCallButton({ loading = false }) {
  return (
    <div className="queue-call-btn">
      {loading ? 'Memanggil...' : 'Panggil ->'}
    </div>
  );
}

function getPatientMeta(item) {
  const age = item.umur_saat_periksa ?? item.pasien_snapshot?.umur_saat_periksa ?? item.umur ?? null;
  const cluster = item.kategori_usia_satusehat || item.pasien_snapshot?.kategori_usia_satusehat || item.kategori_usia || item.klaster || '';
  const normalizedAge = age === null || age === undefined || age === '' ? '' : `${age} THN`;
  return [normalizedAge, cluster].filter(Boolean).join(' · ');
}

function QueuePatientCard({ item, onCall, disabled = false, loading = false }) {
  const patientName = item.pasien_snapshot?.nama || item.nama || 'Tanpa nama';
  const patientMeta = getPatientMeta(item);

  return (
    <button
      type="button"
      key={item.id}
      onClick={() => onCall(item)}
      disabled={disabled}
      className="queue-card"
    >
      <p className="queue-label">Antrean</p>
      <p className="queue-number">{item.nomor_antrian}</p>
      <div className="queue-patient-info">
        <p title={patientName} className="queue-patient-name">
          {patientName}
        </p>
        {patientMeta && <p className="queue-patient-meta">{patientMeta}</p>}
      </div>
      <QueueCallButton loading={loading} />
    </button>
  );
}

function QueueSkeletonList({ count = 3 }) {
  return (
    <div className="queue-list" aria-label="Memuat daftar antrean">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="queue-card queue-skeleton-card">
          <div className="queue-skeleton-line short" />
          <div className="queue-skeleton-number" />
          <div className="queue-skeleton-line" />
          <div className="queue-skeleton-button" />
        </div>
      ))}
    </div>
  );
}

export default function QueueCallList({
  queue = [],
  onCall,
  callingVisitId = null,
  title = 'Daftar Panggilan Pasien',
  loading = false,
}) {
  const count = Array.isArray(queue) ? queue.length : 0;

  return (
    <section className="queue-section">
      <h3 className="queue-section-title">{title} ({count})</h3>
      {loading ? (
        <QueueSkeletonList />
      ) : count === 0 ? (
        <div className="queue-empty">Belum ada pasien dalam daftar panggilan.</div>
      ) : (
        <div className="queue-list">
          {queue.map((item) => (
            <QueuePatientCard
              key={item.id}
              item={item}
              onCall={onCall}
              disabled={Boolean(callingVisitId)}
              loading={callingVisitId === item.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export { QueueCallButton, QueuePatientCard };
