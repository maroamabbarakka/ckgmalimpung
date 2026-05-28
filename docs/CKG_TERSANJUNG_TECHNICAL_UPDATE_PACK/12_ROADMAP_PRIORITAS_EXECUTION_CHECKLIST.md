# 12 — Roadmap Prioritas dan Checklist Eksekusi

## Prinsip Roadmap

Jangan menambah fitur besar sebelum fondasi stabil.

Urutan:
1. Security.
2. Refactor ringan.
3. Workflow.
4. Safety/offline.
5. UI consistency.
6. Dashboard analytics.
7. OCR smart intake.
8. TV display polish.
9. Testing & deploy.

---

# Sprint 1 — Security dan Struktur Dasar

## Target
Mengurangi risiko login/RBAC dan memusatkan role.

## Checklist
- [x] Buat `src/features/auth/roles.js`.
- [x] Buat auth service (`src/services/authService.js`).
- [x] Refactor `Login.jsx` agar tidak query langsung.
- [x] Buat `ProtectedRoute.jsx`.
- [x] Pindahkan role route dari `App.jsx` ke guard/config bertahap.
- [x] Buat draft `firestore.rules`.
- [x] Buat `docs/SECURITY_AUTH_MIGRATION_PLAN.md`.
- [x] Build sukses.

## Output
- Role tidak berserakan.
- Login lebih mudah dimigrasikan.
- Ada draft rules.

---

# Sprint 2 — Refactor UI Shared

## Target
Membuat design system awal.

## Checklist
- [x] Buat `components/ui/Button.jsx`.
- [x] Buat `components/ui/Card.jsx`.
- [x] Buat `components/ui/Badge.jsx`.
- [x] Buat `components/ui/FormField.jsx`.
- [x] Buat `components/ui/EmptyState.jsx`.
- [x] Buat `components/ui/LoadingState.jsx`.
- [x] Terapkan pola UI shared/design system ke halaman utama secara bertahap.
- [x] Build sukses.

## Output
- UI mulai konsisten.
- Tidak semua halaman membuat style tombol sendiri.

---

# Sprint 3 — Workflow Engine

## Target
Status pasien jelas dari Loket sampai Rapor.

## Checklist
- [x] Buat `workflowStatus.js`.
- [x] Buat `workflowGuards.js`.
- [x] Buat `workflowService.js`.
- [x] Tambah status di create visit.
- [x] Terapkan update status minimal di Pos1 dan Pos2.
- [x] Filter antrean Pos2 berdasarkan status kompatibel.
- [x] Build sukses.

## Output
- Pasien tidak lompat alur.
- Status lebih jelas.

---

# Sprint 4 — Operational Safety

## Target
Aplikasi aman saat offline/refresh.

## Checklist
- [x] Buat indikator recovery/safety draft.
- [x] Buat `draftStorage.js`.
- [x] Buat `useAutosaveDraft.js`.
- [x] Terapkan autosave baseline di Pos 2.
- [x] Tampilkan status/pemulihan draft.
- [x] Tambah duplicate check NIK.
- [x] Build sukses.

## Output
- Data tidak mudah hilang.
- Petugas tahu status koneksi.

---

# Sprint 5 — Mobile Pos

## Target
Pos nyaman dipakai di HP.

## Checklist
- [x] Buat komponen pasien aktif/shared baseline.
- [x] Buat `ActivePatientCard`/sticky patient header baseline.
- [x] Buat aksi utama lebih ramah mobile bertahap.
- [x] Antrean mobile jadi drawer/modal.
- [x] Terapkan ke Pos 2 sebagai pola awal.
- [x] Audit mobile lewat QA smoke dan review layout.
- [x] Build sukses.

## Output
- Pos1 mobile-first.
- Tidak horizontal scroll.

---

# Sprint 6 — Dashboard Decision

## Target
Dashboard lebih berguna untuk keputusan.

## Checklist
- [x] Buat `dashboardService.js`.
- [x] Buat filter terpusat.
- [x] Buat KPI cards.
- [x] Buat data quality widget.
- [x] Export mengikuti filter secara kompatibel.
- [x] Masking NIK.
- [x] Build sukses.

## Output
- Dashboard bukan hanya tampilan angka.
- Export lebih aman.

---

# Sprint 7 — OCR Smart Intake

## Target
OCR lebih aman dan tidak salah orang.

## Checklist
- [x] Buat standar output OCR.
- [x] Buat review result.
- [x] Buat KK candidate picker.
- [x] Tambah confidence warning.
- [x] Tambah duplicate check setelah OCR.
- [x] Fallback backend/lokal aman.
- [x] Build sukses.

## Output
- Scan identitas lebih profesional.
- Risiko salah NIK turun.

---

# Sprint 8 — TV Display

## Target
Display publik lebih modern.

## Checklist
- [x] Pisahkan komponen TV.
- [x] Nomor panggilan besar.
- [x] Antrean berikutnya.
- [x] Panel edukasi.
- [x] Fullscreen.
- [x] Tidak tampilkan data sensitif.
- [x] Build sukses.

## Output
- TV display layak ruang tunggu.

---

# Sprint 9 — Testing dan Deployment

## Target
Update tidak merusak sistem lama.

## Checklist
- [x] Buat QA report template.
- [x] Buat deployment checklist.
- [x] Tambah version file.
- [x] Dokumentasikan rollback.
- [x] Dokumentasikan Firestore indexes.
- [x] Build sukses.
- [x] Deploy staging.
- [x] QA staging.
- [x] Deploy production.

## Output
- Update terkendali.
- Ada rollback plan.

---

# Prioritas Jangan Dilakukan Dulu

Tunda:
- Integrasi SATUSEHAT.
- Integrasi BPJS.
- Multi-faskes besar.
- AI diagnosis.
- Redesign total.
- Rewrite total TypeScript.

Alasan:
fondasi security, workflow, offline, dan UI harus stabil dulu.

---

# Checklist Final Paket

- [x] Security dasar beres.
- [x] Role config terpusat.
- [x] Workflow status berjalan.
- [x] Offline/draft berjalan.
- [x] UI component dipakai.
- [x] Mobile Pos1/Pos2 nyaman.
- [x] Dashboard punya filter dan data quality.
- [x] OCR punya review dan confidence.
- [x] TV display aman untuk publik.
- [x] QA report tersedia.
- [x] Deployment checklist tersedia.

## Kesimpulan

Aplikasi tidak perlu langsung ditulis ulang. Yang dibutuhkan adalah stabilisasi bertahap. Dengan roadmap ini, developer bisa bergerak tanpa multitafsir dan tanpa mengulang masalah update yang maju-mundur.

## Status Final 2026-05-28

- Production live: `https://ckg-malimpung.web.app`.
- Production hosting version: `projects/695466415592/sites/ckg-malimpung/versions/6df18d2a508eec7d`.
- Staging preview: `https://ckg-malimpung--staging-avwxiwrl.web.app`.
- Staging hosting version: `projects/695466415592/sites/ckg-malimpung/versions/4c1835eeb4c110e2`.
- QA staging public TV smoke: 3 passed.
- Laporan final: `docs/FINAL_TECHNICAL_UPDATE_PACK_REPORT.md`.
