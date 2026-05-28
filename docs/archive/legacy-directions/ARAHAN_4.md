````md
# 47. PHASE 2 — HALAMAN LOGIN

## Target

Login harus terlihat sebagai pintu masuk aplikasi resmi, bukan form sederhana.

## Arahan

- Gunakan logo/identitas Puskesmas/CKG.
- Tambahkan card login dengan radius besar.
- Gunakan background lembut.
- Tambahkan teks singkat: “Sistem Layanan Cek Kesehatan Gratis”.
- Jangan menambah field baru.
- Jangan mengubah logic submit.

---

# 48. PHASE 3 — DASHBOARD PREMIUM

## Target

Dashboard menjadi pusat komando layanan.

## Layout

```txt
[Hero Summary]
[Operational Charts]
[Realtime Queue / Alert]
[Detail Table]
````

## Jangan

* menampilkan semua data sekaligus di atas
* membuat chart terlalu banyak
* membuat tabel mendominasi halaman awal

---

# 49. PHASE 4 — LOKET & ANTREAN

## Fokus

Loket harus sangat cepat dipakai.

## Elemen utama

```txt
Lokasi aktif
Printer status
Tombol Ambil Antrean
Nomor terakhir
Daftar antrean
```

## Tombol utama

```txt
AMBIL NOMOR ANTREAN
```

Gunakan ukuran besar dan posisi paling dominan.

---

# 50. PHASE 5 — POS PEMERIKSAAN

## Pola wajib semua pos

```txt
Header pasien
Ringkasan status
Form pemeriksaan
Riwayat singkat
Sticky action
```

## Tujuan

Petugas tidak bingung dan tidak salah pasien.

---

# 51. PHASE 6 — RAPOR / HASIL PEMERIKSAAN

## Target

Rapor harus terlihat resmi, rapi, dan mudah dicetak.

## Arahan

* Gunakan layout dokumen medis.
* Heading jelas.
* Section hasil pemeriksaan dipisah.
* Badge risiko mudah dibaca.
* Tombol cetak/unduh jelas.
* Jangan ubah data yang ditampilkan.

---

# 52. PHASE 7 — ADMIN

## Target

Admin terasa seperti control center.

## Isi utama

```txt
Manajemen staf
Rekap layanan
Export data
Monitoring antrean
Audit activity
```

## UI

* gunakan tab
* hindari halaman terlalu panjang
* filter data dibuat jelas
* export button tidak terlalu dominan

---

# 53. PHASE 8 — TV DISPLAY

## Target

Tampilan layar publik harus broadcast-class.

## Prinsip

```txt
Besar
Jelas
Kontras
Tenang
Mudah dibaca dari jauh
```

## Jangan

* teks kecil
* tabel terlalu banyak
* animasi terlalu cepat
* warna terlalu ramai

---

# 54. QA MANUAL SETELAH UI REFACTOR

Developer wajib cek:

```txt
Login berhasil
Logout berhasil
Ambil antrean berhasil
Nomor tiket tampil benar
Panggil pasien berhasil
TV display update realtime
Pos 1 bisa simpan data
Pos berikutnya menerima data
Dashboard tampil data
Export tetap berjalan
Mobile tidak overflow
Desktop tidak terlalu melebar
```

---

# 55. MOBILE DEVICE CHECKLIST

Tes minimal pada:

```txt
360px width
390px width
430px width
768px tablet
1366px desktop
1920px desktop
```

Pastikan:

```txt
Tidak ada teks terpotong
Tidak ada tombol terlalu kecil
Bottom nav tidak menutup konten
Sticky action tidak menutupi form
Table mobile berubah menjadi card
```

---

# 56. VISUAL QUALITY CHECKLIST

Sebelum selesai, cek:

```txt
Apakah heading jelas?
Apakah tombol utama mudah ditemukan?
Apakah spacing konsisten?
Apakah warna status konsisten?
Apakah halaman terasa lega?
Apakah mobile nyaman disentuh?
Apakah card tidak terlalu ramai?
Apakah dashboard terlihat premium?
```

---

# 57. FINAL PROMPT UNTUK CODEX

```txt
Lanjutkan UI/UX refactor aplikasi CKG Malimpung agar terlihat profesional seperti enterprise healthcare super app.

Aturan keras:
- Jangan ubah alur data.
- Jangan ubah struktur Firestore.
- Jangan ubah nama field.
- Jangan ubah business logic.
- Jangan ubah validasi medis.
- Jangan ubah flow antrean.
- Jangan ubah realtime listener.
- Jangan ubah cara submit data.

Fokus:
- design system
- layout
- typography
- spacing
- responsive behavior
- dashboard hierarchy
- mobile usability
- table-to-card mobile
- sticky action
- sticky patient header
- TV display polish
- loading/error/empty state

Kerjakan bertahap:
1. Buat design-system components.
2. Buat AppShell.
3. Polish Login.
4. Polish Dashboard.
5. Polish Loket.
6. Polish Pos pages.
7. Polish Admin.
8. Polish Rapor.
9. Polish TV Display.
10. Jalankan npm run build.

Semua perubahan harus aman dan backward-compatible.
```

---

# 58. KESIMPULAN

Aplikasi CKG Malimpung tidak perlu dirombak total.

Yang dibutuhkan adalah:

```txt
UI polish terstruktur
design system konsisten
layout lebih lega
hierarchy lebih kuat
mobile UX lebih operasional
dashboard lebih premium
TV display lebih broadcast-class
```

Dengan pendekatan ini, aplikasi bisa naik kelas dari:

```txt
sistem internal operasional
```

menjadi:

```txt
platform layanan kesehatan digital profesional
```

```
```
