Lanjutannya:

````md
# 21. STRATEGI IMPLEMENTASI BERTAHAP

## PHASE 1 — UI FOUNDATION

Kerjakan dulu:

1. Design tokens
2. Reusable components
3. Layout wrapper
4. Button system
5. Card system
6. Typography system

Jangan langsung ubah semua halaman.

---

# 22. FILE YANG DISARANKAN DIBUAT

```txt
src/design-system/tokens/colors.js
src/design-system/tokens/spacing.js
src/design-system/tokens/typography.js
src/design-system/tokens/radius.js
src/design-system/tokens/shadows.js

src/design-system/components/AppButton.jsx
src/design-system/components/AppCard.jsx
src/design-system/components/AppInput.jsx
src/design-system/components/AppBadge.jsx
src/design-system/components/AppStatCard.jsx
src/design-system/components/AppPageHeader.jsx
src/design-system/components/AppSection.jsx
src/design-system/components/AppTable.jsx
src/design-system/components/AppEmptyState.jsx
src/design-system/components/AppSkeleton.jsx
````

---

# 23. CONTOH DESIGN TOKEN

```js
export const colors = {
  primary: '#0F766E',
  primaryHover: '#115E59',
  primarySoft: '#CCFBF1',

  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#0284C7',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  border: '#E2E8F0',
  surface: '#FFFFFF',
  background: '#F8FAFC'
};
```

---

# 24. APP LAYOUT BARU

Buat wrapper global:

```txt
src/layouts/AppShell.jsx
```

Fungsi:

* sidebar desktop
* bottom navigation mobile
* page content wrapper
* sticky top header
* responsive padding
* safe area mobile

---

# 25. APP SHELL STRUCTURE

```jsx
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DesktopSidebar />
      <MobileTopBar />

      <main className="lg:pl-72 pb-24 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
```

---

# 26. HALAMAN YANG DIPRIORITASKAN

Urutan polish UI:

1. Login
2. Dashboard
3. Loket
4. Pos 1
5. Pos 2–7
6. Admin Dashboard
7. Rapor
8. TV Display

---

# 27. LOGIN PAGE

Target:

* bersih
* modern
* tidak terasa form lama
* ada branding Puskesmas/CKG
* mobile friendly

Layout:

```txt
Desktop:
kiri = brand hero
kanan = login card

Mobile:
logo atas
judul aplikasi
form login
```

Jangan ubah logic login dulu jika belum masuk fase auth refactor.

---

# 28. DASHBOARD PAGE

Target layout:

```txt
Header:
- Selamat datang
- tanggal
- status realtime

Hero Cards:
- Total Pasien Hari Ini
- Antrean Aktif
- Pasien Selesai
- Risiko Tinggi

Content:
- Chart kunjungan
- Distribusi usia
- Daftar antrean aktif
- Alert operasional
```

---

# 29. LOKET PAGE

Target UX:

* tombol ambil antrean sangat dominan
* lokasi aktif jelas
* printer status jelas
* tiket terakhir jelas
* riwayat antrean rapi

Primary action:

```txt
AMBIL NOMOR ANTREAN
```

Harus paling besar dan paling mudah ditemukan.

---

# 30. POS PEMERIKSAAN

Setiap pos wajib punya pola yang sama:

```txt
1. Header pasien aktif
2. Ringkasan antrean
3. Form pemeriksaan
4. Sticky action bawah
5. Riwayat kecil
```

Jangan tiap pos punya gaya sendiri-sendiri.

---

# 31. PATIENT STICKY HEADER

Saat user scroll form panjang, tetap tampil:

```txt
Nomor antrean
Nama pasien
NIK / ID pasien
Usia
Status pos
```

Ini penting agar petugas tidak salah input pasien.

---

# 32. FLOATING ACTION BAR

Untuk mobile:

```txt
[Simpan] [Simpan & Lanjut]
```

Posisi:

```css
position: sticky;
bottom: 0;
z-index: 40;
```

Tambahkan safe-area:

```css
padding-bottom: env(safe-area-inset-bottom);
```

---

# 33. FORM SECTION

Gunakan section:

```txt
Identitas Pasien
Alamat
Data Keluarga
Pemeriksaan Dasar
Hasil Pemeriksaan
Tindak Lanjut
```

Setiap section memakai `AppSection`.

---

# 34. EMPTY STATE

Jangan tampilkan halaman kosong.

Contoh:

```txt
Belum ada antrean
Antrean pasien akan muncul otomatis saat loket membuat tiket baru.
```

Tambahkan icon sederhana.

---

# 35. ERROR STATE

Error harus human friendly.

Buruk:

```txt
FirebaseError: permission-denied
```

Baik:

```txt
Data tidak dapat dimuat.
Periksa koneksi internet atau hubungi admin.
```

---

# 36. RESPONSIVE RULES

## Mobile

* 1 kolom
* tombol besar
* card stack
* tabel jadi list card
* action sticky bawah

## Tablet

* 2 kolom
* sidebar boleh compact

## Desktop

* sidebar penuh
* dashboard 3–4 kolom
* tabel penuh

---

# 37. TV DISPLAY DETAIL

TV Display harus punya rasa “layar publik profesional”.

Layout:

```txt
Header:
PUSKESMAS MALIMPUNG
CKG / Cek Kesehatan Gratis
Lokasi aktif

Main:
Nomor dipanggil besar
Nama pasien
Pos tujuan

Side:
Antrean per pos

Bottom:
Running info / edukasi kesehatan
```

Style:

* background gelap elegan
* angka sangat besar
* kontras tinggi
* animasi halus
* tanpa elemen kecil yang sulit dibaca dari jauh

---

# 38. ANIMASI YANG BOLEH

Gunakan ringan:

```txt
fade in
slide up 8px
scale 0.98 → 1
```

Durasi:

```txt
150ms - 250ms
```

Dilarang:

```txt
bounce berlebihan
blink
marquee cepat
animasi berat
```

---

# 39. KOMPONEN APPBUTTON

Variant wajib:

```txt
primary
secondary
ghost
danger
success
warning
```

Size:

```txt
sm
md
lg
xl
```

Default height:

```txt
md = 44px
lg = 48px
xl = 56px
```

---

# 40. KOMPONEN APPBADGE

Variant:

```txt
success
warning
danger
info
neutral
queue
```

Digunakan untuk:

* status antrean
* status pasien
* role petugas
* status sinkronisasi
* risiko kesehatan

---

# 41. KOMPONEN APPSTATCARD

Format:

```txt
Icon
Label
Angka besar
Trend / keterangan kecil
```

Contoh:

```txt
Total Pasien
128
+12 dari kemarin
```

---

# 42. DATA TABLE UX

Desktop:

* sticky header
* search di kanan atas
* filter di kiri
* pagination jelas

Mobile:

* ubah row jadi card:

```txt
Nama pasien
Nomor antrean
Status
Tanggal
Aksi
```

---

# 43. CODING RULE UNTUK UI REFACTOR

Developer wajib:

1. tidak mengubah nama field Firestore
2. tidak mengubah query kecuali perlu untuk UI
3. tidak mengubah status bisnis
4. tidak menghapus validasi
5. tidak mengubah alur submit
6. tidak mengubah fungsi existing tanpa test manual
7. refactor UI dengan wrapper component

---

# 44. STRATEGI AMAN UNTUK CODEX

Gunakan prompt ini:

```txt
Lakukan UI/UX refactor secara aman.

Aturan:
1. Jangan ubah business logic.
2. Jangan ubah struktur data Firestore.
3. Jangan ubah query existing.
4. Jangan ubah nama field.
5. Jangan ubah alur submit.
6. Fokus hanya pada layout, className, reusable UI component, spacing, typography, dan responsive behavior.
7. Setelah perubahan, pastikan npm run build berhasil.
8. Jika menemukan logic bercampur UI, ekstrak hanya presentational component tanpa mengubah hasil data.
```

---

# 45. ACCEPTANCE CRITERIA

UI refactor dianggap berhasil jika:

```txt
✅ Semua halaman tetap berfungsi
✅ Build sukses
✅ Antrean tetap realtime
✅ Submit data tetap sama
✅ Tidak ada field Firestore berubah
✅ Tidak ada flow pemeriksaan berubah
✅ Mobile lebih mudah digunakan
✅ Dashboard lebih premium
✅ Komponen lebih konsisten
✅ Aplikasi terasa lebih profesional
```

---

# 46. CATATAN FINAL UNTUK DEVELOPER

Prioritas utama bukan “menghias” aplikasi.

Prioritasnya adalah:

```txt
membuat aplikasi terasa lebih jelas,
lebih aman dipakai,
lebih cepat dipahami,
lebih nyaman untuk petugas,
dan lebih layak sebagai sistem layanan kesehatan profesional.
```

Jangan membuat UI terlalu ramai.

Gunakan prinsip:

```txt
Less noise.
More clarity.
Strong hierarchy.
Consistent interaction.
Operational speed.
```

```
```
