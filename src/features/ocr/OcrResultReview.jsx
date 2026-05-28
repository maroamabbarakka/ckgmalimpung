import { classifyConfidence } from './ocrPipeline';

const CONFIDENCE_TONE = {
  HIGH: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  LOW: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function OcrResultReview({ result, onUse, onCancel }) {
  if (!result) return null;

  const confidenceScore = Math.round(Number(result.confidence || 0) * (Number(result.confidence || 0) <= 1 ? 100 : 1));
  const confidenceLevel = classifyConfidence(confidenceScore);
  const tone = CONFIDENCE_TONE[confidenceLevel] || CONFIDENCE_TONE.LOW;
  const warnings = result.warnings || [];

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Review Hasil OCR</p>
          <h4 className="mt-1 text-lg font-black text-slate-900">{result.nama || 'Nama belum terbaca'}</h4>
          <p className="mt-1 text-xs font-bold text-slate-600">NIK: {result.nik || '-'}</p>
          <p className="mt-1 text-xs font-bold text-slate-600">Lahir: {result.tgl_lahir || result.tanggalLahir || '-'}</p>
        </div>
        <span className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${tone}`}>
          {confidenceLevel} {confidenceScore}%
        </span>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Wajib dicek manual</p>
          <ul className="mt-2 space-y-1 text-xs font-bold text-slate-600">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onUse} className="min-h-[44px] rounded-xl bg-blue-700 px-4 text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-blue-800 active:scale-[0.98]">
          Gunakan Data Ini
        </button>
        <button type="button" onClick={onCancel} className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]">
          Batal
        </button>
      </div>
    </div>
  );
}
