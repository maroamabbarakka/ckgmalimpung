# CKG Malimpung - Final Smart UI/UX Implementation Standard

## Aplikasi Cek Kesehatan Gratis

Standar ini menjadi acuan tetap untuk seluruh pengembangan UI/UX CKG Malimpung. Seluruh halaman wajib mengikuti prinsip:

```txt
cepat
ringan
jelas
mobile-first
workflow-oriented
tidak melelahkan
```

UI bukan sekadar bagus secara visual. UI harus mempercepat kerja operator, mengurangi cognitive load, memperjelas workflow, menjaga konsistensi sistem, dan nyaman digunakan berjam-jam.

## 1. Batas Perubahan

Jangan mengubah:

- Firestore structure
- FormSchemas
- smart fill engine
- workflow Pos
- export system
- business logic
- routing utama
- auth flow

Perubahan hanya fokus pada:

```txt
UI
UX
layout
hierarchy
spacing
responsive behavior
visual consistency
interaction
```

## 2. Global Visual Direction

Seluruh aplikasi harus terasa seperti:

```txt
Aplikasi Cek Kesehatan Gratis
Healthcare Workflow App
```

Bukan:

```txt
admin dashboard
bootstrap system
website pemerintahan
landing page
```

Gunakan soft healthcare UI, floating feel, clean hierarchy, breathable spacing, subtle interaction, rounded modern card, dan lightweight workflow interface.

Hindari border hitam keras, shadow gelap, gradient berlebihan, warna neon, card terlalu padat, tabel berat, typography terlalu besar, dan animasi berlebihan.

## 3. Design Tokens

Font global:

```css
font-family: 'Inter', 'Poppins', sans-serif;
```

Heading memakai Poppins 700-800. Workflow text memakai Inter 500-700.

Color system:

```txt
Primary: #0080FF
Secondary Soft: #BAF7F7
Accent Soft: #DFF0B8
Main Text: #304050
Secondary Text: #7A8A9A
```

Background global:

```css
background: linear-gradient(180deg, #F4F8FB, #EEF5FA);
```

Shadow global:

```css
box-shadow: 0 10px 30px rgba(48,64,80,.05);
```

Radius:

```txt
Card besar: 28px
Card kecil: 24px
Button: 16px
```

Spacing wajib konsisten memakai:

```txt
4
8
12
16
24
32
```

## 4. Card System

```css
.standard-card {
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(220,232,242,.9);
  border-radius: 28px;
  box-shadow: 0 10px 30px rgba(48,64,80,.05);
}
```

## 5. Header System

Desktop header:

```css
height: 74px;
background: rgba(255,255,255,.82);
backdrop-filter: blur(18px);
border-bottom: 1px solid rgba(220,232,242,.85);
```

Navigation pill:

```css
.nav-item {
  height: 42px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
}

.nav-item.active {
  background: rgba(0,128,255,.12);
  color: #0080FF;
  box-shadow: 0 6px 16px rgba(0,128,255,.12);
}
```

Mobile header:

```txt
[Logo]
TERSANJUNG
Puskesmas Malimpung

        Online
```

```css
height: 68px;
background: rgba(255,255,255,.84);
backdrop-filter: blur(18px);
border-bottom: 1px solid rgba(220,232,242,.8);
```

## 6. Bottom Navigation

```css
.mobile-nav {
  position: fixed;
  left: 14px;
  right: 14px;
  bottom: 14px;
  height: 74px;
  border-radius: 28px;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220,232,242,.85);
  box-shadow: 0 12px 34px rgba(48,64,80,.12);
}

.nav-active {
  width: 58px;
  height: 58px;
  border-radius: 20px;
  background: linear-gradient(180deg, #2EA7FF, #0080FF);
  color: white;
}
```

## 7. Form System

Input:

```css
height: 52px;
border: 1px solid #DDE7F0;
```

Focus:

```css
border-color: #0080FF;
box-shadow: 0 0 0 4px rgba(0,128,255,.12);
```

Placeholder:

```css
color: #A5B2C2;
```

Label:

```css
font-size: 10px;
letter-spacing: .08em;
font-weight: 700;
color: #7A8A9A;
text-transform: uppercase;
```

Primary CTA:

```css
height: 56px;
border-radius: 18px;
background: linear-gradient(180deg, #18B6A4, #0E9F90);
font-weight: 800;
```

Hover:

```css
transform: translateY(-1px);
```

## 8. Section And Hero

Eyebrow:

```css
font-size: 11px;
font-weight: 800;
letter-spacing: .18em;
color: #7A8A9A;
text-transform: uppercase;
```

Main title:

```css
font-size: 30px;
font-weight: 800;
color: #304050;
```

Hero harus compact, tidak terlalu tinggi, dan langsung menjelaskan workflow.

Desktop:

```css
padding: 24px 28px;
```

Mobile:

```css
padding: 20px 18px;
```

## 9. Workflow Pos System

Pos card harus terasa progression, bukan menu biasa.

```css
.pos-card {
  position: relative;
  min-height: 148px;
  border-radius: 24px;
  padding: 18px;
  overflow: hidden;
}

.pos-number {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 52px;
  font-weight: 800;
  opacity: .10;
}
```

Pos icon:

```css
width: 58px;
height: 58px;
border-radius: 18px;
```

Workflow colors:

| Pos | Accent |
| --- | --- |
| Pos 1 | Blue |
| Pos 2 | Indigo |
| Pos 3 | Rose |
| Pos 4 | Purple |
| Pos 5 | Violet |
| Pos 6 | Cyan |
| Pos 7 | Green |
| Door to Door | Mint |

Gunakan versi soft.

## 10. Smart Form UX

Form wajib terasa step-by-step, bukan form panjang.

Wajib:

- pecah form menjadi group
- gunakan spacing jelas
- gunakan helper kecil
- gunakan smart inline feedback
- gunakan collapsible section bila panjang

Validation chip:

```css
.validation-chip {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
}
```

Feedback system:

- inline feedback
- helper ringan
- smart status
- subtle toast

Hindari popup besar, modal agresif, dan alert bootstrap klasik.

## 11. Queue / Loket System

Loket harus terasa:

```txt
queue kiosk modern
```

Queue card:

```css
.queue-card {
  min-height: 132px;
  border-radius: 24px;
  padding: 18px;
}
```

Queue number:

```css
font-size: 52px;
font-weight: 800;
```

Queue CTA:

```css
height: 42px;
background: rgba(0,128,255,.08);
color: #0080FF;
font-weight: 700;
```

## 12. Responsive System

Desktop >= 1280px:

- horizontal workflow
- compact spacing
- operational layout

Tablet 768-1279px:

- compact grid
- reduced spacing
- maintain workflow clarity

Mobile < 768px:

- floating nav
- compact header
- 2-column workflow grid
- sticky action
- safe touch spacing

Mobile priority:

- nyaman satu tangan
- tombol mudah disentuh
- tidak terlalu padat
- minim scroll tidak perlu
- tetap jelas di HP low-end

## 13. Micro Interaction

Gunakan:

```css
transition: all .18s ease;
```

Untuk button, card, hover, active, navigation, selector, dan toast.

## 14. Cognitive Load Reduction

Semua halaman harus membantu scanning cepat, fokus operator, pengurangan rasa penuh, dan pengurangan kelelahan visual.

Jangan gunakan:

- tabel besar
- chart besar
- glassmorphism berat
- shadow keras
- warna neon
- typography terlalu besar
- card terlalu padat
- banyak popup
- gradient berlebihan
- terlalu banyak uppercase

## 15. Target Final UX

Seluruh aplikasi harus terasa:

```txt
modern
professional
ringan
cepat
dibimbing
mobile-first
operational
medical-friendly
```

Dan tetap konsisten sebagai:

```txt
Aplikasi Cek Kesehatan Gratis
```
