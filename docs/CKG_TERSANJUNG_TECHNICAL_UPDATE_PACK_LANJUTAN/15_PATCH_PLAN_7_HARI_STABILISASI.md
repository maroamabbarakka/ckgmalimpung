# 15 — Patch Plan 7 Hari Stabilisasi

## Target
Membuat aplikasi lebih aman dan stabil tanpa rewrite total.

## Hari 1 — Audit dan freeze scope
Checklist:
- [ ] Build lokal sukses.
- [ ] Semua file besar teridentifikasi.
- [ ] Semua collection Firestore terpetakan.
- [ ] Semua role terpetakan.
- [ ] Semua halaman Pos diuji manual.

Commit:
```bash
git commit -m "docs: add pre-flight audit for ckg stabilization"
```

## Hari 2 — Permission matrix dan route guard
Kerjakan:
- buat `src/auth/permissions.js`;
- buat `src/auth/useAuthSession.js`;
- pusatkan akses role;
- jangan lagi cek role tersebar di banyak file.

Acceptance:
- semua route protected memakai satu guard;
- role tidak dibaca langsung dari sessionStorage di komponen halaman.

## Hari 3 — Workflow pasien minimal
Kerjakan:
- buat `src/workflow/visitStatus.js`;
- definisikan status pasien;
- buat helper `canOpenPos`, `canCompletePos`, `getNextStatus`.

Acceptance:
- Pos tidak bisa dibuka jika status belum memenuhi syarat;
- UI menampilkan alasan kenapa pos terkunci.

## Hari 4 — Validasi form inti
Kerjakan:
- buat `src/validation/clinicalRequiredFields.js`;
- buat validasi wajib per pos;
- simpan hasil validasi sebelum finalisasi.

Acceptance:
- data kosong tidak bisa difinalisasi;
- pesan error jelas dan spesifik field.

## Hari 5 — Offline/sync indicator
Kerjakan:
- buat `src/components/system/SyncStatusBadge.jsx`;
- tampilkan status online/offline;
- tampilkan pending save/fail retry.

Acceptance:
- operator tahu kapan data belum tersimpan ke server.

## Hari 6 — Audit log minimum
Kerjakan:
- buat `src/services/auditLogService.js`;
- log event: login, create patient, update visit, finalize visit, export report.

Acceptance:
- setiap aksi besar tercatat dengan actor, timestamp, targetId, action.

## Hari 7 — QA dan release candidate
Kerjakan:
- jalankan checklist manual;
- build;
- deploy staging;
- bandingkan data sebelum/sesudah.

Acceptance:
- tidak ada regresi fungsi utama;
- rilis hanya jika semua P0 hijau.
