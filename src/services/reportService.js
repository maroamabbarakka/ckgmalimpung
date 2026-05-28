import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function getVisitReportById(visitId) {
  if (!visitId) return null;
  const visitSnap = await getDoc(doc(db, 'visits', visitId));
  return visitSnap.exists() ? { id: visitSnap.id, ...visitSnap.data() } : null;
}
