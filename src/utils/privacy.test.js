import { describe, expect, it } from 'vitest';
import { maskNik, maskPhone } from './privacy';

describe('privacy', () => {
  it('masks standard NIK', () => {
    expect(maskNik('7312000000001234')).toBe('7312********1234');
  });

  it('masks NONIK values without exposing stable identity parts', () => {
    expect(maskNik('NONIK-7312000000000001-2020-01-01-budi')).toBe('NONIK-********');
  });

  it('handles empty identity values', () => {
    expect(maskNik('')).toBe('-');
  });

  it('masks phone numbers', () => {
    expect(maskPhone('081234567890')).toBe('081****890');
  });
});
