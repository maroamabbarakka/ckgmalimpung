````md
# 151. IMPLEMENTATION GUARDRAILS UNTUK CODEX

Sebelum Codex mengubah file apa pun, instruksikan:

```txt
Baca file terlebih dahulu.
Identifikasi bagian UI dan bagian logic.
Ubah hanya JSX layout, className, wrapper component, dan copywriting UI.
Jangan ubah function handler, query Firestore, state utama, atau payload submit.
````

---

# 152. FILE YANG AMAN DIUBAH UNTUK UI

Aman:

```txt
className
layout wrapper
heading
label
button style
card style
responsive grid
empty state
loading state
error copy
```

Tidak aman:

```txt
nama collection
nama field
where/orderBy Firestore
serverTimestamp
runTransaction
onSnapshot
handleSubmit
handleSave
handleLogin
role guard
```

---

# 153. STRATEGI REVIEW PERUBAHAN

Setelah Codex membuat perubahan, developer wajib cek diff:

```txt
Apakah ada perubahan query?
Apakah ada field Firestore berubah?
Apakah ada handler submit berubah?
Apakah ada status antrean berubah?
Apakah ada role logic berubah?
Apakah ada validasi medis berubah?
```

Jika ada, rollback bagian tersebut.

---

# 154. TARGET AKHIR VISUAL

Aplikasi harus terlihat:

```txt
lebih bersih
lebih lapang
lebih konsisten
lebih premium
lebih mudah dipakai
lebih aman secara pengalaman
lebih siap ditampilkan ke pimpinan
lebih layak digunakan petugas
```

---

# 155. KALIMAT PROMPT LANJUTAN UNTUK CODEX

```txt
Lanjutkan polish UI/UX aplikasi CKG Malimpung berdasarkan dokumen arahan.

Khusus tahap ini:
- jangan sentuh data layer
- jangan ubah Firestore logic
- jangan ubah business logic
- jangan ubah submit handler
- jangan ubah role guard
- buat perubahan kecil dan aman
- gunakan reusable UI component
- prioritaskan mobile, dashboard, loket, pos, dan TV display
- jalankan npm run build setelah selesai
```

---

# 156. DEFINISI “SUPER APP LOOK” UNTUK APLIKASI INI

Untuk konteks CKG Malimpung, “super app look” berarti:

```txt
bukan penuh fitur di satu layar,
tetapi semua fitur terasa satu platform yang rapi,
cepat, profesional, konsisten, dan mudah dipakai.
```

---

# 157. PRINSIP DESAIN AKHIR

Gunakan prinsip:

```txt
Clarity over decoration
Consistency over creativity
Speed over complexity
Trust over trend
Operational comfort over visual gimmick
```

---

# 158. BATASAN FINAL

Jangan jadikan aplikasi terlalu mewah sampai mengganggu kerja petugas.

Targetnya:

```txt
premium tapi tetap sederhana
modern tapi tetap cepat
rapi tapi tidak berat
indah tapi tetap operasional
```

---

# 159. CATATAN UNTUK DEVELOPER

UI/UX yang baik untuk aplikasi kesehatan bukan hanya cantik.

Yang paling penting:

```txt
petugas tidak salah pasien
petugas tidak salah input
petugas tahu data tersimpan atau belum
pasien melihat antrean dengan jelas
admin membaca data dengan cepat
pimpinan melihat dashboard dengan percaya diri
```

---

# 160. PENUTUP FINAL

Dokumen ini harus dipakai sebagai panduan refactor UI/UX bertahap.

Prioritas:

```txt
1. Aman untuk logic
2. Konsisten secara visual
3. Nyaman di mobile
4. Profesional di desktop
5. Jelas di TV display
6. Siap dipresentasikan sebagai aplikasi layanan kesehatan modern
```

Selesai jika:

```txt
npm run build berhasil
alur antrean tidak berubah
data pasien tetap aman
submit semua pos tetap berjalan
TV display tetap realtime
tampilan jauh lebih profesional
```

```
```
````md
# 161. RINGKASAN EKSEKUSI UNTUK DEVELOPER

Gunakan urutan ini agar aman:

```txt
1. Buat komponen UI dasar
2. Terapkan ke Login
3. Terapkan ke Dashboard
4. Terapkan ke Loket
5. Terapkan ke Pos 1
6. Terapkan pola yang sama ke Pos 2–7
7. Terapkan ke Admin
8. Terapkan ke Rapor
9. Terapkan ke TV Display
10. Build dan smoke test
````

---

# 162. OUTPUT YANG DIHARAPKAN

Setelah refactor UI/UX, aplikasi harus:

```txt
Tidak terasa seperti admin template biasa
Tidak terasa padat
Tidak membingungkan petugas
Tidak menampilkan terlalu banyak hal sekaligus
Tidak kehilangan fungsi lama
```

Dan harus berubah menjadi:

```txt
aplikasi layanan kesehatan modern
dashboard operasional profesional
sistem antrean realtime yang jelas
platform internal yang layak dipresentasikan
```

---

# 163. PESAN AKHIR UNTUK CODEX

```txt
Tugas ini adalah UI/UX modernization, bukan rewrite aplikasi.

Jangan mengejar perubahan besar yang berisiko.
Kerjakan kecil, konsisten, dan aman.

Naikkan kualitas tampilan tanpa menyentuh kontrak data.
Jika ragu, jangan ubah logic.
```

```
```
````md
# 164. LAMPIRAN — PROMPT MASTER UNTUK VS/CODEX

Salin prompt ini ke VS/Codex:

```txt
Audit dan modernisasi UI/UX aplikasi CKG Malimpung agar tampil seperti enterprise healthcare super app.

Aturan keras:
1. Jangan ubah struktur Firestore.
2. Jangan ubah nama collection.
3. Jangan ubah nama field.
4. Jangan ubah query utama.
5. Jangan ubah handler submit.
6. Jangan ubah business logic.
7. Jangan ubah validasi medis.
8. Jangan ubah flow antrean.
9. Jangan ubah role guard.
10. Jangan ubah realtime listener.

Fokus hanya pada:
- layout
- spacing
- typography
- card
- button
- badge
- table responsive
- mobile UX
- dashboard hierarchy
- form readability
- loading state
- empty state
- error state
- TV display polish

Gunakan prinsip:
wrap, don't rewrite.
style, don't restructure logic.
extract presentational components only.

Setelah perubahan:
- jalankan npm run build
- cek login
- cek loket
- cek pos
- cek dashboard
- cek TV display
````

---

# 165. LAMPIRAN — STRUKTUR FILE TARGET FINAL

```txt
src/
  design-system/
    components/
      AppButton.jsx
      AppCard.jsx
      AppBadge.jsx
      AppInput.jsx
      AppSection.jsx
      AppStatCard.jsx
      EmptyState.jsx
      ErrorState.jsx
      LoadingSkeleton.jsx

  layouts/
    AppShell.jsx

  components/
    patient/
      PatientStickyHeader.jsx

    action/
      FloatingActionBar.jsx

    queue/
      QueueStatusBadge.jsx
```

---

# 166. PENANDA SELESAI

Refactor dianggap selesai jika aplikasi:

```txt
terlihat satu gaya
lebih nyaman di mobile
lebih rapi di desktop
dashboard lebih premium
loket lebih cepat dipakai
pos pemeriksaan lebih jelas
rapor lebih resmi
TV display lebih profesional
tanpa merusak data dan logic
```

```
```
````md
# 167. PROMPT CODEX PER HALAMAN — LOGIN

```txt
Polish halaman Login agar terlihat modern, resmi, dan profesional.

Aturan:
- Jangan ubah handleLogin.
- Jangan ubah field login.
- Jangan ubah validasi.
- Jangan ubah auth flow.
- Hanya ubah layout, className, copy UI, dan wrapper visual.

Target:
- background bersih
- login card modern
- branding Puskesmas/CKG jelas
- error state mudah dipahami
- tombol masuk besar
- mobile rapi
````

---

# 168. PROMPT CODEX PER HALAMAN — DASHBOARD

```txt
Polish Dashboard agar terasa seperti healthcare operations center.

Aturan:
- Jangan ubah query data.
- Jangan ubah kalkulasi statistik.
- Jangan ubah export logic.
- Jangan ubah chart data source.

Target:
- summary card di bagian atas
- hierarchy lebih jelas
- chart tidak terlalu padat
- tabel turun ke bawah
- responsive grid
- loading/empty state rapi
```

---

# 169. PROMPT CODEX PER HALAMAN — LOKET

```txt
Polish halaman Loket agar cepat dipakai petugas.

Aturan:
- Jangan ubah handle ambil antrean.
- Jangan ubah logic printer.
- Jangan ubah penomoran antrean.
- Jangan ubah Firestore write.

Target:
- tombol Ambil Nomor Antrean paling dominan
- lokasi aktif terlihat jelas
- nomor terakhir terlihat besar
- printer status mudah dipahami
- daftar antrean rapi
- mobile nyaman digunakan
```

---

# 170. PROMPT CODEX PER HALAMAN — POS 1

```txt
Polish Pos 1 tanpa mengubah flow registrasi pasien.

Aturan:
- Jangan ubah OCR logic.
- Jangan ubah parsing OCR.
- Jangan ubah validasi NIK.
- Jangan ubah submit handler.
- Jangan ubah payload Firestore.
- Jangan ubah status antrean.

Target:
- form dibagi section
- pasien aktif sticky header
- OCR status lebih jelas
- tombol simpan sticky di bawah
- mobile 1 kolom
- desktop maksimal 2 kolom
```

---

# 171. PROMPT CODEX PER HALAMAN — POS 2–7

```txt
Polish halaman Pos 2 sampai Pos 7 agar konsisten.

Aturan:
- Jangan ubah logic pemeriksaan.
- Jangan ubah data medis.
- Jangan ubah status pos.
- Jangan ubah handler simpan.
- Jangan ubah flow lanjut pos.

Target:
- semua pos punya layout seragam
- patient summary jelas
- form section rapi
- tombol utama konsisten
- loading/error state jelas
- mobile nyaman
```

---

# 172. PROMPT CODEX PER HALAMAN — ADMIN

```txt
Polish halaman Admin/Admin Dashboard agar terasa seperti control center.

Aturan:
- Jangan ubah query admin.
- Jangan ubah role logic.
- Jangan ubah export.
- Jangan ubah data staff.
- Jangan ubah permission logic.

Target:
- gunakan tab/section
- ringkasan di atas
- tabel lebih rapi
- filter lebih jelas
- tombol export tidak terlalu ramai
- desktop terlihat premium
- mobile tetap usable
```

---

# 173. PROMPT CODEX PER HALAMAN — RAPOR

```txt
Polish halaman Rapor agar terlihat resmi dan mudah dicetak.

Aturan:
- Jangan ubah data yang ditampilkan.
- Jangan ubah kalkulasi hasil.
- Jangan ubah QR/export/print logic.
- Jangan ubah struktur hasil medis.

Target:
- layout seperti dokumen kesehatan resmi
- section hasil pemeriksaan jelas
- print CSS bersih
- tombol tidak ikut tercetak
- mobile mudah dibaca
```

---

# 174. PROMPT CODEX PER HALAMAN — TV DISPLAY

```txt
Polish TV Display agar terlihat seperti broadcast queue display profesional.

Aturan:
- Jangan ubah listener data antrean.
- Jangan ubah speech synthesis logic.
- Jangan ubah source data panggilan.
- Jangan ubah status antrean.

Target:
- nomor antrean sangat besar
- pos tujuan jelas
- kontras tinggi
- animasi halus
- daftar antrean per pos rapi
- terbaca dari jarak 5–10 meter
```

---

# 175. TEMPLATE GITHUB ISSUE

```md
## Tujuan
Modernisasi UI/UX aplikasi CKG Malimpung tanpa mengubah data flow dan business logic.

## Scope
- Layout
- Typography
- Spacing
- Card system
- Button system
- Responsive mobile
- Dashboard hierarchy
- Form readability
- TV display polish

## Non-scope
- Firestore schema
- Business logic
- Queue flow
- Medical validation
- Auth flow
- Realtime listener

## Acceptance Criteria
- npm run build sukses
- Tidak ada perubahan nama field Firestore
- Tidak ada perubahan flow antrean
- Submit data tetap berjalan
- TV display tetap realtime
- Tampilan lebih konsisten dan profesional
```

---

# 176. TEMPLATE PULL REQUEST

```md
## Ringkasan
UI/UX modernization untuk meningkatkan tampilan aplikasi CKG Malimpung agar lebih profesional dan konsisten.

## Perubahan
- [ ] Design system components
- [ ] AppShell responsive
- [ ] Login polish
- [ ] Dashboard polish
- [ ] Loket polish
- [ ] Pos polish
- [ ] Admin polish
- [ ] Rapor polish
- [ ] TV Display polish

## Yang Tidak Diubah
- [ ] Firestore schema
- [ ] Business logic
- [ ] Queue flow
- [ ] Validation logic
- [ ] Auth flow
- [ ] Realtime listener

## Testing
- [ ] npm run build
- [ ] login
- [ ] ambil antrean
- [ ] panggil pasien
- [ ] simpan pos
- [ ] dashboard tampil
- [ ] export
- [ ] TV display realtime
```

---

# 177. REVIEW CHECKLIST UNTUK DEVELOPER

Sebelum merge, cek:

```txt
Apakah ada perubahan di nama collection?
Apakah ada perubahan di nama field?
Apakah ada perubahan di handler submit?
Apakah ada perubahan di query Firestore?
Apakah ada perubahan status antrean?
Apakah ada perubahan validasi medis?
Apakah ada perubahan role guard?
Apakah ada perubahan realtime listener?
```

Jika jawabannya “ya”, review ulang dengan hati-hati.

---

# 178. FINAL QUALITY BAR

Aplikasi layak disebut lebih profesional jika:

```txt
petugas langsung tahu harus klik apa
admin langsung paham kondisi layanan
pasien bisa membaca antrean dari jauh
dashboard tidak terasa penuh
form tidak terasa menakutkan
mobile tidak sesak
desktop tidak melebar liar
semua halaman terasa satu produk
```

```
```
