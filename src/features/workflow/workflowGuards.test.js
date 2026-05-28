import { describe, expect, it } from 'vitest';
import { canPrintFinalReport, canTransition } from './workflowGuards';
import { VISIT_STATUS } from './workflowStatus';

describe('workflowGuards', () => {
  it('allows valid workflow transitions', () => {
    expect(canTransition(VISIT_STATUS.REGISTERED, VISIT_STATUS.POS1_COMPLETE)).toBe(true);
    expect(canTransition(VISIT_STATUS.POS1_COMPLETE, VISIT_STATUS.POS2_COMPLETE)).toBe(true);
  });

  it('rejects invalid workflow jumps', () => {
    expect(canTransition(VISIT_STATUS.REGISTERED, VISIT_STATUS.POS5_COMPLETE)).toBe(false);
  });

  it('allows final report only for finalized visits', () => {
    expect(canPrintFinalReport({ status: VISIT_STATUS.FINALIZED })).toBe(true);
    expect(canPrintFinalReport({ status: VISIT_STATUS.POS6_COMPLETE })).toBe(false);
  });
});
