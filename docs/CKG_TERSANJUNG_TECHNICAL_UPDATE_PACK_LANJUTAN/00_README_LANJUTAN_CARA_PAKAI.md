# README Lanjutan — Cara Pakai Paket Instruksi Teknis CKG TERSANJUNG

## Tujuan paket ini
Paket ini adalah kelanjutan dari paket pertama. Fokusnya bukan menambah retorika, tetapi memberi instruksi eksekusi yang lebih teknis agar developer VS/Codex dapat langsung bekerja tanpa menebak.

## Prinsip eksekusi wajib
1. Jangan ubah alur data besar sekaligus.
2. Jangan refactor semua halaman dalam satu PR.
3. Kerjakan per modul kecil, build, test, commit.
4. Setiap perubahan wajib punya acceptance criteria.
5. Jika ada fitur lama berjalan, jangan hapus sebelum ada pengganti yang dites.
6. Jangan percaya validasi frontend sebagai keamanan.
7. Jangan simpan data kesehatan sensitif tanpa rules dan audit log.

## Urutan yang disarankan
1. `14_PRE_FLIGHT_AUDIT_REPO.md`
2. `15_PATCH_PLAN_7_HARI_STABILISASI.md`
3. `16_FIRESTORE_SCHEMA_INDEX_MIGRATION.md`
4. `17_AUTH_MIGRATION_STEP_BY_STEP.md`
5. `18_ROUTE_GUARD_PERMISSION_MATRIX.md`
6. `19_PATIENT_WORKFLOW_STATE_MACHINE.md`
7. `20_FORM_VALIDATION_CLINICAL_RULES.md`
8. `21_POS_PAGE_REFACTOR_TEMPLATE.md`
9. `22_DASHBOARD_PERFORMANCE_QUERY_OPTIMIZATION.md`
10. `23_OFFLINE_SYNC_CONFLICT_RESOLUTION_DETAIL.md`
11. `24_AUDIT_LOGGING_EVENT_MODEL.md`
12. `25_DATA_EXPORT_PRIVACY_GUARD.md`
13. `26_TV_DISPLAY_QUEUE_AUDIO_DETAIL.md`
14. `27_PWA_MOBILE_BACK_BUTTON_INSTALL.md`
15. `28_QA_SCRIPT_MANUAL_TEST_CASES.md`
16. `29_RELEASE_CHECKLIST_ROLLBACK_PLAN.md`
17. `30_CODEX_PROMPTS_PER_TASK.md`

## Definisi selesai
Paket ini dianggap selesai diterapkan jika:
- aplikasi build tanpa error;
- login tidak bisa dibypass hanya dari browser storage;
- role benar-benar dibatasi rules/backend;
- pasien tidak bisa loncat workflow tanpa validasi;
- halaman Pos minimal punya pola UI dan validasi yang sama;
- export tidak membuka data berlebihan;
- offline/sync punya indikator jelas;
- ada checklist QA manual yang bisa dijalankan operator.
