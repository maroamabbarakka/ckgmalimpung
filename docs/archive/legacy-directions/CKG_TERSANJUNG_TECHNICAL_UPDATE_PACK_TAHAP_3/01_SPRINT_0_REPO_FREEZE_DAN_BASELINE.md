# SPRINT 0 — Repo Freeze, Baseline, dan Pemetaan Risiko

## Tujuan
Membekukan kondisi awal aplikasi agar update tidak liar dan bug lama tidak tertutup oleh perubahan baru.

## Instruksi untuk VS/Codex
Baca seluruh repo. Jangan langsung refactor. Buat laporan baseline dalam file baru:

`docs/internal/BASELINE_AUDIT_TAHAP_3.md`

Isi wajib:
- daftar route aktif,
- daftar komponen utama,
- daftar collection Firestore yang dipakai,
- daftar role yang ditemukan,
- daftar fitur yang berhubungan dengan pasien,
- daftar fitur export/import,
- daftar komponen yang ukurannya besar,
- daftar file yang menyentuh auth/session.

## Perintah Teknis
Jalankan:

```bash
npm install
npm run build
npm run lint
```

Jika lint belum tersedia atau gagal karena konfigurasi lama, catat dulu. Jangan memperbaiki semua sekaligus.

## File Yang Harus Dipetakan
- `src/App.jsx`
- `src/Login.jsx`
- semua file `Pos*.jsx`
- `src/Dashboard.jsx`
- `src/AdminDashboard.jsx`
- semua file firebase config/service
- semua file export PDF/Excel
- semua file TV Display
- semua file OCR

## Checklist Output
- [ ] `BASELINE_AUDIT_TAHAP_3.md` dibuat.
- [ ] Build awal dicatat: berhasil/gagal.
- [ ] Lint awal dicatat: berhasil/gagal.
- [ ] Daftar file risiko tinggi dibuat.
- [ ] Tidak ada perubahan fungsi besar pada sprint ini.

## Acceptance Criteria
Sprint 0 selesai bila developer dapat menjawab:
- route apa saja yang ada,
- role apa saja yang aktif,
- data pasien tersimpan di collection mana,
- bagian mana yang paling berisiko bila diubah.
