import { writeAuditLog } from './auditService';

export function getVisitPatientKey(visit) {
  return visit?.patient_identity_key || visit?.patientNIK || visit?.pasien_snapshot?.nik || null;
}

export async function auditQueueTransition({ visit, module, action, fromStatus, toStatus, extra = {} }) {
  await writeAuditLog({
    action,
    module,
    visitId: visit?.id || null,
    patientKey: getVisitPatientKey(visit),
    before: {
      status_antrian: fromStatus || visit?.status_antrian || null
    },
    after: {
      status_antrian: toStatus || null,
      nomor_antrian: visit?.nomor_antrian || null,
      ...extra
    }
  });
}
