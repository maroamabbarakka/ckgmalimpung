# README TAHAP 3 — Paket Eksekusi Harian Developer CKG TERSANJUNG

Tujuan paket ini adalah mengubah audit dan arahan teknis sebelumnya menjadi pekerjaan harian yang bisa langsung dieksekusi di VS/Codex tanpa multitafsir.

## Cara Pakai
1. Kerjakan file secara berurutan.
2. Jangan lompat ke fitur baru sebelum checklist P0 selesai.
3. Setiap perubahan wajib punya acceptance criteria.
4. Setiap perubahan wajib diuji pada mobile dan desktop.
5. Jangan ubah alur data besar tanpa backup Firestore/export terlebih dahulu.

## Urutan Wajib
1. `01_SPRINT_0_REPO_FREEZE_DAN_BASELINE.md`
2. `02_SPRINT_1_SECURITY_AUTH_RULES.md`
3. `03_SPRINT_2_WORKFLOW_DAN_LOCKING.md`
4. `04_SPRINT_3_UI_SYSTEM_DAN_MOBILE.md`
5. `05_SPRINT_4_DASHBOARD_REPORTING.md`
6. `06_SPRINT_5_OFFLINE_SYNC_RESILIENCE.md`
7. `07_FINAL_HARDENING_CHECKLIST.md`

## Definisi Selesai
Satu item dianggap selesai jika:
- kode berjalan tanpa error,
- build sukses,
- flow utama diuji manual,
- tidak merusak fitur lama,
- ada catatan perubahan di `CHANGELOG_INTERNAL.md`,
- screenshot before/after disimpan bila menyentuh UI.
