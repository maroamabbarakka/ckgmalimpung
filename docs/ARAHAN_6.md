````md
# 122. HALAMAN LOGIN — DETAIL IMPLEMENTASI

## Tujuan Visual

Login harus memberi kesan:

```txt
resmi
aman
bersih
modern
milik layanan kesehatan
````

## Layout Desktop

```txt
Kiri:
- branding aplikasi
- judul besar
- deskripsi singkat
- ilustrasi/pattern lembut

Kanan:
- login card
- input username
- input PIN/password
- tombol masuk
```

## Layout Mobile

```txt
Logo
Nama aplikasi
Deskripsi singkat
Login card
Footer kecil
```

## Jangan Diubah

```txt
handleLogin
validasi login existing
nama field input
alur error
```

---

# 123. CONTOH LOGIN UI AMAN

```jsx
<div className="min-h-screen bg-slate-50">
  <div className="grid min-h-screen lg:grid-cols-2">
    <section className="hidden bg-teal-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div>
        <div className="text-sm font-semibold uppercase tracking-widest text-teal-100">
          Puskesmas Malimpung
        </div>
        <h1 className="mt-6 text-4xl font-bold leading-tight">
          Sistem Layanan Cek Kesehatan Gratis
        </h1>
        <p className="mt-4 max-w-md text-teal-50">
          Platform operasional terpadu untuk antrean, pemeriksaan,
          rapor, dan monitoring layanan CKG.
        </p>
      </div>

      <p className="text-sm text-teal-100">
        TERSANJUNG CKG Malimpung
      </p>
    </section>

    <section className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">
          Masuk Aplikasi
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Gunakan akun petugas yang telah terdaftar.
        </p>

        {/* Form existing tetap dipakai di sini */}
      </div>
    </section>
  </div>
</div>
```

---

# 124. DASHBOARD — DETAIL IMPLEMENTASI

## Tujuan

Dashboard bukan tempat menumpuk semua data.

Dashboard harus menjawab:

```txt
Hari ini layanan berjalan bagaimana?
Berapa pasien?
Apakah ada antrean menumpuk?
Apakah ada risiko tinggi?
Apa yang perlu diperhatikan?
```

---

# 125. DASHBOARD HERO SUMMARY

Buat 4 kartu utama:

```txt
Total Pasien Hari Ini
Antrean Aktif
Pasien Selesai
Risiko Tinggi
```

## Style

```txt
angka besar
label kecil
icon lembut
trend/keterangan kecil
```

---

# 126. CONTOH DASHBOARD GRID

```jsx
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <AppStatCard
    label="Total Pasien Hari Ini"
    value={totalPasien}
    description="Semua kunjungan CKG hari ini"
  />

  <AppStatCard
    label="Antrean Aktif"
    value={antreanAktif}
    description="Pasien yang belum selesai"
  />

  <AppStatCard
    label="Pasien Selesai"
    value={pasienSelesai}
    description="Layanan selesai hari ini"
  />

  <AppStatCard
    label="Risiko Tinggi"
    value={risikoTinggi}
    description="Perlu perhatian petugas"
    tone="danger"
  />
</div>
```

---

# 127. DASHBOARD CONTENT PRIORITY

Urutan konten:

```txt
1. Summary cards
2. Realtime status layanan
3. Chart utama
4. Alert risiko
5. Tabel detail
```

Tabel jangan langsung berada di paling atas.

---

# 128. LOKET — DETAIL IMPLEMENTASI

## Tujuan

Loket harus bisa dipakai cepat bahkan saat ramai.

## Prioritas layar

```txt
1. Lokasi aktif
2. Tombol ambil nomor
3. Nomor terakhir
4. Printer
5. Antrean terbaru
```

---

# 129. LOKET PRIMARY ACTION

Tombol ambil antrean harus sangat dominan:

```jsx
<AppButton
  size="xl"
  className="w-full text-lg"
  onClick={handleAmbilAntrean}
  disabled={loading}
>
  {loading ? 'Memproses...' : 'Ambil Nomor Antrean'}
</AppButton>
```

Jangan ubah `handleAmbilAntrean`.

---

# 130. LOKET STATUS CARDS

Gunakan 3 card kecil:

```txt
Lokasi Aktif
Nomor Terakhir
Printer
```

Jangan membuat petugas mencari status penting di teks kecil.

---

# 131. POS 1 — DETAIL IMPLEMENTASI

## Masalah Umum

Pos 1 cenderung paling kompleks karena registrasi, OCR, validasi, dan data pasien.

## Target UI

Pisahkan menjadi:

```txt
1. Antrean pasien
2. Pasien aktif
3. Identitas
4. OCR KTP/KK
5. Alamat
6. Riwayat
7. Aksi simpan
```

---

# 132. POS 1 SAFE REFACTOR

Boleh:

```txt
memindahkan tampilan form ke card
menambah section title
membuat sticky header
membuat tombol lebih jelas
```

Tidak boleh:

```txt
mengubah hasil parsing OCR
mengubah validasi NIK
mengubah payload Firestore
mengubah transaksi submit
```

---

# 133. POS 2–7 — STANDARDISASI

Setiap pos harus punya wajah yang sama.

## Header

```txt
Nama Pos
Deskripsi fungsi pos
Status online
```

## Patient Summary

```txt
Nama
NIK
Usia
Nomor antrean
Status
```

## Content

```txt
Form / hasil / tindakan
```

## Action

```txt
Simpan
Simpan & Lanjut
Kembali
```

---

# 134. ADMIN — DETAIL IMPLEMENTASI

## Target

Admin harus terasa sebagai control center, bukan halaman panjang.

## Gunakan Tabs

```txt
Ringkasan
Kunjungan
Antrean
Risiko
Staf
Export
Pengaturan
```

## Setiap Tab

Maksimal tampilkan:

```txt
1 primary table
1 filter section
1 action group
```

---

# 135. RAPOR — DETAIL IMPLEMENTASI

## Target

Rapor harus terlihat resmi dan mudah dicetak.

## Struktur

```txt
Kop / Header
Identitas Pasien
Ringkasan Pemeriksaan
Hasil Per Pos
Kesimpulan
Tindak Lanjut
QR / Verifikasi jika ada
```

## Print Mode

Navigation harus hilang saat print.

```css
@media print {
  .app-shell,
  .sidebar,
  .bottom-nav,
  .no-print {
    display: none !important;
  }

  .print-area {
    display: block;
    background: white;
    color: black;
  }
}
```

---

# 136. TV DISPLAY — DETAIL IMPLEMENTASI LANJUT

## Layout Rekomendasi

```txt
┌─────────────────────────────────────────────┐
│ PUSKESMAS MALIMPUNG | CKG | Lokasi Aktif    │
├───────────────────────────┬─────────────────┤
│                           │ Pos 1  A-001    │
│      A-012                │ Pos 2  A-008    │
│   SEDANG DIPANGGIL        │ Pos 3  A-004    │
│   POS PEMERIKSAAN 2       │ Pos 4  A-010    │
│                           │                 │
├───────────────────────────┴─────────────────┤
│ Informasi layanan / edukasi kesehatan        │
└─────────────────────────────────────────────┘
```

---

# 137. TV DISPLAY SAFE RULE

Boleh ubah:

```txt
layout
warna
ukuran font
animasi
spacing
```

Jangan ubah:

```txt
listener panggilan
source data antrean
speech synthesis logic
status antrean
```

---

# 138. RESPONSIVE BREAKPOINT STANDARD

Gunakan Tailwind default:

```txt
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Aturan:

```txt
mobile first
jangan desain desktop dulu
pastikan 390px aman
```

---

# 139. MAX WIDTH RULE

Agar desktop tidak terlalu melebar:

```txt
max-w-7xl untuk dashboard
max-w-5xl untuk form
max-w-4xl untuk rapor
```

---

# 140. SAFE AREA MOBILE

Untuk bottom nav/sticky action:

```css
padding-bottom: env(safe-area-inset-bottom);
```

Gunakan agar aman di HP modern.

---

# 141. Z-INDEX STANDARD

```txt
10 card hover
20 dropdown
30 sticky header
40 floating action
50 modal
60 toast
```

Jangan memakai z-index random seperti 9999 kecuali benar-benar perlu.

---

# 142. MODAL RULE

Modal hanya untuk:

```txt
konfirmasi hapus
detail penting
pilihan kritis
```

Jangan gunakan modal untuk error biasa.

---

# 143. TOAST RULE

Toast untuk feedback singkat:

```txt
berhasil simpan
gagal simpan
koneksi terputus
printer tersambung
```

Durasi:

```txt
3–5 detik
```

---

# 144. PRINTER STATUS UX

Di Loket, tampilkan jelas:

```txt
Printer tersambung
Printer belum tersambung
Gunakan cetak browser
```

Jangan hanya icon.

---

# 145. OCR STATUS UX

Di Pos 1, OCR harus punya status:

```txt
Siap scan
Memproses gambar
Data berhasil dibaca
Data perlu diperiksa ulang
Gagal membaca gambar
```

Petugas harus tahu OCR bukan selalu 100% akurat.

---

# 146. OCR RESULT CONFIRMATION

Setelah OCR:

```txt
Tampilkan hasil dalam form
Berikan label "Periksa kembali hasil OCR"
Jangan langsung submit otomatis
```

---

# 147. MEDICAL RISK UX

Jika ada risiko tinggi:

```txt
Gunakan badge merah lembut
Tampilkan alasan risiko
Tampilkan anjuran tindak lanjut
```

Jangan hanya angka/warna tanpa penjelasan.

---

# 148. ACCESS ROLE VISIBILITY

Menu yang tidak sesuai role:

```txt
lebih baik disembunyikan
daripada tampil tapi error
```

Namun logic security tetap harus di backend/rules.

---

# 149. FINAL QA CHECK PER PAGE

## Login

```txt
mobile rapi
error jelas
loading jelas
logo tampil
```

## Dashboard

```txt
summary jelas
chart tidak penuh
table tidak mendominasi
```

## Loket

```txt
tombol utama terlihat
printer status jelas
lokasi aktif jelas
```

## Pos

```txt
pasien aktif jelas
form terbagi section
sticky action bekerja
```

## Rapor

```txt
print bersih
data lengkap
tombol tidak ikut tercetak
```

## TV

```txt
terbaca dari jauh
nomor dominan
suara tetap berjalan
```

---

# 150. PENUTUP

UI/UX refactor ini harus dilakukan sebagai **peningkatan lapisan presentasi**, bukan rekayasa ulang aplikasi.

Prinsip akhir:

```txt
Jangan sentuh data.
Jangan ubah logic.
Jangan ubah alur.
Naikkan kualitas tampilan dan pengalaman.
```

```
```
