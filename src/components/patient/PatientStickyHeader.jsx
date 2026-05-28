import { X } from 'lucide-react';
import QueueStatusBadge from '../../design-system/components/QueueStatusBadge';
import { maskNik } from '../../utils/privacy';
import WorkflowStepper from './WorkflowStepper';
import { getStepKeyFromPosLabel } from './workflowSteps';

export default function PatientStickyHeader({
  visit,
  posLabel,
  accentClass = 'bg-teal-600',
  onCancel,
  cancelLabel = 'Batal',
  queueCount,
  onQueueClick,
}) {
  const patient = visit?.pasien_snapshot || {};
  const activeStepKey = getStepKeyFromPosLabel(posLabel);
  const posNumber = String(posLabel || '').match(/pos\s*(\d)/i)?.[1] || activeStepKey.replace('pos', '');
  const lockOwner = visit?.lock?.byName || visit?.lockedBy?.nama || visit?.petugas_aktif || '';
  const validationItems = [
    { label: 'Identitas lengkap', done: Boolean(patient.nama && (visit?.patientNIK || patient.nik)) },
    { label: 'Antrean aktif', done: Boolean(visit?.nomor_antrian && visit?.status_antrian) },
    { label: 'Draft/sinkron terlihat', done: true },
  ];

  return (
    <div className={`pos-header ${accentClass} sticky top-0 z-30 p-3 text-white shadow-sm md:p-6`}>
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="pos-stepper">
        <WorkflowStepper activeKey={activeStepKey} />
        </div>

        <div className="pos-header-main">
          <div className="queue-code">{visit?.nomor_antrian || '-'}</div>
          <div className="min-w-0">
            <p className="pos-type-label">{posLabel}</p>
            <h2 className="patient-name truncate">{patient.nama || 'Tanpa Nama'}</h2>
            <p className="patient-meta truncate">
              {visit?.umur_saat_periksa || 0} THN · {visit?.kategori_usia_satusehat || '-'} <span className="patient-nik">· NIK {maskNik(visit?.patientNIK)}</span>
            </p>
          </div>

          <div className="header-actions">
            <QueueStatusBadge status={visit?.status_antrian} className="header-status-chip bg-white/15 text-white border-white/20" />
            {(queueCount !== undefined || onQueueClick) && (
              onQueueClick ? (
                <button type="button" onClick={onQueueClick} className="header-queue-btn">
                  Antri Pos {posNumber} {queueCount !== undefined ? `(${queueCount})` : ''}
                </button>
              ) : (
                <span className="header-queue-btn" aria-label={`Antrean Pos ${posNumber}`}>
                  Antri Pos {posNumber} {queueCount !== undefined ? `(${queueCount})` : ''}
                </span>
              )
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="header-cancel-btn"
                aria-label={cancelLabel}
                title={cancelLabel}
              >
                <span className="hidden md:inline">{cancelLabel}</span>
                <X className="h-4 w-4 md:hidden" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="status-chip-row hidden gap-2 md:grid md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap gap-2">
            {validationItems.map((item) => (
              <span
                key={item.label}
                className={`inline-flex min-h-8 items-center rounded-full border px-3 text-[10px] font-black uppercase tracking-wider ${
                  item.done ? 'border-white/20 bg-white/15 text-white' : 'border-amber-200 bg-amber-100 text-amber-900'
                }`}
              >
                {item.done ? 'OK' : '!'} {item.label}
              </span>
            ))}
          </div>
          {lockOwner && (
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/80">
              Dibuka oleh {lockOwner}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
