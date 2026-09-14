export const DENTAL_STATUS = Object.freeze({
  EXAMINED: 'examined',
  NOT_EXAMINED: 'not_examined',
  NOT_APPLICABLE: 'not_applicable',
  LEGACY_REVIEW: 'legacy_review'
});

export const DENTAL_STATUS_LABEL = Object.freeze({
  [DENTAL_STATUS.EXAMINED]: 'Sudah diperiksa',
  [DENTAL_STATUS.NOT_EXAMINED]: 'Belum diperiksa',
  [DENTAL_STATUS.NOT_APPLICABLE]: 'Tidak berlaku',
  [DENTAL_STATUS.LEGACY_REVIEW]: 'Data legacy/perlu verifikasi'
});

const SCHOOL_CATEGORIES = new Set(['sd', 'smp', 'sma', 'anak/siswa']);
const FINAL_STATUSES = new Set(['selesai', 'finalized']);
const EMPTY_ANSWER = new Set(['', '-', 'belum diperiksa', 'tidak diperiksa', 'tidak dilakukan']);
const DENTAL_QUESTION_PATTERN = /(pemeriksaan|hasil|kesehatan|skrining).*(gigi|mulut)|karies|gigi\s+(hilang|goyang)|periodontal/i;

const normalize = (value) => String(value ?? '').trim().toLowerCase();
const isAnswered = (value) => {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  return !EMPTY_ANSWER.has(normalize(value));
};

export function getDentalPatientCategory(visit = {}) {
  return normalize(
    visit.kategori_usia_satusehat ||
    visit.kategoriPasien ||
    visit.pasien_snapshot?.kategori_usia_satusehat ||
    visit.pasien_snapshot?.kategori
  );
}

function expectedStructuredKeys(category) {
  if (category === 'balita') return ['karies'];
  if (SCHOOL_CATEGORIES.has(category)) return ['goyang', 'lubang', 'hilang'];
  return ['goyang', 'lubang', 'hilang', 'periodontal'];
}

function result(status, source, answered = 0, expected = 0) {
  return { status, label: DENTAL_STATUS_LABEL[status], source, answered, expected };
}

export function getDentalScreeningStatus(visit = {}) {
  const category = getDentalPatientCategory(visit);
  if (category === 'bayi') return result(DENTAL_STATUS.NOT_APPLICABLE, 'category');
  if (!category || category === '-') return result(DENTAL_STATUS.LEGACY_REVIEW, 'unknown_category');

  const structured = visit.pos2?.skrining_gigi;
  if (structured && typeof structured === 'object' && !Array.isArray(structured)) {
    const keys = expectedStructuredKeys(category);
    const answered = keys.filter((key) => isAnswered(structured[key])).length;
    return result(
      answered === keys.length ? DENTAL_STATUS.EXAMINED : DENTAL_STATUS.NOT_EXAMINED,
      'pos2.skrining_gigi',
      answered,
      keys.length
    );
  }

  const questionMap = visit.pos3_question_map || visit.pos3?.question_map || {};
  const dentalQuestionIds = Object.entries(questionMap)
    .filter(([, question]) => DENTAL_QUESTION_PATTERN.test(String(question || '')))
    .map(([id]) => id);
  if (dentalQuestionIds.length > 0) {
    const answers = visit.pos3?.answers || visit.pos3?.jawaban || visit.pos3 || {};
    const answered = dentalQuestionIds.filter((id) => isAnswered(answers[id])).length;
    return result(
      answered === dentalQuestionIds.length ? DENTAL_STATUS.EXAMINED : DENTAL_STATUS.NOT_EXAMINED,
      'pos3_question_map',
      answered,
      dentalQuestionIds.length
    );
  }

  const isNewDoorToDoor = visit.visit_source === 'door_to_door';
  const isFinal = FINAL_STATUSES.has(normalize(visit.status)) || FINAL_STATUSES.has(normalize(visit.status_antrian));
  if (isNewDoorToDoor || !isFinal) return result(DENTAL_STATUS.NOT_EXAMINED, 'missing_current_data');
  return result(DENTAL_STATUS.LEGACY_REVIEW, 'missing_legacy_structure');
}

export function calculateDentalScreeningSummary(visits = []) {
  const summary = {
    examined: 0,
    notExamined: 0,
    notApplicable: 0,
    legacyReview: 0,
    needsAttention: 0,
    rows: []
  };

  visits.forEach((visit) => {
    const evaluation = getDentalScreeningStatus(visit);
    if (evaluation.status === DENTAL_STATUS.EXAMINED) summary.examined += 1;
    if (evaluation.status === DENTAL_STATUS.NOT_EXAMINED) summary.notExamined += 1;
    if (evaluation.status === DENTAL_STATUS.NOT_APPLICABLE) summary.notApplicable += 1;
    if (evaluation.status === DENTAL_STATUS.LEGACY_REVIEW) summary.legacyReview += 1;
    if ([DENTAL_STATUS.NOT_EXAMINED, DENTAL_STATUS.LEGACY_REVIEW].includes(evaluation.status)) {
      summary.needsAttention += 1;
      summary.rows.push({ visit, evaluation });
    }
  });

  return summary;
}
