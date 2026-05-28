import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listDrafts } from '../../utils/draftStorage';

export default function DraftRecoveryBanner({ compact = false }) {
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const updateDraftCount = () => setDraftCount(listDrafts().length);
    updateDraftCount();
    window.addEventListener('storage', updateDraftCount);
    window.addEventListener('focus', updateDraftCount);
    return () => {
      window.removeEventListener('storage', updateDraftCount);
      window.removeEventListener('focus', updateDraftCount);
    };
  }, []);

  if (draftCount === 0) return null;

  return (
    <Link
      to="/recovery"
      className={`inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-xs font-black text-amber-800 shadow-sm hover:bg-amber-100 ${
        compact ? 'min-h-9 px-2.5 text-[10px]' : 'gap-2 px-3 py-1.5'
      }`}
    >
      {compact ? `Draft ${draftCount}` : `Ada ${draftCount} draft lokal`}
    </Link>
  );
}
