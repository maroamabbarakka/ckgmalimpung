export const VALID_STAFF_POSITIONS = [
  'POS 1',
  'POS 2',
  'POS 3',
  'POS 4',
  'POS 5',
  'POS 6',
  'POS 7',
  'DOOR TO DOOR',
  'ALL ACCESS'
];

export const sanitizeStaffPositions = (rawPositions, rawPos) => {
  const list = Array.isArray(rawPositions)
    ? rawPositions
    : (rawPos ? [rawPos] : []);
  
  return list
    .map((p) => String(p || '').trim())
    .filter((p) => VALID_STAFF_POSITIONS.includes(p));
};
