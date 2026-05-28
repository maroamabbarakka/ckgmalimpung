````md id="ckg-superapp-uiux-guide"
# ARAHAN UI/UX DEVELOPER
# CKG MALIMPUNG — ENTERPRISE HEALTH SUPER APP UI/UX REFACTOR

## Repository
https://github.com/maroamabbarakka/ckgmalimpung

---

# TUJUAN DOKUMEN

Dokumen ini adalah arahan UI/UX khusus untuk developer VS/Codex agar aplikasi:

✅ terlihat profesional  
✅ terasa seperti enterprise healthcare platform  
✅ memiliki kualitas visual modern  
✅ memiliki konsistensi design system  
✅ mobile friendly  
✅ nyaman dipakai petugas lapangan  
✅ terasa “super app”  
✅ TANPA mengubah alur data dan logika bisnis existing  

---

# ATURAN PALING PENTING

## JANGAN MERUSAK:

- flow Firestore
- struktur data
- query existing
- business logic CKG
- logic antrean
- validasi medis
- alur pemeriksaan
- authentication logic
- realtime listener

---

# FOKUS REFACTOR

HANYA:

✅ UI  
✅ UX  
✅ layout  
✅ hierarchy  
✅ typography  
✅ spacing  
✅ navigation  
✅ responsiveness  
✅ design system  
✅ animation ringan  
✅ interaction polish  

---

# REFERENSI VISUAL

Target visual aplikasi:

- modern healthcare dashboard
- enterprise operations dashboard
- super app healthcare
- clinical operations system
- realtime medical platform

Referensi:
- :contentReference[oaicite:0]{index=0}
- :contentReference[oaicite:1]{index=1}
- :contentReference[oaicite:2]{index=2}

---

# 1. DESIGN SYSTEM WAJIB

## MASALAH

Saat ini UI kemungkinan:
- tidak konsisten
- ukuran random
- spacing random
- typography random
- warna random

Akibat:
- aplikasi terasa “admin panel biasa”
- bukan “enterprise super app”

---

# TARGET

Buat centralized design system.

---

# STRUKTUR

```txt
src/
  design-system/
    tokens/
      colors.js
      spacing.js
      radius.js
      shadows.js
      typography.js

    components/
      AppCard.jsx
      AppButton.jsx
      AppInput.jsx
      AppBadge.jsx
      AppHeader.jsx
      AppSection.jsx
      AppStatCard.jsx
      AppTable.jsx
````

---

# 2. WARNA (COLOR SYSTEM)

## TARGET

Gunakan healthcare enterprise palette.

---

# PRIMARY COLOR

Gunakan:

```txt
Teal / Cyan / Blue Healthcare
```

Contoh:

```css
Primary:
#0F766E

Primary Hover:
#115E59

Primary Light:
#CCFBF1
```

---

# STATUS COLOR

## SUCCESS

```css
#16A34A
```

## WARNING

```css
#F59E0B
```

## DANGER

```css
#DC2626
```

## INFO

```css
#0284C7
```

---

# RULE

## DILARANG

❌ terlalu banyak warna
❌ gradient berlebihan
❌ neon color
❌ warna random per halaman

---

# 3. TYPOGRAPHY SYSTEM

## MASALAH

Hierarchy kemungkinan tidak jelas.

---

# TARGET

Gunakan typography scale tetap.

---

# FONT

Gunakan:

```txt
Inter
atau
Plus Jakarta Sans
```

---

# SCALE

## Display

```css
font-size: 36px;
font-weight: 700;
```

## Heading 1

```css
24px
```

## Heading 2

```css
20px
```

## Section

```css
18px
```

## Body

```css
14px - 16px
```

## Caption

```css
12px
```

---

# RULE

## DILARANG

❌ ukuran teks random
❌ semua teks bold
❌ heading terlalu kecil
❌ body text terlalu rapat

---

# 4. SPACING SYSTEM

## MASALAH

UI terasa padat dan sesak.

---

# TARGET

Gunakan spacing scale tetap.

---

# SCALE

```txt
4
8
12
16
24
32
48
64
```

---

# CONTOH

## Padding card

```css
padding: 24px;
```

## Gap antar card

```css
gap: 16px;
```

## Margin section

```css
margin-bottom: 32px;
```

---

# RULE

## DILARANG

❌ spacing random
❌ card saling menempel
❌ tabel terlalu padat

---

# 5. CARD SYSTEM

## MASALAH

Dashboard kemungkinan terasa seperti tabel admin biasa.

---

# TARGET

Gunakan enterprise healthcare cards.

---

# STYLE

```css
background: white;
border-radius: 20px;
padding: 24px;
border: 1px solid #E5E7EB;
box-shadow:
0 1px 2px rgba(0,0,0,0.04),
0 4px 12px rgba(0,0,0,0.04);
```

---

# RULE

## DILARANG

❌ shadow keras
❌ card terlalu flat
❌ radius kecil
❌ border gelap

---

# 6. DASHBOARD REFACTOR

# TARGET

Dashboard harus terasa seperti:

```txt
Healthcare Operations Center
```

bukan:

```txt
Admin CRUD biasa
```

---

# STRUKTUR DASHBOARD

## LAYER 1 — HERO SUMMARY

Paling atas.

Isi:

* total pasien hari ini
* antrean aktif
* risiko tinggi
* pasien selesai
* status realtime

---

## STYLE

* card besar
* angka dominan
* icon modern
* warna lembut

---

# LAYER 2 — OPERATIONAL INSIGHT

Isi:

* chart
* trend
* distribusi
* realtime queue
* warning

---

# LAYER 3 — DETAIL DATA

Isi:

* tabel
* riwayat
* detail list

---

# RULE

## DILARANG

❌ semua data langsung ditampilkan sekaligus
❌ tabel terlalu dominan
❌ semua card ukuran sama

---

# 7. NAVIGATION REFACTOR

# TARGET

Navigation harus terasa:

✅ modern
✅ mudah dipahami
✅ cepat diakses
✅ mobile friendly

---

# DESKTOP

Gunakan:

```txt
Left Sidebar Navigation
```

---

# SIDEBAR

## Style

* floating
* rounded
* compact
* collapsible

---

# MOBILE

Gunakan:

```txt
Bottom Navigation
```

Isi:

* Dashboard
* Antrean
* Pasien
* Pemeriksaan
* Profile/Menu

---

# RULE

## DILARANG

❌ menu terlalu banyak di layar awal
❌ nested navigation berlebihan
❌ icon tanpa label

---

# 8. FORM UX REFACTOR

## MASALAH

Form medis mudah terasa berat.

---

# TARGET

Form harus:

* cepat dibaca
* minim stress visual
* mobile friendly

---

# RULE

## INPUT HEIGHT

```css
48px minimum
```

---

## LABEL

Selalu di atas input.

---

## ERROR

Gunakan:

```txt
inline validation
```

bukan popup.

---

## SECTION FORM

Pisahkan:

* Identitas
* Alamat
* Pemeriksaan
* Hasil
* Tindak lanjut

---

# DILARANG

❌ form terlalu panjang tanpa section
❌ terlalu banyak field dalam 1 row mobile
❌ popup validation berlebihan

---

# 9. TABLE REFACTOR

## MASALAH

Table medis mudah overload.

---

# TARGET

Gunakan modern data table.

---

# FITUR

✅ sticky header
✅ zebra row halus
✅ hover state
✅ responsive
✅ search jelas
✅ filter jelas

---

# MOBILE

Table besar:

* ubah menjadi stacked card list

---

# RULE

## DILARANG

❌ font kecil
❌ tabel rapat
❌ horizontal scroll berlebihan

---

# 10. MOBILE UX PRIORITY

# PRIORITAS TERTINGGI

Karena aplikasi dipakai operasional lapangan.

---

# TARGET

Semua halaman wajib:

✅ nyaman di smartphone
✅ nyaman di tablet
✅ mudah disentuh
✅ mudah dibaca outdoor

---

# BUTTON

Minimum:

```css
height: 48px;
```

---

# STICKY ACTION

Gunakan:

```txt
Floating Bottom Action
```

contoh:

* Simpan
* Panggil
* Lanjut Pos

---

# STICKY HEADER

Saat scroll:

* nama pasien tetap terlihat
* nomor antrean tetap terlihat

---

# 11. TV DISPLAY REFACTOR

# TARGET

TV display harus terasa seperti:

```txt
Broadcast Queue System
```

---

# STYLE

Gunakan:

* cinematic spacing
* dark background
* accent color lembut
* typography besar
* motion ringan

---

# TAMBAHAN

## Animasi

Gunakan:

* fade
* slide ringan
* smooth transition

---

# DILARANG

❌ animasi berlebihan
❌ blinking
❌ warna terlalu ramai

---

# 12. LOADING EXPERIENCE

## MASALAH

Loading biasa membuat aplikasi terasa lambat.

---

# TARGET

Gunakan:

```txt
Skeleton Loading
```

---

# DILARANG

❌ spinner fullscreen terus menerus

---

# 13. MICROINTERACTION

# TARGET

Tambahkan:

* hover state
* pressed state
* smooth transition
* subtle animation

---

# ANIMATION

Gunakan:

```css
transition:
all 0.2s ease;
```

---

# DILARANG

❌ animasi berat
❌ bounce berlebihan
❌ motion mengganggu operator

---

# 14. ICON SYSTEM

# TARGET

Gunakan 1 icon library saja.

---

# REKOMENDASI

```txt
lucide-react
```

---

# RULE

## DILARANG

❌ campur banyak style icon
❌ icon kartun
❌ icon glossy

---

# 15. DARK MODE

## OPTIONAL

Jika dibuat:

* gunakan dark healthcare theme
* jangan pure black

---

# BACKGROUND

Gunakan:

```css
#0F172A
```

---

# 16. RESPONSIVE GRID SYSTEM

# TARGET

Gunakan responsive dashboard grid.

---

# DESKTOP

```txt
4-column dashboard
```

---

# TABLET

```txt
2-column
```

---

# MOBILE

```txt
1-column
```

---

# 17. PERFORMANCE UI

# TARGET

UI harus tetap ringan.

---

# WAJIB

✅ lazy load
✅ memoization
✅ virtualized table bila perlu
✅ optimize rerender

---

# DILARANG

❌ rerender realtime berlebihan
❌ animasi berat
❌ chart terlalu banyak

---

# 18. ACCESSIBILITY

Healthcare UI wajib accessible. ([Aufait UX][1])

---

# TARGET

✅ kontras cukup
✅ tombol besar
✅ mudah dibaca
✅ keyboard friendly
✅ fokus state jelas

---

# 19. SUPER APP FEEL

# TARGET AKHIR

Aplikasi harus terasa:

✅ modern
✅ realtime
✅ premium
✅ operational
✅ enterprise
✅ healthcare-class
✅ bukan admin template biasa

---

# KATA KUNCI VISUAL

```txt
Clean
Professional
Operational
Healthcare
Realtime
Enterprise
Modern
Minimal
High clarity
Low cognitive load
```

---

# 20. YANG TIDAK BOLEH DIUBAH

## DILARANG MENYENTUH

* struktur Firestore
* business logic
* validation logic
* queue flow
* status flow
* authentication flow
* realtime listener
* data schema
* API structure

---

# FOKUS HANYA

✅ visual
✅ usability
✅ consistency
✅ hierarchy
✅ layout
✅ spacing
✅ responsiveness
✅ navigation
✅ interaction polish

---

# CHECKLIST FINAL

## HASIL AKHIR WAJIB:

✅ build sukses
✅ logic tidak berubah
✅ data flow aman
✅ realtime tetap stabil
✅ mobile UX meningkat
✅ dashboard lebih premium
✅ UI konsisten
✅ super app feel meningkat
✅ operasional lebih nyaman

---

# TARGET VISUAL AKHIR

Gabungan feel:

* healthcare operations center
* enterprise SaaS dashboard
* modern realtime queue system
* professional public service super app

BUKAN:

* admin template biasa
* CRUD dashboard
* panel internal lama

```
::contentReference[oaicite:4]{index=4}
```

[1]: https://www.aufaitux.com/blog/healthcare-dashboard-ui-ux-design-best-practices/?utm_source=chatgpt.com "Healthcare Dashboard Design | UI UX Best Practices US Guide"
