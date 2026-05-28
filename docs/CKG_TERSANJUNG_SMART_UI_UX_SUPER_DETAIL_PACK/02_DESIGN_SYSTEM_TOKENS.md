# DESIGN SYSTEM TOKENS

## TUJUAN
Menghentikan tampilan maju-mundur dengan membuat token global yang dipakai semua halaman.

## FILE TARGET
Buat atau rapikan:
- `src/styles/tokens.css`
- `src/styles/globals.css`
- `tailwind.config.js`

## COLOR TOKEN

```css
:root {
  --color-primary: #0F766E;
  --color-primary-hover: #115E59;
  --color-primary-soft: #CCFBF1;

  --color-secondary: #2563EB;
  --color-success: #16A34A;
  --color-warning: #F59E0B;
  --color-danger: #DC2626;
  --color-info: #0284C7;

  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
}
```

## STATUS COLOR

| Status | Warna | Penggunaan |
|---|---|---|
| Waiting | slate | menunggu |
| Called | blue | dipanggil |
| In Progress | amber | sedang diperiksa |
| Complete | green | selesai |
| Error | red | gagal/bermasalah |
| Offline | orange | belum sinkron |

## TYPOGRAPHY
Gunakan skala tetap:
- Display: 32px / 40px / 700
- Page Title: 24px / 32px / 700
- Section Title: 18px / 28px / 600
- Body: 14-16px / 24px / 400
- Caption: 12px / 16px / 500

## SPACING
Gunakan kelipatan 4:
- xs = 4px
- sm = 8px
- md = 12px
- lg = 16px
- xl = 24px
- 2xl = 32px

## RADIUS
- input = 10px
- card = 16px
- modal = 20px
- pill = 999px

## ACCEPTANCE CRITERIA
- Tidak ada hex color langsung di component kecuali token.
- Semua tombol pakai komponen Button.
- Semua input pakai komponen Field.
- Semua card pakai komponen Card.