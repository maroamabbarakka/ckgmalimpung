const PREFIX = 'ckg_draft';

export function draftKey(moduleName, visitId) {
  return `${PREFIX}:${moduleName}:${visitId}`;
}

export function saveDraft(moduleName, visitId, data) {
  if (!visitId || typeof localStorage === 'undefined') return;
  localStorage.setItem(
    draftKey(moduleName, visitId),
    JSON.stringify({
      moduleName,
      visitId,
      data,
      savedAt: new Date().toISOString(),
    })
  );
}

export function loadDraft(moduleName, visitId) {
  if (!visitId || typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(draftKey(moduleName, visitId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(moduleName, visitId) {
  if (!visitId || typeof localStorage === 'undefined') return;
  localStorage.removeItem(draftKey(moduleName, visitId));
}

export function removeDraftByKey(key) {
  if (!key || typeof localStorage === 'undefined') return;
  localStorage.removeItem(key);
}

export function listDrafts() {
  if (typeof localStorage === 'undefined') return [];
  const keys = Array.from({ length: localStorage.length || 0 }, (_, index) => localStorage.key(index))
    .filter(Boolean);
  const fallbackKeys = Object.keys(localStorage);

  return [...new Set([...keys, ...fallbackKeys])]
    .filter((key) => key.startsWith(`${PREFIX}:`))
    .map((key) => {
      try {
        return { key, ...JSON.parse(localStorage.getItem(key)) };
      } catch {
        return { key, broken: true };
      }
    });
}
