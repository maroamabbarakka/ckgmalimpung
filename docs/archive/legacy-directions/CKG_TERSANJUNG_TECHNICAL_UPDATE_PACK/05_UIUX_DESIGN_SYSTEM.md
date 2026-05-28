# 05 — UI/UX Design System TERSANJUNG

## Tujuan

Menghentikan tampilan yang maju-mundur. Semua halaman harus terasa satu aplikasi, bukan kumpulan halaman berbeda.

## Prinsip UI

- Mobile-first untuk petugas lapangan.
- Desktop optimized untuk admin/dashboard.
- Tombol besar untuk touch.
- Informasi medis penting harus mudah dibaca.
- Jangan memakai terlalu banyak warna.
- Warna status harus konsisten.
- Jangan menumpuk banyak aksi utama.

---

## Token Warna

Gunakan warna utama:

```js
export const COLORS = {
  primary: 'teal',
  secondary: 'sky',
  success: 'emerald',
  warning: 'amber',
  danger: 'red',
  neutral: 'slate',
};
```

### Arti Warna

- Teal: aksi utama / brand.
- Sky: informasi.
- Emerald: selesai / aman.
- Amber: perhatian / pending.
- Red: gagal / bahaya.
- Slate: netral.

Jangan pakai warna random untuk setiap pos. Pos boleh punya aksen kecil, tetapi status tetap standar.

---

## Typography

Buat aturan:

```txt
Page title: text-2xl md:text-3xl font-black
Section title: text-lg md:text-xl font-extrabold
Card title: text-base font-bold
Body: text-sm md:text-base
Caption: text-xs
Table: text-xs md:text-sm
```

Jangan gunakan font terlalu besar di mobile.

---

## Spacing

Standar:
- Container mobile: `px-3 py-4`
- Container desktop: `md:px-6 md:py-6`
- Card: `p-4 md:p-5`
- Gap antar card: `gap-4`
- Rounded: `rounded-2xl` atau `rounded-3xl`

---

## Komponen Wajib

Buat semua di:

```txt
src/components/ui/
```

### Button
Variant:
- primary
- secondary
- danger
- ghost

Ukuran:
- sm
- md
- lg

### Card
Variant:
- default
- elevated
- compact

### Badge
Tone:
- success
- warning
- danger
- info
- neutral

### Modal
Untuk:
- konfirmasi hapus,
- conflict data,
- pasien duplikat,
- force unlock.

### Table
Fitur:
- sticky header,
- empty state,
- loading state,
- mobile card fallback.

### FormField
Props:
- label
- required
- error
- hint
- children

Contoh:

```jsx
export function FormField({ label, required, error, hint, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
    </label>
  );
}
```

---

## Layout Standar Halaman

### Untuk Pos

```txt
Header pasien
Queue list
Form pemeriksaan
Bottom action bar
```

### Untuk Dashboard

```txt
Header filter
KPI cards
Chart/grid
Table detail
Export actions
```

### Untuk Admin

```txt
Header
Search/filter
Table
Drawer/modal form
Audit panel
```

---

## Button Hierarchy

Setiap halaman hanya boleh punya satu primary action utama.

Contoh Pos:
- Primary: Simpan & Lanjutkan
- Secondary: Simpan Draft
- Ghost: Kembali
- Danger: Batalkan

Jangan semua tombol berwarna kuat.

---

## Empty State

Buat komponen:

```jsx
export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h3 className="text-lg font-black text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

Contoh pesan:
- "Belum ada pasien di antrean Pos 2"
- "Tidak ada data sesuai filter"
- "Belum ada draft tersimpan"

---

## Loading State

Jangan gunakan teks "Loading..." saja.

Buat skeleton card:

```jsx
export function LoadingState({ label = 'Memuat data...' }) {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-3 h-8 w-full rounded bg-slate-100" />
      <p className="mt-3 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}
```

---

## Error State

Harus ramah dan actionable.

```jsx
export function ErrorState({ title = 'Data gagal dimuat', description, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
      <h3 className="font-black text-red-800">{title}</h3>
      <p className="mt-1 text-sm text-red-700">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
          Coba Lagi
        </button>
      )}
    </div>
  );
}
```

---

## Standar Form

Input:
```txt
rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm
focus:ring-2 focus:ring-teal-500
```

Textarea:
```txt
min-h-[120px]
```

Select:
```txt
appearance-none rounded-2xl
```

Radio/checkbox:
- Minimal area klik 44px.
- Label jelas.
- Jangan terlalu rapat.

---

## Mobile Bottom Action Bar

Untuk pos, tombol utama harus fixed di bawah mobile.

```jsx
<footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-3 md:static md:rounded-3xl md:border">
  <div className="flex gap-2">
    <Button variant="secondary" className="flex-1">Simpan Draft</Button>
    <Button className="flex-1">Simpan & Lanjut</Button>
  </div>
</footer>
```

---

## Desktop Layout

Gunakan max width:
- Pos: `max-w-7xl`
- Dashboard: `max-w-[1600px]`
- Admin: `max-w-7xl`

Jangan full width tanpa batas di monitor besar.

---

## Checklist UI Per Halaman

Untuk setiap halaman:
- [ ] Ada title jelas.
- [ ] Ada subtitle konteks.
- [ ] Ada loading state.
- [ ] Ada empty state.
- [ ] Ada error state.
- [ ] Tombol utama jelas.
- [ ] Mobile usable.
- [ ] Font tidak terlalu besar.
- [ ] Warna status konsisten.
- [ ] Tidak ada horizontal scroll di mobile.

## Definition of Done

- Ada folder `components/ui`.
- Minimal Button, Card, Badge, FormField, EmptyState, LoadingState.
- Pos dan Dashboard mulai memakai komponen shared.
- Tidak ada style tombol baru yang dibuat sembarangan.
