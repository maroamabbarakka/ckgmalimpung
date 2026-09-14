import { describe, expect, it } from 'vitest';
import { hasAnyRole, MODULE_ACCESS, ROLES } from '../auth/roles';
import {
  buildDoorToDoorProvenance,
  getDoorToDoorDoctorName,
  isDoorToDoorVisit
} from './doorToDoor';

describe('Door to Door RBAC', () => {
  it('grants only field module access to a Door to Door-only role', () => {
    const roles = [ROLES.DOOR_TO_DOOR];
    expect(hasAnyRole(roles, MODULE_ACCESS.field)).toBe(true);
    expect(hasAnyRole(roles, MODULE_ACCESS.pos1)).toBe(false);
    expect(hasAnyRole(roles, MODULE_ACCESS.pos2)).toBe(false);
    expect(hasAnyRole(roles, MODULE_ACCESS.pos7)).toBe(false);
    expect(hasAnyRole(roles, MODULE_ACCESS.dashboard)).toBe(false);
    expect(hasAnyRole(roles, MODULE_ACCESS.simpeg)).toBe(false);
    expect(hasAnyRole(roles, MODULE_ACCESS.staff)).toBe(false);
  });

  it('keeps existing field roles authorized', () => {
    for (const role of [ROLES.ADMIN, ROLES.DOKTER, ROLES.PERAWAT, ROLES.PERAWAT_BIDAN]) {
      expect(hasAnyRole([role], MODULE_ACCESS.field)).toBe(true);
    }
  });
});

describe('Door to Door provenance', () => {
  it('adds immutable actor metadata without mutating the user', () => {
    const user = { uid: 'uid-dtd', nama: 'Petugas Lapangan', roles: ['door_to_door'] };
    const before = structuredClone(user);
    expect(buildDoorToDoorProvenance(user)).toEqual({
      visit_source: 'door_to_door',
      execution_mode: 'door_to_door',
      created_by_uid: 'uid-dtd',
      created_by_name: 'Petugas Lapangan',
      created_by_roles: ['door_to_door'],
      petugas_kunjungan_rumah: {
        uid: 'uid-dtd',
        nama: 'Petugas Lapangan',
        roles: ['door_to_door']
      }
    });
    expect(user).toEqual(before);
  });

  it('never identifies a non-doctor operator as doctor examiner', () => {
    expect(getDoorToDoorDoctorName({ nama: 'DTD', roles: ['door_to_door'] })).toBe('');
    expect(getDoorToDoorDoctorName({ nama: 'Perawat', roles: ['perawat', 'door_to_door'] })).toBe('');
    expect(getDoorToDoorDoctorName({ nama: 'Dokter A', roles: ['dokter', 'door_to_door'] })).toBe('Dokter A');
  });

  it('recognizes both new and legacy Door to Door visits', () => {
    expect(isDoorToDoorVisit({ visit_source: 'door_to_door' })).toBe(true);
    expect(isDoorToDoorVisit({ jalur_pemeriksaan: 'Kunjungan Rumah' })).toBe(true);
    expect(isDoorToDoorVisit({ jalur_pemeriksaan: 'Puskesmas' })).toBe(false);
  });
});
