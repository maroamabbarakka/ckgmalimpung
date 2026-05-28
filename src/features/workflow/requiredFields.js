export const REQUIRED_FIELDS_BY_POS = {
  pos1: ['nama', 'j_kelamin', 'tgl_lahir', 'desa'],
  pos2: [],
  pos3: [],
  pos4: [],
  pos5: [],
  pos6: [],
  pos7: [],
};

export function validateRequiredFields(data, posKey) {
  const required = REQUIRED_FIELDS_BY_POS[posKey] || [];
  return required
    .filter((field) => data?.[field] === undefined || data?.[field] === null || data?.[field] === '')
    .map((field) => ({
      field,
      message: `${field} wajib diisi`,
    }));
}
