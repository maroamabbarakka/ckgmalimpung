import { useEffect, useRef } from 'react';
import { saveDraft } from '../utils/draftStorage';

export function useAutosaveDraft({ moduleName, visitId, data, delay = 1200, enabled = true, onSaved }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !visitId || !data) return undefined;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDraft(moduleName, visitId, data);
      onSaved?.();
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [moduleName, visitId, data, delay, enabled, onSaved]);
}
