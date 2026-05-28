# PATIENT DATA SCHEMA

```ts
Patient {
  id: string
  nik: string
  nama: string
  tanggalLahir: string
  gender: string
  alamat: string
  kategoriUsia: string
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: string
}
```

## REQUIRED

- no duplicate field
- snake_case OR camelCase only
- consistent naming
- timestamp mandatory