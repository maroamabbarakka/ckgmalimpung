# 02 — Refactor Struktur Kode Agar Tidak Maju-Mundur

## Tujuan

Merapikan repo tanpa merusak fitur lama. Refactor dilakukan bertahap dan aman.

## Masalah Saat Ini

- Banyak logic role, route, UI, dan workflow bercampur di file besar.
- Beberapa komponen halaman melakukan terlalu banyak hal sekaligus.
- Sulit menambah fitur tanpa risiko merusak fitur lain.
- Dashboard/Pos/Admin rawan menjadi file raksasa.

## Target Struktur Baru

```txt
src/
  app/
    AppShell.jsx
    routes.jsx
    navigation.js

  features/
    auth/
      authService.js
      roles.js
      ProtectedRoute.jsx

    loket/
      LoketPage.jsx
      loketService.js
      loketConstants.js

    pasien/
      pasienService.js
      pasienMapper.js
      pasienValidators.js

    workflow/
      workflowStatus.js
      workflowService.js
      workflowGuards.js

    pos/
      shared/
        PosLayout.jsx
        PosPatientHeader.jsx
        PosQueueList.jsx
        PosActionBar.jsx
      pos1/
        Pos1Page.jsx
        pos1Service.js
        pos1Validation.js
      pos2/
      pos3/
      pos4/
      pos5/
      pos6/
      pos7/

    dashboard/
      DashboardPage.jsx
      dashboardService.js
      widgets/

    rapor/
      RaporDigitalPage.jsx
      raporService.js
      raporPdf.js

    tv/
      TvDisplayPage.jsx
      tvService.js

    simpeg/
      AdminDashboardPage.jsx
      staffService.js

  components/
    ui/
      Button.jsx
      Card.jsx
      Badge.jsx
      Modal.jsx
      Table.jsx
      EmptyState.jsx
      LoadingState.jsx
      ErrorState.jsx

  services/
    firebase/
      firestoreClient.js
      timestamp.js
      queryHelpers.js

  utils/
    date.js
    number.js
    nik.js
    clinical.js
    auditLog.js
```

---

## Tahap 1 — Jangan Langsung Pindah Semua File

Buat struktur folder terlebih dahulu:

```bash
mkdir -p src/app
mkdir -p src/features/auth
mkdir -p src/features/workflow
mkdir -p src/features/pos/shared
mkdir -p src/components/ui
mkdir -p src/services/firebase
```

Jangan pindahkan halaman lama dulu. Buat wrapper dan helper baru.

---

## Tahap 2 — Ekstrak Role dan Protected Route

Buat:

```txt
src/features/auth/ProtectedRoute.jsx
```

Isi:

```jsx
import { Navigate } from 'react-router-dom';
import { getCurrentSession } from './authService';
import { hasAnyRole, normalizeRoles } from './roles';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const session = getCurrentSession();

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roles = normalizeRoles(session.rolePegawai);

  if (!hasAnyRole(roles, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}
```

Kemudian ubah `App.jsx` agar tidak lagi punya fungsi route guard internal yang panjang.

---

## Tahap 3 — Ekstrak Navigation Config

Buat:

```txt
src/app/navigation.js
```

Isi:

```js
import { MODULE_ACCESS } from '../features/auth/roles';

export const POS_CARDS = [
  { to: '/pos1', label: 'Pos 1', subtitle: 'Registrasi', roles: MODULE_ACCESS.pos1 },
  { to: '/pos2', label: 'Pos 2', subtitle: 'TTV & Lab', roles: MODULE_ACCESS.pos2 },
  { to: '/pos3', label: 'Pos 3', subtitle: 'Fisik', roles: MODULE_ACCESS.pos3 },
  { to: '/pos4', label: 'Pos 4', subtitle: 'PTM', roles: MODULE_ACCESS.pos4 },
  { to: '/pos5', label: 'Pos 5', subtitle: 'Khusus', roles: MODULE_ACCESS.pos5 },
  { to: '/pos6', label: 'Pos 6', subtitle: 'Diagnosis', roles: MODULE_ACCESS.pos6 },
  { to: '/pos7', label: 'Pos 7', subtitle: 'Rapor', roles: MODULE_ACCESS.pos7 },
];

export const MAIN_MODULES = [
  { to: '/loket', label: 'Loket', roles: MODULE_ACCESS.loket },
  { to: '/dashboard', label: 'Dashboard', roles: MODULE_ACCESS.dashboard },
  { to: '/kunjungan-rumah', label: 'Door to Door', roles: MODULE_ACCESS.field },
  { to: '/admin', label: 'Admin', roles: MODULE_ACCESS.simpeg },
];
```

---

## Tahap 4 — Ekstrak UI Komponen Umum

Buat komponen minimal.

### `src/components/ui/Button.jsx`

```jsx
const variantClass = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
};

export function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant] || variantClass.primary,
        className,
      ].join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
```

### `src/components/ui/Card.jsx`

```jsx
export function Card({ children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}
```

### `src/components/ui/Badge.jsx`

```jsx
const toneClass = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function Badge({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
```

---

## Tahap 5 — Buat Pos Layout Bersama

Buat:

```txt
src/features/pos/shared/PosLayout.jsx
```

```jsx
export function PosLayout({ title, subtitle, patient, queue, children, actions }) {
  return (
    <main className="mx-auto max-w-7xl px-3 py-4 pb-28 md:px-6 md:py-6">
      <header className="mb-4 rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-600">{subtitle}</p>
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        {patient && (
          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-800">{patient.nama}</p>
            <p className="text-xs text-slate-500">NIK: {patient.nik || '-'} · Umur: {patient.umur || '-'}</p>
          </div>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          {queue}
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          {children}
        </section>
      </div>

      {actions && (
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:static md:mt-4 md:rounded-3xl md:border md:shadow-sm">
          {actions}
        </footer>
      )}
    </main>
  );
}
```

### Cara Terapkan
- Jangan langsung ubah semua Pos.
- Mulai dari Pos2 atau Pos3 sebagai pilot.
- Setelah stabil, terapkan ke Pos lain.

---

## Tahap 6 — Service Layer Firestore

Buat:

```txt
src/services/firebase/firestoreClient.js
```

```js
import { db } from '../../firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export {
  db,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
};
```

Tujuannya:
- Import Firestore tidak tersebar berlebihan.
- Nanti mudah menambah logging, error handling, dan emulator.

---

## Tahap 7 — Naming Convention

Pakai pola ini:

```txt
Nama halaman: Pos1Page.jsx
Service: pos1Service.js
Validasi: pos1Validation.js
Konstanta: pos1Constants.js
Komponen kecil: PatientIdentityCard.jsx
```

Jangan lagi membuat:
```txt
Pos1NewFinalUpdateFix.jsx
DashboardFinal2.jsx
```

---

## Tahap 8 — Hapus File Tidak Relevan Secara Aman

Repo masih terlihat membawa dokumen PMB yang tidak sesuai konteks CKG. Jangan langsung hapus jika belum yakin.

Langkah:
1. Buat folder arsip:
   ```txt
   docs/archive/
   ```
2. Pindahkan dokumen tidak relevan ke arsip.
3. Tambahkan `docs/archive/README.md` yang menjelaskan alasan arsip.
4. Update README utama agar fokus pada TERSANJUNG CKG.

---

## Testing Setelah Refactor

Jalankan:

```bash
npm run lint
npm run build
npm run preview
```

Manual test:
- `/`
- `/login`
- `/loket`
- `/pos1`
- `/pos2`
- `/pos7`
- `/dashboard`
- `/tv`
- `/rapor/:id`
- `/admin`

## Definition of Done

- Struktur folder baru ada.
- Role config keluar dari `App.jsx`.
- Protected route keluar dari `App.jsx`.
- Minimal 3 komponen UI shared dibuat.
- Minimal 1 pos memakai `PosLayout`.
- Build sukses.
