import { describe, expect, it } from 'vitest';
import {
  getQueueStatusKey,
  getQueueStatusValues,
  normalizeQueueStatus,
  STATUS_MAPPING
} from './queueStatus';

describe('queueStatus', () => {
  it('normalizes legacy Pos 1 aliases to canonical label', () => {
    expect(normalizeQueueStatus('Menunggu Pos 1')).toBe(STATUS_MAPPING.POS1);
    expect(normalizeQueueStatus('Antre Pos 1')).toBe(STATUS_MAPPING.POS1);
    expect(normalizeQueueStatus('Antri Pos 1')).toBe(STATUS_MAPPING.POS1);
  });

  it('keeps canonical status unchanged', () => {
    expect(normalizeQueueStatus(STATUS_MAPPING.POS7)).toBe(STATUS_MAPPING.POS7);
    expect(normalizeQueueStatus(STATUS_MAPPING.SELESAI)).toBe(STATUS_MAPPING.SELESAI);
  });

  it('returns status keys for old and new labels', () => {
    expect(getQueueStatusKey('Menunggu Pos 2')).toBe('POS2');
    expect(getQueueStatusKey(STATUS_MAPPING.POS2)).toBe('POS2');
  });

  it('exposes all accepted values for Firestore compatibility queries', () => {
    expect(getQueueStatusValues('POS3')).toContain(STATUS_MAPPING.POS3);
    expect(getQueueStatusValues('POS3')).toContain('Menunggu Pos 3');
  });
});
