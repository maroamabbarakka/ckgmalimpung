# 04 — Operational Safety, Offline, Sync, dan Recovery

## Tujuan

Aplikasi harus aman dipakai di lapangan meskipun:
- internet putus,
- browser refresh,
- tablet mati,
- operator pindah halaman,
- data belum tersimpan,
- Firebase reconnect terlambat.

## Masalah Yang Harus Dicegah

- Form hilang saat browser tertutup.
- Operator tidak tahu data sudah tersimpan atau belum.
- Double input pasien.
- Konflik edit antar petugas.
- Data offline masuk terlambat tanpa status jelas.

---

## Tambahkan Status Sinkronisasi Global

Buat:

```txt
src/components/SyncStatusBanner.jsx
```

Contoh:

```jsx
import { useEffect, useState } from 'react';

export function SyncStatusBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
        Online · data tersinkron
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
      Offline · data akan disimpan lokal dan disinkronkan saat koneksi kembali
    </div>
  );
}
```

Letakkan di:
- AppShell header.
- Pos layout.
- Kunjungan Rumah.

---

## Draft Auto Save Per Form

Buat util:

```txt
src/utils/draftStorage.js
```

```js
const PREFIX = 'ckg_draft';

export function draftKey(moduleName, visitId) {
  return `${PREFIX}:${moduleName}:${visitId}`;
}

export function saveDraft(moduleName, visitId, data) {
  if (!visitId) return;
  localStorage.setItem(
    draftKey(moduleName, visitId),
    JSON.stringify({
      data,
      savedAt: new Date().toISOString(),
    })
  );
}

export function loadDraft(moduleName, visitId) {
  if (!visitId) return null;
  const raw = localStorage.getItem(draftKey(moduleName, visitId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(moduleName, visitId) {
  if (!visitId) return;
  localStorage.removeItem(draftKey(moduleName, visitId));
}
```

Pakai di setiap pos:
- Simpan draft tiap 5 detik atau setelah field berubah.
- Saat buka pasien, jika ada draft lebih baru dari data server, tampilkan pilihan:
  - Pulihkan draft.
  - Abaikan draft.

---

## Autosave Hook

Buat:

```txt
src/hooks/useAutosaveDraft.js
```

```js
import { useEffect, useRef } from 'react';
import { saveDraft } from '../utils/draftStorage';

export function useAutosaveDraft({ moduleName, visitId, data, delay = 1200 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!visitId || !data) return;

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveDraft(moduleName, visitId, data);
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [moduleName, visitId, data, delay]);
}
```

---

## Status Simpan Per Form

Setiap pos wajib punya state:

```js
const [saveState, setSaveState] = useState('idle');
// idle | saving | saved | failed | offline
```

UI:
- `saving`: "Menyimpan..."
- `saved`: "Tersimpan"
- `failed`: "Gagal simpan, coba lagi"
- `offline`: "Offline, draft tersimpan lokal"

---

## Duplicate Prevention

Saat input NIK di Pos1/Loket:
1. Normalize NIK.
2. Cari pasien existing.
3. Cari kunjungan tahun berjalan.
4. Jika ada kunjungan selesai, tampilkan warning.
5. Jika ada kunjungan sedang berjalan, arahkan ke kunjungan tersebut.
6. Jangan langsung buat kunjungan baru.

Pseudo:

```js
const currentYear = new Date().getFullYear();

const existingVisit = await findVisitByNikAndYear(nik, currentYear);

if (existingVisit?.status !== 'CANCELLED') {
  showModal({
    title: 'Kunjungan sudah ada',
    message: 'Pasien ini sudah memiliki kunjungan CKG tahun ini.',
    actions: ['Buka kunjungan', 'Batalkan']
  });
  return;
}
```

---

## Conflict Detection

Tambahkan field:
- `updatedAt`
- `updatedBy`
- `version`

Saat save:
- Baca version terakhir.
- Jika version lokal lebih lama dari server, tampilkan conflict modal.

Contoh save:

```js
await updateDoc(ref, {
  ...payload,
  version: increment(1),
  updatedAt: serverTimestamp(),
  updatedBy: currentUser.username,
});
```

---

## Lock Expiry

Jangan lock permanen.

Aturan:
- Lock aktif 10 menit.
- Setiap autosave memperpanjang lock.
- Jika petugas menutup halaman, lock boleh dibiarkan expired.
- Admin bisa force unlock.

Field:

```js
lock: {
  byStaffId,
  byName,
  module,
  lockedAt,
  expiresAt
}
```

---

## Recovery Setelah Crash

Saat aplikasi dibuka:
- Cek draft lokal.
- Jika ada draft untuk visit yang belum final, tampilkan banner:
  "Ada data yang belum dikirim. Buka pemulihan."

Buat halaman sederhana:

```txt
src/features/recovery/RecoveryPage.jsx
```

Fungsi:
- List draft lokal.
- Tampilkan module, visitId, savedAt.
- Tombol hapus.
- Tombol pulihkan.

---

## Export Safety

Saat export Excel/PDF:
- Jangan export data yang statusnya belum `FINALIZED`, kecuali user memilih "termasuk proses".
- Tampilkan jumlah data:
  - selesai,
  - proses,
  - batal,
  - error.

---

## Testing

1. Buka Pos2.
2. Isi form.
3. Matikan internet.
4. Pastikan banner offline muncul.
5. Refresh halaman.
6. Pastikan draft bisa dipulihkan.
7. Online kembali.
8. Simpan.
9. Pastikan status berubah tersimpan.
10. Buka pasien sama dari browser lain.
11. Pastikan ada lock warning.

## Definition of Done

- Ada banner online/offline.
- Ada draft storage.
- Minimal satu pos memakai autosave draft.
- Ada status simpan.
- Ada duplicate prevention.
- Ada lock expiry concept.
