export function sortByFirestoreDate(field, direction = 'asc') {
  return (a, b) => {
    const left = a?.[field]?.toMillis?.() || 0;
    const right = b?.[field]?.toMillis?.() || 0;
    return direction === 'desc' ? right - left : left - right;
  };
}

export function mapSnapshotWithId(snapshot) {
  const rows = [];
  snapshot.forEach((docSnap) => rows.push({ id: docSnap.id, ...docSnap.data() }));
  return rows;
}
