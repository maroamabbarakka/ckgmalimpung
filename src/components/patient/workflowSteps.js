export const WORKFLOW_STEPS = [
  { key: 'loket', shortLabel: 'Loket', label: 'Loket' },
  { key: 'pos1', shortLabel: 'P1', label: 'Pos 1' },
  { key: 'pos2', shortLabel: 'P2', label: 'Pos 2' },
  { key: 'pos3', shortLabel: 'P3', label: 'Pos 3' },
  { key: 'pos4', shortLabel: 'P4', label: 'Pos 4' },
  { key: 'pos5', shortLabel: 'P5', label: 'Pos 5' },
  { key: 'pos6', shortLabel: 'P6', label: 'Pos 6' },
  { key: 'pos7', shortLabel: 'P7', label: 'Pos 7' },
  { key: 'rapor', shortLabel: 'Rapor', label: 'Rapor' },
];

export function getStepKeyFromPosLabel(posLabel = '') {
  const match = String(posLabel).match(/pos\s*(\d)/i);
  return match ? `pos${match[1]}` : 'loket';
}
