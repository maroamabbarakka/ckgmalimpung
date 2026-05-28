import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ACTIVE_LOCATION_REF = doc(db, 'pengaturan', 'lokasi_aktif');
export const DEFAULT_ACTIVE_LOCATION = 'Dusun Malimpung';

export async function updateActiveLocation(locationName) {
  await setDoc(ACTIVE_LOCATION_REF, { nama_lokasi: locationName }, { merge: true });
}

export function subscribeActiveLocation(onChange, onError) {
  return onSnapshot(
    ACTIVE_LOCATION_REF,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(DEFAULT_ACTIVE_LOCATION);
        return;
      }

      const data = snapshot.data();
      onChange(data?.dusun || data?.nama_lokasi || data?.nama || data?.lokasi || DEFAULT_ACTIVE_LOCATION);
    },
    (error) => {
      onError?.(error);
      onChange(DEFAULT_ACTIVE_LOCATION);
    }
  );
}
