````md
# 179. ROADMAP IMPLEMENTASI BERTAHAP

## WEEK 1 — FOUNDATION

Fokus:

```txt
design system
base components
AppShell
responsive foundation
````

Kerjakan:

* AppButton
* AppCard
* AppBadge
* AppSection
* AppInput
* AppShell
* spacing system
* typography system

Jangan sentuh halaman kompleks dulu.

---

# 180. WEEK 2 — CORE OPERATIONAL UI

Fokus:

```txt
Login
Dashboard
Loket
```

Target:

* hierarchy jelas
* mobile nyaman
* tombol utama dominan
* summary card premium
* realtime status lebih jelas

---

# 181. WEEK 3 — POS SYSTEM

Fokus:

```txt
Pos 1–7
```

Target:

* layout seragam
* sticky patient header
* floating action
* form section
* mobile usability
* validation UX lebih jelas

---

# 182. WEEK 4 — ADMIN & REPORTING

Fokus:

```txt
Admin Dashboard
Rapor
Export View
```

Target:

* control center feel
* print-ready report
* filter lebih rapi
* chart lebih profesional

---

# 183. WEEK 5 — TV DISPLAY & POLISH

Fokus:

```txt
TV Display
loading state
empty state
error state
animation polish
```

Target:

* broadcast-class display
* readable from distance
* smoother experience
* visual consistency final

---

# 184. PRIORITAS IMPACT VS EFFORT

## IMPACT TINGGI — EFFORT RENDAH

Kerjakan dulu:

```txt
spacing
typography
card system
button consistency
dashboard hierarchy
sticky action
```

---

## IMPACT TINGGI — EFFORT MENENGAH

```txt
responsive layout
table-to-card mobile
TV display redesign
AppShell
```

---

## IMPACT MENENGAH — EFFORT TINGGI

```txt
motion system
dark mode
advanced chart system
```

---

# 185. VISUAL CONSISTENCY AUDIT

Sebelum selesai, audit:

## Typography

```txt
Apakah semua heading konsisten?
Apakah body text konsisten?
Apakah ukuran tidak random?
```

## Spacing

```txt
Apakah semua card punya padding sama?
Apakah section gap konsisten?
Apakah tombol punya height konsisten?
```

## Color

```txt
Apakah warna status konsisten?
Apakah primary color konsisten?
Apakah terlalu banyak warna?
```

---

# 186. MOBILE UX CHECKLIST KHUSUS PETUGAS

Karena aplikasi dipakai operasional lapangan.

## Wajib:

```txt
bisa dipakai satu tangan
tombol besar
mudah disentuh
tidak banyak popup
tidak perlu zoom
sticky action jelas
```

---

# 187. MOBILE ERROR YANG HARUS DIHINDARI

```txt
button terlalu kecil
text terlalu kecil
table overflow
sticky element menutupi form
bottom nav menutupi content
keyboard menutupi input
```

---

# 188. TV DISPLAY CHECKLIST

## Wajib dites:

```txt
TV 32 inch
TV 43 inch
Videotron
Jarak 5 meter
Jarak 10 meter
Ruangan terang
Ruangan gelap
```

---

# 189. TV DISPLAY RULE FINAL

## Nomor antrean

Harus:

```txt
langsung terlihat
langsung terbaca
langsung dipahami
```

Jika user harus fokus membaca, berarti gagal.

---

# 190. ICONOGRAPHY STANDARD

Gunakan satu library:

```txt
lucide-react
```

Kategori:

```txt
Dashboard
Queue
Patient
Medical
Warning
Print
Export
Settings
```

---

# 191. ICON RULE

## Jangan:

```txt
mix icon style
icon glossy
icon 3D
icon dekoratif
```

## Gunakan:

```txt
outline clean icons
consistent stroke
consistent size
```

---

# 192. CHART SYSTEM STANDARD

Chart harus membantu keputusan.

## Jangan:

```txt
chart hanya dekorasi
terlalu banyak warna
terlalu banyak legend
```

---

# 193. CHART PRIORITY

Gunakan chart untuk:

```txt
tren kunjungan
risiko kesehatan
antrean
distribusi usia
status layanan
```

---

# 194. ACCESSIBILITY STANDARD

Healthcare UI wajib accessible.

## Minimum:

```txt
contrast cukup
font terbaca
button besar
focus state jelas
touch target aman
```

---

# 195. DARK MODE (OPTIONAL)

Jika dibuat:

## Jangan:

```txt
pure black
warna neon
contrast berlebihan
```

## Gunakan:

```txt
dark slate
soft contrast
muted colors
```

---

# 196. PRINT VIEW STANDARD

## Semua halaman print:

```txt
tanpa sidebar
tanpa bottom nav
tanpa sticky action
tanpa shadow berat
```

---

# 197. ANTI-PATTERN YANG DILARANG

## Jangan:

```txt
glassmorphism berlebihan
gradient ramai
shadow berat
animasi ramai
dashboard terlalu padat
popup terus menerus
```

---

# 198. STRUKTUR FOLDER FINAL IDEAL

```txt
src/
  design-system/
  layouts/
  components/
  hooks/
  services/
  utils/
  pages/
```

---

# 199. STRATEGI MIGRASI AMAN

## Prinsip:

```txt
sedikit demi sedikit
jangan rewrite besar
jangan ubah semua halaman sekaligus
```

---

# 200. FINAL BENCHMARK FEEL

Aplikasi setelah refactor harus terasa seperti gabungan:

```txt
Halodoc operational dashboard
Gojek super app clarity
Modern SaaS admin
Realtime healthcare operations center
```

BUKAN:

```txt
template admin gratisan
dashboard CRUD lama
sistem internal kuno
```

```
```
Bisa. Itu masalah **routing/history di aplikasi web/PWA**, bukan masalah HP-nya.

Targetnya: saat user **swipe back** atau tekan tombol **Back**, aplikasi kembali ke halaman sebelumnya, bukan ke halaman kosong.

````md
# ARAHAN DEVELOPER — PERBAIKAN TOMBOL BACK / SWIPE BACK MOBILE

## Masalah

Saat aplikasi dibuka di HP, ketika user:

- swipe back
- tekan tombol back browser
- tekan tombol back Android

aplikasi kadang kembali ke halaman kosong.

Ini biasanya terjadi karena:

1. route tidak punya fallback yang benar
2. history stack tidak dikelola
3. redirect memakai `window.location`
4. navigasi memakai replace terlalu sering
5. protected route mengarahkan ke halaman kosong
6. halaman reload langsung ke route tertentu tidak ditangani SPA

---

# Target UX

Back behavior harus menyerupai aplikasi mobile:

```txt
Halaman Pos 1 → kembali ke Loket/Dashboard
Halaman Detail → kembali ke daftar
Halaman Admin → kembali ke Dashboard
Halaman Rapor → kembali ke halaman sebelumnya
Jika tidak ada riwayat → kembali ke Dashboard
````

---

# 1. Gunakan React Router Navigation, Jangan window.location

## Hindari

```js
window.location.href = '/dashboard';
window.location.replace('/login');
```

## Gunakan

```js
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

navigate('/dashboard');
```

---

# 2. Jangan Terlalu Sering Pakai replace

## Hindari jika bukan login/logout

```js
navigate('/dashboard', { replace: true });
```

Karena `replace: true` menghapus halaman sebelumnya dari history.

## Gunakan untuk navigasi normal

```js
navigate('/dashboard');
```

## replace hanya untuk:

```txt
login sukses
logout
redirect unauthorized
route invalid
```

---

# 3. Buat Helper Safe Back

Buat file:

```txt
src/utils/navigation.js
```

Isi:

```js
export function safeBack(navigate, fallback = '/dashboard') {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate(fallback, { replace: true });
  }
}
```

Pemakaian:

```js
import { safeBack } from './utils/navigation';

safeBack(navigate, '/dashboard');
```

---

# 4. Tambahkan Tombol Kembali Internal

Di halaman penting, jangan hanya mengandalkan tombol back HP.

Contoh:

```jsx
<button onClick={() => safeBack(navigate, '/dashboard')}>
  Kembali
</button>
```

Halaman yang wajib punya tombol kembali:

```txt
Rapor
Admin
Detail pasien
Form pemeriksaan
Pengaturan
```

---

# 5. Perbaiki Fallback Route

Di `App.jsx`, tambahkan route fallback.

```jsx
<Route path="*" element={<Navigate to="/dashboard" replace />} />
```

Jangan biarkan route tidak dikenal menampilkan halaman kosong.

---

# 6. Pastikan Firebase Hosting SPA Rewrite Benar

`firebase.json` harus punya:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Ini penting agar ketika user reload atau kembali ke route tertentu, aplikasi tetap memuat React Router.

---

# 7. Protected Route Jangan Menghasilkan Blank Page

Jika user belum login:

```jsx
return <Navigate to="/login" replace />;
```

Jika role tidak sesuai:

```jsx
return <Navigate to="/dashboard" replace />;
```

Jangan return `null` tanpa loading/error.

---

# 8. Tambahkan Loading State Saat Auth Belum Siap

Blank page sering terjadi karena auth/profile masih loading.

Contoh:

```jsx
if (authLoading) {
  return <FullPageLoading text="Memuat aplikasi..." />;
}
```

Jangan:

```jsx
if (authLoading) return null;
```

---

# 9. Buat Mobile Back UX Seperti App

Tambahkan di `AppShell`:

```jsx
const navigate = useNavigate();

<button onClick={() => safeBack(navigate, '/dashboard')}>
  ← Kembali
</button>
```

Tampilkan hanya pada halaman selain dashboard.

---

# 10. Prompt Untuk VS/Codex

```txt
Perbaiki behavior tombol back dan swipe back mobile pada aplikasi CKG Malimpung.

Masalah:
Saat user swipe back atau tekan tombol kembali di HP, aplikasi kembali ke halaman kosong.

Target:
Back harus kembali ke halaman sebelumnya seperti aplikasi mobile.
Jika tidak ada halaman sebelumnya, arahkan ke /dashboard.
Jangan mengubah data flow, Firestore logic, auth logic, queue logic, atau business logic.

Tugas:
1. Cari semua penggunaan window.location.href, window.location.replace, dan location.assign.
2. Ganti navigasi internal dengan useNavigate dari react-router-dom.
3. Jangan pakai navigate(..., { replace: true }) kecuali login, logout, unauthorized, dan fallback route.
4. Buat helper src/utils/navigation.js dengan safeBack(navigate, fallback).
5. Tambahkan tombol kembali pada halaman detail/form penting.
6. Pastikan route wildcard path="*" diarahkan ke /dashboard.
7. Pastikan protected route tidak pernah return null tanpa loading.
8. Tambahkan loading screen jika auth/profile belum siap.
9. Pastikan firebase.json memiliki rewrite ke /index.html.
10. Jalankan npm run build.
11. Tes di mobile: buka dashboard → loket → pos → tekan back → harus kembali bertahap.
```

---

# Kesimpulan

Bisa dibuat seperti aplikasi HP biasa. Solusinya bukan mengubah database, tetapi memperbaiki:

```txt
React Router navigation
history stack
fallback route
protected route loading
mobile back behavior
```

Ini aman dilakukan selama developer **tidak mengubah logic data dan alur bisnis**.
