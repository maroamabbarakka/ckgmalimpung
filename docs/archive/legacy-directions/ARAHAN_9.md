````md
# ARAHAN TAMBAHAN DEVELOPER — POLISH WEB/PWA CKG MALIMPUNG

## Fokus Tambahan

Setelah UI/UX utama, rapikan:

1. PWA install experience
2. Offline/online status
3. Session timeout
4. Permission UX
5. Deep link handling
6. Role-based menu cleanup
7. Mobile safe area
8. Loading/empty/error state
9. Prevent double submit
10. Data privacy UI

---

# 1. PWA INSTALL EXPERIENCE

## Target

User HP bisa menginstal aplikasi seperti app biasa.

## Tugas

Buat:

```txt
src/components/system/InstallAppBanner.jsx
````

Fitur:

```txt
Muncul hanya jika app bisa di-install
Tombol: Install Aplikasi
Jika iPhone Safari, tampilkan instruksi manual
Jika sudah installed, banner hilang
```

## Prompt Codex

```txt
Tambahkan InstallAppBanner untuk PWA.
Jangan ubah logic data.
Gunakan beforeinstallprompt.
Tampilkan banner ringan di dashboard/mobile.
```

---

# 2. OFFLINE / ONLINE INDICATOR

## Target

Petugas tahu kondisi koneksi.

Buat:

```txt
src/components/system/ConnectionStatus.jsx
```

Status:

```txt
Online
Offline - data akan sinkron saat internet kembali
Menyambungkan ulang
```

Tempatkan di:

```txt
AppShell
Loket
Pos pemeriksaan
Admin dashboard
```

---

# 3. SESSION TIMEOUT

## Target

Jika aplikasi lama tidak dipakai, user otomatis logout atau dikunci.

Buat:

```txt
src/hooks/useIdleTimeout.js
```

Aturan awal:

```txt
15 menit tidak aktif: tampilkan peringatan
20 menit tidak aktif: logout otomatis
```

Pesan:

```txt
Sesi akan berakhir demi keamanan data pasien.
```

---

# 4. PERMISSION UX

Rapikan pesan izin untuk:

```txt
Kamera OCR
Suara TV Display
Bluetooth printer
Lokasi jika ada
```

Jangan tampilkan error teknis mentah.

Contoh:

```txt
Aplikasi membutuhkan izin kamera untuk membaca KTP/KK.
Silakan izinkan akses kamera di browser.
```

---

# 5. DEEP LINK HANDLING

## Masalah

Jika user buka langsung route seperti:

```txt
/pos1
/rapor
/admin-dashboard
```

jangan sampai blank.

## Tugas

Pastikan:

```txt
auth loading tampil
jika belum login → /login
jika role tidak sesuai → /dashboard
jika route tidak ada → /dashboard
```

---

# 6. ROLE-BASED MENU CLEANUP

## Target

User hanya melihat menu sesuai tugas.

Contoh:

```txt
Petugas loket: Loket, Dashboard Ringkas
Dokter: Pos dokter, Rapor
Admin: semua menu
TV: hanya Display
```

Jangan tampilkan menu yang akhirnya error permission.

---

# 7. MOBILE SAFE AREA

Tambahkan ke bottom nav dan floating action:

```css
padding-bottom: env(safe-area-inset-bottom);
```

Pastikan:

```txt
tombol tidak tertutup navbar HP
konten terakhir tidak ketutup bottom nav
input tidak ketutup keyboard
```

---

# 8. LOADING / EMPTY / ERROR STATE

Semua halaman wajib punya:

```txt
LoadingState
EmptyState
ErrorState
```

Jangan:

```txt
return null
halaman putih kosong
FirebaseError mentah
```

---

# 9. PREVENT DOUBLE SUBMIT

Semua action penting wajib:

```txt
disabled saat loading
label berubah jadi Memproses...
tidak bisa diklik dua kali
```

Terapkan pada:

```txt
Ambil Antrean
Simpan Pos
Panggil Pasien
Cetak
Export
Login
```

---

# 10. DATA PRIVACY UI

## Target

Data pasien tidak sembarang tampil penuh.

Terapkan:

```txt
masking NIK
hindari data medis sensitif di TV display
logout otomatis
peringatan privasi di admin/rapor
```

Contoh masking:

```txt
7312********1234
```

---

# PROMPT MASTER CODEX LANJUTAN

```txt
Lanjutkan polish aplikasi CKG Malimpung dari sisi PWA, mobile UX, keamanan pengalaman pengguna, dan reliability UI.

Aturan:
- Jangan ubah struktur Firestore.
- Jangan ubah business logic.
- Jangan ubah flow antrean.
- Jangan ubah validasi medis.
- Jangan ubah query utama.
- Jangan ubah payload submit.

Tugas:
1. Tambahkan InstallAppBanner.
2. Tambahkan ConnectionStatus.
3. Tambahkan useIdleTimeout.
4. Rapikan permission message untuk kamera, suara, Bluetooth printer.
5. Pastikan deep link tidak blank.
6. Rapikan role-based menu.
7. Tambahkan safe-area padding mobile.
8. Pastikan semua halaman punya loading/empty/error state.
9. Prevent double submit pada semua action penting.
10. Masking NIK di tampilan publik.
11. Jalankan npm run build.
```

```
```
