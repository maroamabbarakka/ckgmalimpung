# 09 — TV Display dan Antrean Publik

## Tujuan

TV display harus menjadi tampilan layanan publik yang jelas, modern, dan mudah dibaca dari ruang tunggu.

## Masalah Yang Harus Dihindari

- Tulisan terlalu kecil.
- Terlalu banyak data pasien.
- Menampilkan data sensitif.
- Antrean tidak real-time.
- Tidak ada mode fullscreen.
- Desain seperti dashboard admin, bukan display publik.

---

## Data Yang Boleh Ditampilkan

Boleh:
- Nomor antrean.
- Inisial/nama singkat jika diperlukan.
- Pos tujuan.
- Status panggilan.
- Edukasi kesehatan.
- Estimasi waktu umum.

Jangan tampilkan:
- NIK penuh.
- alamat lengkap.
- hasil pemeriksaan.
- diagnosis.
- nomor HP.

---

## Layout TV Display

```txt
Header institusi
Nomor sedang dipanggil
Daftar antrean berikutnya
Status pos
Panel edukasi
Jam dan tanggal
```

---

## Komponen

Buat:

```txt
src/features/tv/
  TvDisplayPage.jsx
  CurrentCall.jsx
  QueueTicker.jsx
  PosStatusGrid.jsx
  HealthEducationPanel.jsx
  tvService.js
```

---

## Current Call

Ukuran besar:

```jsx
function CurrentCall({ call }) {
  return (
    <section className="rounded-[2rem] bg-teal-600 p-8 text-white">
      <p className="text-2xl font-black uppercase">Nomor Dipanggil</p>
      <h1 className="mt-4 text-8xl font-black tracking-tight">{call?.noAntrian || '-'}</h1>
      <p className="mt-4 text-4xl font-bold">{call?.posTujuan || '-'}</p>
    </section>
  );
}
```

---

## Antrian Berikutnya

Tampilkan 5–8 nomor saja.

```txt
A012 → Pos 2
A013 → Pos 1
A014 → Pos 4
```

---

## Mode Fullscreen

Tambahkan tombol tersembunyi/pojok:
```txt
Fullscreen
```

```js
function enterFullscreen() {
  document.documentElement.requestFullscreen?.();
}
```

---

## Auto Refresh / Realtime

Gunakan Firestore listener jika sudah ada.

Fallback:
- polling 10 detik.
- tampilkan status koneksi.

---

## Suara Panggilan

Tahap awal:
- Bunyi ding-dong.
- Text-to-speech browser.

Contoh:

```js
export function speakQueue(text) {
  if (!window.speechSynthesis) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'id-ID';
  msg.rate = 0.9;
  window.speechSynthesis.speak(msg);
}
```

Panggilan:
```txt
Nomor A012, menuju Pos 2
```

---

## Edukasi Kesehatan

Panel rotating:
- Cuci tangan.
- Minum air putih.
- Cek tekanan darah.
- Berhenti merokok.
- Aktivitas fisik.
- Makan gizi seimbang.

Data bisa hardcoded dulu:

```js
export const HEALTH_MESSAGES = [
  'Cek tekanan darah secara rutin untuk mencegah risiko hipertensi.',
  'Biasakan aktivitas fisik minimal 30 menit setiap hari.',
  'Kurangi gula, garam, dan lemak untuk menjaga kesehatan.',
];
```

Ganti setiap 15 detik.

---

## Responsif Display

Target:
- TV 16:9 1366x768
- TV Full HD 1920x1080
- Tablet landscape

Gunakan:
```txt
min-h-screen
grid
text besar
```

---

## Branding

Header:
- Logo Kabupaten Pinrang.
- Logo Puskesmas Malimpung.
- Nama TERSANJUNG.
- UPT Puskesmas Malimpung.

Jangan memenuhi layar dengan logo terlalu besar.

---

## Testing

1. Buka `/tv`.
2. Fullscreen.
3. Panggil nomor dari loket/pos.
4. Pastikan nomor berubah real-time.
5. Pastikan tidak ada NIK/alamat.
6. Test di 1366x768.
7. Test di 1920x1080.
8. Test suara panggilan.
9. Matikan internet.
10. Display harus menampilkan status koneksi.

## Definition of Done

- TV display tidak menampilkan data sensitif.
- Nomor panggilan sangat besar.
- Ada antrean berikutnya.
- Ada panel edukasi.
- Ada fullscreen.
- Ada status koneksi.

## Status Implementasi

Status: selesai teknis.

- Route `/tv` memakai listener real-time `panggilan_tv` dan antrean aktif dari proyeksi publik `public_queue`.
- `public_queue` hanya menyimpan nomor antrean, status pos, dan timestamp; layar publik tidak membaca koleksi `visits`.
- Backfill antrean lama tersedia lewat `npm run migrate:public-queue -- --admin-user=admin --admin-pin=PIN --commit`.
- Tanpa `--commit`, backfill hanya dry-run dan menampilkan daftar dokumen yang akan disinkronkan.
- Nomor panggilan aktif tampil besar dan otomatis hilang setelah periode panggilan.
- Data publik dibatasi ke nomor antrean dan pos tujuan; NIK, alamat, hasil pemeriksaan, diagnosis, dan nomor HP tidak ditampilkan.
- Tombol fullscreen tersedia di header.
- Status online/offline tampil di header.
- Panel edukasi kesehatan rotating tersedia melalui `HealthEducationPanel`.
- Antrean berikutnya tersedia melalui `QueueTicker`.
- Grid status POS tetap menampilkan ringkasan antrean per pos.
- Suara panggilan memakai bel sintetis dan Text-to-Speech browser dengan fallback pesan bila audio tidak didukung/diizinkan.
