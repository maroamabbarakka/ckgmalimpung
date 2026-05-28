# SPRINT 3 — UI System, Konsistensi Tampilan, dan Mobile UX

## Tujuan
Merapikan tampilan agar profesional, konsisten, mudah dipakai petugas, dan nyaman di HP maupun desktop.

## Buat Struktur
```txt
src/components/ui/
  AppShell.jsx
  PageHeader.jsx
  SectionCard.jsx
  StatusBadge.jsx
  PrimaryButton.jsx
  SecondaryButton.jsx
  DangerButton.jsx
  EmptyState.jsx
  LoadingState.jsx
  ErrorState.jsx
  BottomActionBar.jsx
  ResponsiveTable.jsx
```

## Token CSS/Tailwind
Buat file:
`src/styles/designTokens.js`

Isi:
- warna primary,
- warna success/warning/danger/info,
- radius,
- shadow,
- spacing,
- font sizes.

## Aturan UI
1. Jangan membuat style tombol baru di halaman.
2. Semua tombol aksi utama pakai `PrimaryButton`.
3. Semua halaman punya `PageHeader`.
4. Semua form besar dibungkus `SectionCard`.
5. Semua status pakai `StatusBadge`.
6. Semua tabel panjang pakai `ResponsiveTable`.

## Mobile Pos Layout
Untuk Pos1–Pos7, layout mobile wajib:
```txt
[Header Pasien]
[Status Workflow]
[Form Section 1]
[Form Section 2]
[Bottom Action Bar: Simpan | Lanjut | Kembali]
```

## Desktop Pos Layout
Untuk desktop:
```txt
Kiri: daftar antrean / pasien
Kanan: form aktif
Atas: header pasien dan status
Bawah: action bar
```

## Jangan Dilakukan
- Jangan ubah logika klinis saat merapikan UI.
- Jangan ubah schema Firestore pada sprint UI.
- Jangan menambah fitur baru.
- Jangan membuat komponen duplikat.

## Checklist
- [ ] Komponen UI dasar dibuat.
- [ ] Pos1 migrasi ke UI system.
- [ ] Pos2 migrasi ke UI system.
- [ ] Dashboard pakai PageHeader/SectionCard.
- [ ] Tombol dan status konsisten.
- [ ] Mobile diuji lebar 360px, 390px, 430px.
- [ ] Desktop diuji 1366px dan 1920px.

## Acceptance Criteria
- Tidak ada tombol aksi utama dengan style manual.
- Operator bisa menyimpan data dari HP tanpa zoom.
- Bottom action bar terlihat di mobile.
- UI tidak berubah-ubah antar halaman.
