import { serverTimestamp, Timestamp } from 'firebase/firestore';

export { serverTimestamp };

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function toFirestoreTimestamp(value) {
  const date = toDate(value);
  return date ? Timestamp.fromDate(date) : null;
}
