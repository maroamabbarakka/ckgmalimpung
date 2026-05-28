# 11 — Deployment, Monitoring, Backup, dan Rollback

## Tujuan

Update aplikasi harus aman. Jika ada error setelah deploy, bisa dilacak dan dikembalikan.

## Environment

Gunakan minimal dua environment:

```txt
staging
production
```

Jika belum ada Firebase project staging, buat rencana:

```txt
ckg-malimpung-staging
ckg-malimpung-production
```

---

## File Environment

`.env.example` wajib berisi:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_OCR_BACKEND_URL=
VITE_APP_ENV=development
```

Jangan commit `.env` asli.

---

## Deployment Checklist

Sebelum deploy:

- [ ] Branch sudah benar.
- [ ] `npm run lint` sukses.
- [ ] `npm run build` sukses.
- [ ] QA smoke test sukses.
- [ ] Firestore Rules dicek.
- [ ] Tidak ada secret di repo.
- [ ] Backup data penting.
- [ ] Catat versi deploy.

---

## Versioning

Tambahkan ke app:

```txt
src/version.js
```

```js
export const APP_VERSION = '4.3.0-stabilization.1';
export const BUILD_DATE = '2026-05-27';
```

Tampilkan kecil di halaman Tentang/Admin.

---

## Backup Firestore

Jika memakai Firebase CLI:

```bash
firebase firestore:export gs://YOUR_BUCKET/backups/$(date +%Y-%m-%d)
```

Jika belum ada bucket:
- buat bucket backup.
- atur permission hanya admin teknis.

---

## Rollback

Setiap deploy catat:
- commit hash,
- tanggal,
- fitur berubah,
- status QA.

Jika error:
```bash
git checkout <last-good-commit>
npm install
npm run build
firebase deploy --only hosting
```

Untuk Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

---

## Monitoring Error

Tambahkan minimal:
- global error boundary,
- console error capture,
- audit log error penting.

Jika bisa, pakai Sentry.

Minimal ErrorBoundary harus mencatat:
- route,
- user role,
- pesan error,
- waktu.

Jangan simpan data medis sensitif di error log.

---

## Performance Monitoring

Cek:
- waktu load login,
- waktu load dashboard,
- query Firestore terbanyak,
- bundle size.

Tambahkan command analisis bundle bila perlu:

```bash
npm install -D rollup-plugin-visualizer
```

---

## Firestore Index

Jika query gagal karena index:
1. Jangan abaikan.
2. Klik link index dari Firebase error.
3. Catat di dokumen:

```txt
docs/FIRESTORE_INDEXES.md
```

Format:
```md
| Collection | Fields | Query Modul | Dibuat |
|---|---|---|---|
```

---

## Security Rules Deployment

Jangan deploy rules tanpa test.

Gunakan emulator jika sempat:

```bash
firebase emulators:start
```

Rules harus memastikan:
- user tidak login tidak bisa baca data medis.
- role biasa tidak bisa ubah staff.
- audit log tidak bisa dihapus.
- TV display hanya baca data publik.

---

## Data Retention

Buat kebijakan:
- Data kunjungan aktif: tahun berjalan.
- Arsip: tahun sebelumnya.
- Audit log: minimal 2 tahun atau sesuai kebijakan internal.
- Draft lokal: hapus otomatis setelah 7–30 hari.

---

## Incident Response

Jika terjadi masalah:
1. Stop deploy.
2. Catat waktu.
3. Screenshot error.
4. Cek console.
5. Cek Firebase logs.
6. Rollback jika mengganggu layanan.
7. Buat catatan perbaikan.

Template:

```md
# Incident Report

Tanggal:
Versi:
Modul:
Dampak:
Penyebab:
Langkah rollback:
Perbaikan permanen:
```

## Definition of Done

- Ada env example lengkap.
- Ada version file.
- Ada deployment checklist.
- Ada rollback plan.
- Ada backup plan.
- Ada monitoring error minimal.

## Status Implementasi 2026-05-28

- `.env.example` sudah berupa template aman tanpa secret.
- `src/version.js` tersedia dan versi ditampilkan di halaman Tentang/Admin.
- `docs/DEPLOYMENT_CHECKLIST.md` diperbarui dengan project production aktif, smoke test route publik, rollback Firebase Hosting, dan monitoring pascadeploy.
- `docs/BACKUP_RESTORE_PLAN.md` ditambahkan untuk backup Firestore CLI, validasi backup, restore, rollback hosting cepat, dan retensi data.
- `docs/MONITORING_RUNBOOK.md` ditambahkan untuk cek pascadeploy, error monitoring minimal, performa, Firebase usage, dan respons insiden.
- `docs/INCIDENT_REPORT_TEMPLATE.md` diperluas dengan hosting version, route, role terdampak, backup/restore, dan verifikasi.
- `src/ErrorBoundary.jsx` mencatat error global tersanitasi ke audit log modul `Global Error Boundary` dengan route, role, pesan error, dan waktu.
- Deploy terakhir tercatat di `docs/DEPLOY_LOG_2026-05-28.md` dengan hosting version `projects/695466415592/sites/ckg-malimpung/versions/e2a992b21ad2414e`.
