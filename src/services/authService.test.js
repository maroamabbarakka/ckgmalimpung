import { describe, expect, it } from 'vitest';
import { buildAuthEmail, normalizeRoles } from './authService';

describe('authService', () => {
  it('normalizes roles from array and string input', () => {
    expect(normalizeRoles([' Admin ', 'Dokter'])).toEqual(['admin', 'dokter']);
    expect(normalizeRoles('Petugas, Perawat_Bidan')).toEqual(['petugas', 'perawat_bidan']);
  });

  it('builds internal auth email for username login', () => {
    expect(buildAuthEmail(' Admin User ')).toBe('adminuser@tersanjung.local');
    expect(buildAuthEmail('user@example.test')).toBe('user@example.test');
  });
});
