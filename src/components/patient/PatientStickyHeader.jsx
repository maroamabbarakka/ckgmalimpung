import QueueStatusBadge from '../../design-system/components/QueueStatusBadge';
import { maskNik } from '../../utils/privacy';
import WorkflowStepper from './WorkflowStepper';
import { getStepKeyFromPosLabel } from './workflowSteps';

export default function PatientStickyHeader({
  visit,
  posLabel,
  accentClass = 'bg-teal-600',
  onCancel,
  cancelLabel = 'Batal'
}) {
  const patient = visit?.pasien_snapshot || {};
  const activeStepKey = getStepKeyFromPosLabel(posLabel);
  const lockOwner = visit?.lock?.byName || visit?.lockedBy?.nama || visit?.petugas_aktif || '';
  const validationItems = [
    { label: 'Identitas lengkap', done: Boolean(patient.nama && (visit?.patientNIK || patient.nik)) },
    { label: 'Antrean aktif', done: Boolean(visit?.nomor_antrian && visit?.status_antrian) },
    { label: 'Draft/sinkron terlihat', done: true },
  ];

  return (
    <div className={`${accentClass} sticky top-0 z-30 p-3 text-white shadow-sm md:p-6`}>
      <div className="flex flex-col gap-3 md:gap-4">
        <WorkflowStepper activeKey={activeStepKey} />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="shrink-0 rounded-2xl bg-white/15 px-3 py-2 text-center md:px-4 md:py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70">Antrean</p>
              <p className="text-2xl font-black leading-none md:text-4xl">{visit?.nomor_antrian || '-'}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{posLabel}</p>
              <h2 className="mt-1 truncate text-lg font-black leading-tight md:text-2xl">{patient.nama || 'Tanpa Nama'}</h2>
              <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-white/70 md:text-[11px]">
                {visit?.umur_saat_periksa || 0} THN - {visit?.kategori_usia_satusehat || '-'} - NIK {maskNik(visit?.patientNIK)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 md:justify-end">
            <QueueStatusBadge status={visit?.status_antrian} className="bg-white/15 text-white border-white/20" />
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="min-h-10 rounded-xl bg-white/20 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/30 md:min-h-11"
              >
                {cancelLabel}
              </button>
            )}
          </div>
        </div>

        <div className="hidden gap-2 md:grid md:grid-cols-[1fr_auto] md:items-center">
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
