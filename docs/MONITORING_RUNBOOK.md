# Monitoring Runbook

Tanggal baseline: 2026-05-28  
Project production aktif: `ckg-malimpung`  
Hosting URL: `https://ckg-malimpung.web.app`

## Tujuan

Runbook ini dipakai setelah deploy, saat jam layanan, dan saat ada laporan aplikasi bermasalah. Fokus monitoring adalah error aplikasi, availability, performa dasar, kuota Firebase, dan keamanan data.

## Pemeriksaan Setelah Deploy

| Area | Cara Cek | Ambang Tindak Lanjut |
|---|---|---|
| Hosting | Buka `https://ckg-malimpung.web.app` | Halaman gagal load atau asset 404 |
| Login | Login akun petugas uji | Tidak bisa masuk atau role salah |
| TV publik | Buka `/tv` dan aktifkan display | Login muncul, layar kosong, atau data sensitif tampil |
| Dashboard | Buka Dashboard setelah login | Widget error atau load terlalu lama |
| Console browser | DevTools Console | Error merah berulang |
| Firestore usage | Firebase Console > Firestore usage | Lonjakan read/write tidak wajar |
| Audit log | Collection `activity_logs` | Error global berulang di modul yang sama |

## Error Monitoring Minimal

`src/ErrorBoundary.jsx` mencatat error global ke audit log lewat modul `Global Error Boundary`. Payload audit log harus tetap singkat dan tidak boleh memuat data medis sensitif.

Catatan minimal yang dicari:

- `route`: halaman saat error terjadi.
- `role`: role user yang aktif.
- `message`: pesan error tersanitasi.
- `time`: waktu ISO saat error terjadi.

Jika audit log gagal karena user belum login atau koneksi offline, error tetap tampil di console browser.

## Performance Monitoring Manual

Target awal:

| Halaman | Target Operasional |
|---|---|
| Login | Tampil kurang dari 3 detik pada koneksi puskesmas normal |
| Dashboard | Data awal tampil kurang dari 8 detik |
| Pos layanan | Antrean dan pasien aktif tidak membuat halaman freeze |
| TV display | Tidak blank setelah fullscreen dan refresh |

Jika build memberi warning chunk besar, catat sebagai risiko performa dan prioritaskan code splitting pada batch refactor berikutnya.

## Monitoring Firebase

Cek harian saat masa stabilisasi:

- Authentication: login gagal berulang yang tidak wajar.
- Firestore Usage: lonjakan read/write/delete.
- Hosting Usage: request error atau traffic tidak biasa.
- Rules Playground atau emulator sebelum rules baru dipromosikan.

## Respons Saat Error Produksi

1. Catat jam kejadian dan akun/role yang terdampak.
2. Screenshot halaman dan console error bila memungkinkan.
3. Cek `activity_logs` dengan modul `Global Error Boundary`.
4. Tentukan dampak: satu halaman, satu role, atau seluruh aplikasi.
5. Jika mengganggu layanan, rollback hosting ke versi terakhir yang sehat.
6. Buat catatan memakai `docs/INCIDENT_REPORT_TEMPLATE.md`.

## Versi Sehat Terakhir

| Tanggal | Hosting Version | Catatan |
|---|---|---|
| 2026-05-28 | `projects/695466415592/sites/ckg-malimpung/versions/6df18d2a508eec7d` | Koreksi visual TV setelah uji mandiri, Playwright production 3 viewport passed |
| 2026-05-28 | `projects/695466415592/sites/ckg-malimpung/versions/e2a992b21ad2414e` | Monitoring runbook, backup/restore plan, dan audit log ErrorBoundary aktif |
| 2026-05-28 | `projects/695466415592/sites/ckg-malimpung/versions/5ff437ef1ac259fd` | `/tv` dan `/display` publik, QA Playwright 3 viewport passed |

## Staging Preview

| Channel | URL | Version | Expire |
|---|---|---|---|
| `staging` | `https://ckg-malimpung--staging-avwxiwrl.web.app` | `projects/695466415592/sites/ckg-malimpung/versions/4c1835eeb4c110e2` | 2026-06-04 02:10:02 WITA |

QA staging terakhir: public TV smoke 3 viewport passed.
