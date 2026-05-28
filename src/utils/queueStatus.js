export const STATUS_MAPPING = {
  POS1: 'Antri Pos 1',
  POS2: 'Antri Pos 2',
  POS3: 'Antri Pos 3',
  POS4: 'Antri Pos 4',
  POS5: 'Antri Pos 5',
  POS6: 'Antri Pos 6',
  POS7: 'Antri Pos 7',
  SELESAI: 'Selesai'
};

export const QUEUE_STATUS_ALIASES = {
  'Menunggu Pos 1': 'POS1',
  'Antri Pos 1': 'POS1',
  'Antre Pos 1': 'POS1',
  'POS 1': 'POS1',
  'Pos 1': 'POS1',
  'Menunggu Pos 2': 'POS2',
  'Antri Pos 2': 'POS2',
  'Antre Pos 2': 'POS2',
  'POS 2': 'POS2',
  'Pos 2': 'POS2',
  'Menunggu Pos 3': 'POS3',
  'Antri Pos 3': 'POS3',
  'Antre Pos 3': 'POS3',
  'POS 3': 'POS3',
  'Pos 3': 'POS3',
  'Menunggu Pos 4': 'POS4',
  'Antri Pos 4': 'POS4',
  'Antre Pos 4': 'POS4',
  'POS 4': 'POS4',
  'Pos 4': 'POS4',
  'Menunggu Pos 5': 'POS5',
  'Antri Pos 5': 'POS5',
  'Antre Pos 5': 'POS5',
  'POS 5': 'POS5',
  'Pos 5': 'POS5',
  'Menunggu Pos 6': 'POS6',
  'Antri Pos 6': 'POS6',
  'Antre Pos 6': 'POS6',
  'POS 6': 'POS6',
  'Pos 6': 'POS6',
  'Menunggu Pos 7': 'POS7',
  'Antri Pos 7': 'POS7',
  'Antre Pos 7': 'POS7',
  'POS 7': 'POS7',
  'Pos 7': 'POS7',
  Selesai: 'SELESAI'
};

const STATUS_VALUES_BY_KEY = Object.entries(QUEUE_STATUS_ALIASES).reduce((acc, [label, key]) => {
  acc[key] = acc[key] || new Set();
  acc[key].add(label);
  return acc;
}, {});

Object.entries(STATUS_MAPPING).forEach(([key, label]) => {
  STATUS_VALUES_BY_KEY[key] = STATUS_VALUES_BY_KEY[key] || new Set();
  STATUS_VALUES_BY_KEY[key].add(label);
});

export function getQueueStatusKey(status) {
  if (!status) return '';
  if (STATUS_MAPPING[status]) return status;
  return QUEUE_STATUS_ALIASES[status] || status;
}

export function normalizeQueueStatus(status) {
  const key = getQueueStatusKey(status);
  return STATUS_MAPPING[key] || status;
}

export function getQueueStatusValues(statusKey) {
  const values = STATUS_VALUES_BY_KEY[statusKey];
  return values ? Array.from(values) : [];
}

export function isQueueStatus(status, statusKey) {
  return getQueueStatusKey(status) === statusKey;
}
