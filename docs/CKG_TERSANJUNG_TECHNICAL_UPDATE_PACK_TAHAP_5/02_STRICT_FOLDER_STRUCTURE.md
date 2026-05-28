# STRICT FOLDER STRUCTURE

```txt
src/
  app/
  components/
  features/
  hooks/
  layouts/
  lib/
  pages/
  routes/
  services/
  stores/
  styles/
  types/
  utils/
```

## FORBIDDEN

- component di pages
- firestore query di UI component
- inline utility besar
- inline business logic

## REQUIRED

Semua firestore access:
services/firestore/