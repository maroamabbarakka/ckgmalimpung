# 13 — Catatan Sumber Audit

Arahan teknis ini disusun berdasarkan:
- Repo publik `maroamabbarakka/ckgmalimpung`.
- Struktur repo yang memuat React/Vite, Firebase, Tailwind, OCR, dashboard, TV display, dan dokumen.
- Laporan final TERSANJUNG v4.2 yang menyebut sistem sebagai aplikasi CKG Puskesmas Malimpung dengan registrasi, antrean, skrining klinis per pos, rapor digital, dashboard, ekspor laporan, scan identitas, OCR, PWA, dan Firestore.
- Temuan teknis pada implementasi login yang masih menggunakan query `staff` dengan username/PIN dan sessionStorage.
- Temuan route/frontend yang masih menaruh role route di sisi React.

Catatan:
- Nama collection aktual wajib diverifikasi di kode sebelum menerapkan Firestore Rules.
- Instruksi rules/backend dalam paket ini adalah draft teknis awal, bukan final legal/security audit.
- Jangan deploy rules ke production tanpa pengujian emulator/staging.

## Catatan Eksekusi 2026-05-28

- Collection aktual sudah diverifikasi dari kode sebelum rules dipromosikan.
- Firestore Rules sudah dideploy pada batch awal dan hosting redeploy berikutnya tidak mengubah rules.
- QA staging dilakukan lewat Firebase Hosting preview channel `staging` karena project staging terpisah belum tersedia.
- Production terakhir aktif di `https://ckg-malimpung.web.app`.
- Laporan final eksekusi tersedia di `docs/FINAL_TECHNICAL_UPDATE_PACK_REPORT.md`.
