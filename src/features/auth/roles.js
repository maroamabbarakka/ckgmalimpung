export const ROLES = {
  ADMIN: 'admin',
  PETUGAS: 'petugas',
  TTLM: 'ttlm',
  PERAWAT: 'perawat',
  PERAWAT_BIDAN: 'perawat_bidan',
  DOKTER: 'dokter',
  APOTEKER: 'apoteker',
};

export const MODULE_ACCESS = {
  loket: [ROLES.ADMIN, ROLES.PETUGAS, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN, ROLES.DOKTER, ROLES.TTLM, ROLES.APOTEKER],
  pos1: [ROLES.ADMIN, ROLES.PETUGAS],
  pos2: [ROLES.ADMIN, ROLES.TTLM, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN],
  pos3: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN],
  pos4: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.APOTEKER],
  pos5: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN, ROLES.APOTEKER],
  pos6: [ROLES.ADMIN, ROLES.DOKTER],
  pos7: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN, ROLES.APOTEKER],
  dashboard: [ROLES.ADMIN, ROLES.PETUGAS, ROLES.TTLM, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN, ROLES.DOKTER, ROLES.APOTEKER],
  simpeg: [ROLES.ADMIN],
  field: [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN],
  staff: [ROLES.ADMIN, ROLES.PETUGAS, ROLES.TTLM, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN, ROLES.DOKTER, ROLES.APOTEKER],
};

export function normalizeRoles(rawRoles) {
  if (!rawRoles) return [];
  if (Array.isArray(rawRoles)) return rawRoles.map(String).map((role) => role.trim()).filter(Boolean);
  if (typeof rawRoles === 'string') {
    try {
      return normalizeRoles(JSON.parse(rawRoles));
    } catch {
      return rawRoles.split(',').map((role) => role.trim()).filter(Boolean);
    }
  }
  return [String(rawRoles).trim()].filter(Boolean);
}

export function hasAnyRole(userRoles, allowedRoles = []) {
  const roles = normalizeRoles(userRoles);
  if (roles.includes(ROLES.ADMIN)) return true;
  return allowedRoles.some((role) => roles.includes(role));
}
