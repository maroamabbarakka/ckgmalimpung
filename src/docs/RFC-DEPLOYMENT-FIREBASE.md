# RFC: Deployment & Firebase Setup

## Tujuan
Menjelaskan langkah praktek terbaik untuk men-setup proyek Firebase, struktur environment (staging/production), dan proses deploy otomatis.

## Ringkasan
- Project menggunakan Firebase (Authentication, Firestore, Storage, Functions, Hosting opsional).
- Deploy otomatis lewat GitHub Actions ke Firebase project `staging` dan `production`.

## Prasyarat
- Akun Firebase dengan project untuk `staging` dan `production`.
- Firebase CLI (`npm install -g firebase-tools`) terinstal di runner CI.
- Secret GitHub: `FIREBASE_TOKEN_STAGING`, `FIREBASE_TOKEN_PRODUCTION`.

## Struktur Project (contoh)
- `functions/` — Cloud Functions (nodejs)
- `src/` — frontend app (Next.js / React)
- `firestore.rules` — rules untuk Firestore
- `storage.rules` — rules untuk Storage
- `firebase.json` — konfigurasi hosting, functions, rewrites

## Setup Firebase Project
1. Buat project Firebase untuk `staging` dan `production`.
2. Konfigurasikan Authentication (email/password) dan provider lain bila perlu.
3. Siapkan Firestore, pilih native mode.
4. Siapkan Storage bucket.
5. Buat service account untuk automation (CI) jika ingin menggunakan `firebase-tools` dengan credentials JSON.

## Firestore Rules (ringkas)
- Terapkan rule berbasis role: `request.auth.uid` dan custom claims `role`.
- Contoh: hanya admin yang bisa menulis field `status` pada koleksi `announcements`.

## Deployment Manual (lokal)
1. Login ke Firebase CLI:

```bash
firebase login
```

2. Pilih project:

```bash
firebase use --add <project-id>
```

3. Deploy functions, rules, hosting:

```bash
firebase deploy --only functions,firestore:rules,storage,hosting
```

## Contoh GitHub Actions (ringkas)
- Buat workflow `.github/workflows/deploy.yml` yang menjalankan build dan `firebase deploy`.
- Gunakan `FIREBASE_TOKEN` sebagai secret untuk auth.

Contoh snippet (pseudo):

```yaml
name: Deploy to Firebase
on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with: node-version: '18'
      - name: Install
        run: |
          cd src
          npm ci
      - name: Build
        run: |
          cd src
          npm run build
      - name: Deploy to Firebase
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_PRODUCTION }}
        run: |
          npm install -g firebase-tools
          firebase deploy --only hosting,functions,firestore:rules
```

## Environment & Config
- Simpan konfigurasi environment (API keys minimal; rahasiakan private keys) di GitHub Secrets atau Secret Manager.
- Jangan commit file credential/service account.

## Rollback
- Firebase Hosting menyediakan versi history untuk rollback cepat.
- Untuk functions, siapkan versi canary / staging testing sebelum promosi.

## Checklist sebelum production deploy
- [ ] Semua tests lulus
- [ ] Smoke test di staging berhasil
- [ ] Backup data penting jika perlu
- [ ] Notifikasi tim sebelum deploy

## Catatan Keamanan
- Batasi siapa yang punya akses Firebase Console
- Gunakan custom claims untuk role dan verifikasi di security rules

## Referensi
- Firebase CLI docs: https://firebase.google.com/docs/cli
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
