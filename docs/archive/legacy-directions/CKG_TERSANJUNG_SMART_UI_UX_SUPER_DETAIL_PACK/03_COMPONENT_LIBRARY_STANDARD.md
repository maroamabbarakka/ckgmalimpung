# COMPONENT LIBRARY STANDARD

## FOLDER TARGET

```txt
src/components/ui/
  Button.jsx
  Card.jsx
  Field.jsx
  SelectField.jsx
  TextAreaField.jsx
  StatusBadge.jsx
  PageHeader.jsx
  SectionHeader.jsx
  EmptyState.jsx
  LoadingSkeleton.jsx
  ConfirmModal.jsx
  BottomActionBar.jsx
  PatientSummaryCard.jsx
  Stepper.jsx
```

## BUTTON
Props:
```ts
Button {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidthMobile?: boolean
}
```

Aturan:
- Primary hanya untuk aksi utama.
- Danger hanya untuk hapus/batal finalisasi.
- Ghost untuk aksi minor.
- Loading button tidak boleh bisa diklik ulang.

## FIELD
Props:
```ts
Field {
  label: string
  name: string
  value: string
  error?: string
  helperText?: string
  required?: boolean
  inputMode?: 'text' | 'numeric' | 'decimal'
}
```

Aturan:
- error tampil inline
- helper text di bawah input
- label selalu tampil, jangan hanya placeholder

## PATIENT SUMMARY CARD
Harus tampil di semua halaman pos.

Isi:
- nama
- umur
- jenis kelamin
- nomor antrean
- kategori usia
- status sync
- pos aktif

## BOTTOM ACTION BAR
Untuk mobile:
- sticky bottom
- safe area support
- tombol utama selalu terlihat

## ACCEPTANCE
- Tidak ada button manual berulang di halaman.
- Tidak ada input tanpa label.
- Tidak ada modal custom berbeda-beda.