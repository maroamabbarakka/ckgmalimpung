# README — Paket Arahan Teknis Update CKG TERSANJUNG

Target repo: `maroamabbarakka/ckgmalimpung`

Tujuan paket ini:
1. Membuat aplikasi lebih aman.
2. Membuat alur pelayanan lebih stabil.
3. Merapikan struktur kode agar tidak saling merusak saat update.
4. Membuat UI/UX konsisten untuk mobile, tablet, dan desktop.
5. Menyiapkan fondasi dashboard analitik, audit log, dan operasional lapangan.

## Aturan Eksekusi Untuk VS/Codex

Jangan kerjakan semua file sekaligus. Ikuti urutan ini:

1. `01_SECURITY_AUTH_RBAC_FIRESTORE_RULES.md`
2. `02_REFACTOR_STRUKTUR_KODE.md`
3. `03_WORKFLOW_ENGINE_POS_CKG.md`
4. `04_OPERATIONAL_SAFETY_OFFLINE_SYNC.md`
5. `05_UIUX_DESIGN_SYSTEM.md`
6. `06_MOBILE_FIRST_POS_OPERATOR.md`
7. `07_DASHBOARD_ANALITIK_DECISION.md`
8. `08_OCR_SMART_INTAKE.md`
9. `09_TV_DISPLAY_PUBLIC_QUEUE.md`
10. `10_TESTING_QA_ACCEPTANCE.md`
11. `11_DEPLOYMENT_MONITORING_BACKUP.md`
12. `12_ROADMAP_PRIORITAS_EXECUTION_CHECKLIST.md`

## Prinsip Wajib

- Jangan hapus fitur lama.
- Jangan ubah nama collection Firestore tanpa migration plan.
- Jangan mengganti alur data besar dalam satu commit.
- Setiap perubahan wajib bisa dibuild dengan `npm run build`.
- Setiap modul baru harus punya fallback agar aplikasi tetap berjalan.
- Role di frontend hanya untuk UI, bukan keamanan utama.
- Keamanan utama harus di Firestore Rules dan/atau backend layer.
- Semua perubahan besar harus dibuat bertahap.

## Branch Yang Disarankan

```bash
git checkout -b hardening/stabilization-v1
```

## Commit Strategy

Gunakan commit kecil:

```bash
git add .
git commit -m "security: introduce auth service shell"
git commit -m "refactor: extract role permission helpers"
git commit -m "workflow: add visit status constants"
git commit -m "ui: add shared button and card components"
```

## Definisi Selesai

Paket ini dianggap selesai bila:

- Login tidak lagi bergantung pada `sessionStorage` palsu.
- Role route frontend tetap ada, tetapi validasi akses utama dilindungi rules/backend.
- Pos 1–7 memakai status workflow yang jelas.
- UI utama memakai komponen standar.
- Mobile tidak lagi terasa padat dan sulit diklik.
- Ada indikator offline/sync.
- Ada audit log untuk aksi penting.
- Dashboard punya minimal data operasional dan risiko.
- Build sukses.
- Tidak ada regression pada alur utama: Loket → Pos 1 → Pos 2–7 → Rapor.
