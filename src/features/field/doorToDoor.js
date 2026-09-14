import { normalizeRoles, ROLES } from '../auth/roles';

export const DOOR_TO_DOOR_SOURCE = 'door_to_door';
export const LEGACY_DOOR_TO_DOOR_PATH = 'Kunjungan Rumah';

export function isDoorToDoorVisit(visit = {}) {
  return visit.visit_source === DOOR_TO_DOOR_SOURCE
    || visit.jalur_pemeriksaan === LEGACY_DOOR_TO_DOOR_PATH;
}

export function buildDoorToDoorProvenance(user = {}) {
  const roles = normalizeRoles(user.roles);
  const uid = user.uid || '';
  const name = user.nama || user.name || '';

  return {
    visit_source: DOOR_TO_DOOR_SOURCE,
    execution_mode: DOOR_TO_DOOR_SOURCE,
    created_by_uid: uid,
    created_by_name: name,
    created_by_roles: roles,
    petugas_kunjungan_rumah: { uid, nama: name, roles }
  };
}

export function getDoorToDoorDoctorName(user = {}) {
  const roles = normalizeRoles(user.roles);
  if (!roles.includes(ROLES.DOKTER)) return '';
  return user.nama || user.name || '';
}
