# 29 — Release Checklist dan Rollback Plan

## Target
Setiap rilis aman, bisa diuji, dan bisa dikembalikan jika gagal.

## Sebelum merge
Checklist:
- [ ] Branch bukan main.
- [ ] Build sukses.
- [ ] QA manual minimal P0 selesai.
- [ ] Firestore Rules diuji di emulator atau staging.
- [ ] Tidak ada credential di commit.
- [ ] Tidak ada console.log sensitif.
- [ ] Export masking berjalan.
- [ ] Audit log berjalan.

## Sebelum deploy
Checklist:
- [ ] Backup Firestore/export data penting.
- [ ] Catat versi commit.
- [ ] Deploy ke staging dulu.
- [ ] Uji login, registrasi, pos, rapor, export.
- [ ] Baru deploy production.

## Format release note
```txt
Versi: YYYY.MM.DD
Commit: abc123
Perubahan:
- ...
Perbaikan:
- ...
Risiko:
- ...
Cara rollback:
- ...
```

## Rollback hosting
Jika deploy Firebase Hosting bermasalah:
1. Buka Firebase Console > Hosting.
2. Pilih release sebelumnya.
3. Klik rollback.
4. Catat waktu rollback.

## Rollback kode
```bash
git revert <commit-id>
npm run build
firebase deploy --only hosting
```

## Rollback data
Jangan rollback data manual tanpa dokumen.
Jika migrasi data gagal:
- hentikan aplikasi sementara jika perlu;
- export collection terdampak;
- jalankan script restore yang sudah dites;
- catat semua dokumen terdampak.

## Acceptance criteria
- Setiap rilis punya release note.
- Ada commit yang bisa dirujuk.
- Ada rencana rollback sebelum deploy.
