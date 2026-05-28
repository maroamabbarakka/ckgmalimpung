import { describe, expect, it } from 'vitest';
import { calculateBottleneck, calculateDashboardMetrics, calculateDataQuality } from './dashboardService';

describe('dashboardService', () => {
  it('calculates operational metrics', () => {
    const metrics = calculateDashboardMetrics([
      { status: 'FINALIZED', nama: 'A', desa: 'Desa Malimpung' },
      { status: 'POS2_IN_PROGRESS', nama: 'B', desa: 'Desa Malimpung', riskLevel: 'HIGH' },
      { status: 'CANCELLED', nama: 'C', desa: 'Desa Malimpung' },
    ]);

    expect(metrics).toMatchObject({ total: 3, finalized: 1, inProgress: 1, cancelled: 1, highRisk: 1 });
  });

  it('calculates bottleneck by status', () => {
    expect(calculateBottleneck([{ status: 'POS2_IN_PROGRESS' }, { status: 'POS2_IN_PROGRESS' }, { status: 'FINALIZED' }])).toEqual({
      POS2_IN_PROGRESS: 2,
      FINALIZED: 1,
    });
  });

  it('counts data quality issues', () => {
    const quality = calculateDataQuality([{ status: 'FINALIZED', nama: 'A' }, { nik: '123', desa: 'Desa Malimpung' }]);
    expect(quality.missingNik).toBe(1);
    expect(quality.missingBirthDate).toBe(2);
    expect(quality.invalidWorkflow).toBe(1);
    expect(quality.finalizedWithoutDoctor).toBe(1);
  });
});
