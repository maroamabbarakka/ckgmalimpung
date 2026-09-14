import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DRAFTS_CHANGED_EVENT, listDrafts } from '../../utils/draftStorage';

const MODULE_LABELS = {
  pos1: 'Pos 1',
  pos2: 'Pos 2',
  pos3: 'Pos 3',
  pos4: 'Pos 4',
  pos5: 'Pos 5',
  pos6: 'Pos 6',
};

const summarizeDrafts = (drafts) =>
  drafts.reduce((acc, draft) => {
    const label = MODULE_LABELS[draft.moduleName] || draft.moduleName || 'Lainnya';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

export default function DraftRecoveryBanner({ compact = false }) {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    const updateDrafts = () => setDrafts(listDrafts());
    updateDrafts();
    window.addEventListener('storage', updateDrafts);
    window.addEventListener('focus', updateDrafts);
    window.addEventListener(DRAFTS_CHANGED_EVENT, updateDrafts);
    return () => {
      window.removeEventListener('storage', updateDrafts);
      window.removeEventListener('focus', updateDrafts);
      window.removeEventListener(DRAFTS_CHANGED_EVENT, updateDrafts);
    };
  }, []);

  const draftCount = drafts.length;
  if (draftCount === 0) return null;

  const summary = Object.entries(summarizeDrafts(drafts))
    .map(([moduleName, count]) => `${moduleName}: ${count}`)
    .join(' • ');

  return (
    <Link
      to="/recovery"
      title={summary}
      className={`inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-xs font-black text-amber-800 shadow-sm hover:bg-amber-100 ${
        compact ? 'min-h-9 px-2.5 text-[10px]' : 'gap-2 px-3 py-1.5'
      }`}
    >
      {compact ? `Draft ${draftCount}` : `Ada ${draftCount} draft lokal • ${summary}`}
    </Link>
  );
}
