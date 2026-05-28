# Deployment Checklist

Project production aktif: `ckg-malimpung`  
Hosting URL: `https://ckg-malimpung.web.app`

## Sebelum Deploy

- Branch deploy sudah benar.
- `npm run lint` sukses.
- `npm run test:run` sukses.
- `npm run build` sukses.
- QA smoke test selesai.
- Jika route publik berubah, Playwright smoke test route publik sukses.
- Firestore Rules ditinjau.
- Firestore indexes sesuai query produksi.
- `.env` asli tidak masuk commit.
- Backup Firestore sudah dibuat.
- Versi deploy dicatat.
- Deploy log harian diperbarui.

## Environment

- Staging: `ckg-malimpung-staging` atau project Firebase staging setara.
- Production: project Firebase aktif `ckg-malimpung`.

## Backup

```bash
firebase firestore:export gs://YOUR_BACKUP_BUCKET/backups/ckg-malimpung/2026-05-28 --project ckg-malimpung
```

Detail backup dan restore ada di `docs/BACKUP_RESTORE_PLAN.md`.

## Rollback Hosting

Rollback tercepat:

- Firebase Console > Hosting > Release history.
- Pilih hosting version terakhir yang sehat.
- Catat rollback di deploy log.

Rollback dari source:

```bash
git checkout <last-good-commit>
npm install
npm run lint
npm run test:run
npm run build
npx firebase-tools deploy --only hosting --project ckg-malimpung
```

## Rollback Rules

```bash
npx firebase-tools deploy --only firestore:rules --project ckg-malimpung
```

## Monitoring Setelah Deploy

- Buka production URL.
- Cek login akun uji.
- Cek `/tv` jika TV display terdampak.
- Cek console browser untuk error kritis.
- Cek `activity_logs` untuk modul `Global Error Boundary`.
- Cek Firebase Console untuk lonjakan usage.

Runbook detail ada di `docs/MONITORING_RUNBOOK.md`.
