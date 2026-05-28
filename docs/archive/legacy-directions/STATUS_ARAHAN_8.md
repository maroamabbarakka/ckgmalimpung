# Status ARAHAN 8

## Selesai

- Memastikan helper `safeBack(navigate, fallback)` tersedia di `src/utils/navigation.js`.
- Memastikan fallback route `path="*"` mengarah ke `/dashboard` dengan `replace`.
- Memastikan protected route tidak return blank page saat auth loading, karena sudah memakai `LoadingState`.
- Memastikan `firebase.json` memiliki rewrite SPA ke `/index.html`.
- Menambahkan tombol `Kembali` di mobile AppShell untuk halaman selain Beranda dan Dashboard.
- Tombol kembali mobile memakai `safeBack(navigate, '/dashboard')`, sehingga jika history kosong user diarahkan ke Dashboard.
- Dashboard dibuat sebagai fallback aman untuk seluruh role operasional yang sudah login agar redirect unauthorized tidak mentok pada halaman kosong.
- `RequireRole` diberi fallback kedua ke Beranda khusus jika user tetap tidak punya akses ke `/dashboard`, sehingga tidak terjadi redirect ke route yang sama.
- Admin Dashboard memiliki tombol `Kembali` mobile yang terlihat langsung dan memakai `safeBack(navigate, '/dashboard')`.
- Logout dari Admin memakai redirect login dengan `replace`, sesuai aturan logout.
- AppShell memakai layout mobile/tablet sampai breakpoint `lg`, sehingga viewport 768px tidak dipaksa memakai desktop nav yang melebar.
- Padding safe-area mobile dipertahankan sampai breakpoint `lg`, selaras dengan bottom navigation yang masih tampil pada tablet kecil.
- CSS global menahan overflow horizontal dan text autosizing browser mobile agar layout stabil di perangkat kecil.
- Uji responsif Playwright mencakup 320, 360, 390, 430, dan 768px untuk Beranda, Loket, Pos 2, dan Dashboard.
- Uji responsif diperluas ke route berat: Pos 1, Pos 7, dan Admin Dashboard pada viewport 320, 360, 390, 430, dan 768px.
- Viewport meta memakai `viewport-fit=cover` dan tidak lagi mengunci zoom, sehingga lebih aman untuk aksesibilitas mobile.
- Tombol mobile header AppShell (`Admin`, `Keluar`, `Masuk`) dibuat memenuhi touch target minimum.
- Playwright config dipisahkan di `playwright.config.cjs` agar e2e hanya menjalankan `tests/e2e`.
- Audit visual mandiri dilakukan untuk Beranda, Loket, Pos 1-7, Dashboard klaster, dan Admin pada viewport 320, 390, dan 768px.
- Header mobile dibuat lebih lega pada viewport sempit: teks brand disembunyikan saat tombol `Kembali` aktif di bawah 390px.
- Bottom navigation dipadatkan pada viewport sempit agar lebih banyak item terlihat tanpa scroll berlebihan.
- Form Pos 2 kategori Lansia diverifikasi di mobile: tidak ada overflow dan blok antropometri tidak lagi saling menumpuk.
- Field input dinamis dibuat lebih profesional dan proporsional: input angka pendek tidak melebar berlebihan di tablet/desktop, pilihan panjang otomatis diberi span lebih lega, dan field naratif tetap memakai ruang penuh.
- Audit Pos 2 Lansia ulang pada viewport 390px dan 1024px menunjukkan `documentScrollWidth` tetap sama dengan `innerWidth`, tanpa overflow horizontal.
- Blok Profil Lipid / Asam Urat dirapikan agar input angka lab memakai pola klinis yang sama: field penuh di mobile, ringkas di layar lebih besar, unit `mg/dL` menjadi pill kecil, dan badge interpretasi tidak memaksa layout melebar.
- Audit Pos 4 Lansia (`B028`) pada viewport 320px dan 390px menunjukkan tidak ada overflow horizontal; field lipid tetap terbaca dan tidak mengecil akibat unit satuan.
- Logika lebar kolom jawaban disempurnakan: angka 2-3 digit tidak lagi dipaksa full width, placeholder angka memakai `0`, unit medis dipisah sebagai label/pill, dan voice input diberi ruang lebih lega pada kartu pertanyaan mobile.
- Kartu pertanyaan Pos 5/6 dipadatkan secara proporsional di mobile agar field voice/text naik dari sekitar 170px menjadi sekitar 186px pada viewport 320px tanpa overflow.

## Audit Navigasi

- Tidak ditemukan navigasi internal dengan `window.location.href`, `window.location.replace`, atau `location.assign`.
- Penggunaan `window.location.reload`, `window.location.origin`, dan `window.location.href` yang tersisa bukan navigasi internal biasa:
  - reload halaman error/reset modul
  - origin untuk URL laporan/aset
  - href untuk QR rapor

## Batas Perubahan

- Tidak mengubah route bisnis.
- Tidak mengubah auth flow.
- Tidak mengubah role guard.
- Tidak mengubah data flow, queue flow, atau Firestore logic.

## Verifikasi

```bash
npm run lint
npm run test:run
npm run build
```

Status terakhir: semua sukses, termasuk 12 skenario e2e responsif/login, unit test, build, dan audit visual manual lintas Pos 2/4/5/6. Warning build yang tersisa hanya peringatan ukuran chunk Vite.

## Perlu Cek Manual

- Mobile: Dashboard -> Loket -> tekan Kembali.
- Mobile: Beranda -> Pos -> tekan Kembali.
- Rapor tetap memakai tombol kembali internal dan print tetap berjalan.
