# 01 — Baseline, Freeze, dan Scope Perubahan

## Tujuan
Membekukan kondisi aplikasi sebelum perubahan sehingga setiap regresi dapat dibandingkan dengan kondisi yang diketahui baik.

## 1. Buat Branch Khusus

Contoh:

```bash
git checkout main
git pull
git checkout -b safety/door-to-door-rbac
```

Dilarang bekerja langsung di `main`.

## 2. Catat Commit Baseline

```bash
git rev-parse HEAD
```

Simpan hasilnya ke file lokal/issue/change log sebagai:

```text
BASELINE_COMMIT=<sha>
```

Commit ini menjadi titik rollback source code.

## 3. Build Baseline Sebelum Mengubah Apa Pun

```bash
npm ci
npm run lint
npm run test:run
npm run build
```

Jika baseline sudah gagal sebelum patch, **jangan menganggap kegagalan itu akibat patch**. Catat sebagai pre-existing issue.

## 4. Baseline Data
Catat minimal jumlah dokumen pada collection yang relevan:

- `patients`
- `visits`
- `users`
- `staff`
- `activity_logs`
- `public_queue`

Jika ada collection lain yang dibaca Kunjungan Rumah/SIMPEG di environment produksi, tambahkan ke daftar.

Format baseline:

| Collection | Jumlah Dokumen | Waktu Catat | Catatan |
|---|---:|---|---|
| patients |  |  |  |
| visits |  |  |  |
| users |  |  |  |
| staff |  |  |  |
| activity_logs |  |  |  |
| public_queue |  |  |  |

## 5. Baseline UI/UX
Ambil screenshot sebelum perubahan pada viewport minimal:

- Desktop 1440×900
- Laptop 1366×768
- Mobile 390×844
- Mobile 360×800

Halaman yang wajib direkam:

- Login
- Dashboard/Beranda
- SIMPEG daftar pegawai
- Modal edit pegawai/Hak Akses
- Kunjungan Rumah step awal
- Kunjungan Rumah step pemeriksaan
- Kunjungan Rumah review/submit
- Pos 1
- Pos 2
- Pos 7
- Rapor Digital
- TV Display

Screenshot baseline menjadi bukti bahwa perubahan UI tidak menimbulkan overflow, perubahan alignment, atau hilangnya komponen.

## 6. Scope File yang Diizinkan untuk Patch Inti
Target perubahan seminimal mungkin, umumnya pada:

- `src/features/auth/roles.js`
- `src/AdminDashboard.jsx` — hanya bagian pilihan role/hak akses yang relevan
- `src/KunjunganRumah.jsx` — hanya metadata DTD dan koreksi semantik petugas/dokter
- `src/services/visitService.js` — hanya jika perlu opsi `syncPublicQueue: false`
- `src/services/authService.js` — hanya jika benar-benar diperlukan, commit terpisah
- `firestore.rules`
- file test terkait auth/RBAC/flow DTD
- dokumentasi perubahan

## 7. Scope yang Dilarang
Dalam patch ini jangan menyentuh kecuali ditemukan blocker absolut dan dibuat patch terpisah:

- struktur `formSchemas.json`;
- mapping export resmi;
- struktur sheet Excel;
- struktur laporan resmi;
- logic Pos 1–7 yang tidak terkait langsung DTD;
- global CSS besar;
- desain shell aplikasi;
- rename field Firestore;
- rename collection;
- migrasi data lama.

## 8. Prinsip Diff Minimum
Setiap file yang berubah harus dapat dijawab dengan pertanyaan:

> “Apakah baris ini benar-benar diperlukan agar role Door to Door bekerja aman?”

Jika jawabannya tidak, keluarkan dari patch.

## Exit Criteria Gate 0
- [ ] Branch khusus dibuat.
- [ ] SHA baseline dicatat.
- [ ] `npm run build` baseline berhasil atau kegagalan existing sudah dicatat.
- [ ] jumlah dokumen baseline dicatat.
- [ ] screenshot UI baseline lengkap.
- [ ] scope file dikunci.
