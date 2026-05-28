# ENVIRONMENT SEPARATION

## WAJIB PISAH

Minimal ada:
- development
- staging
- production

## JANGAN
- testing di database production
- pakai akun admin production untuk development
- deploy langsung ke production tanpa staging

## ENV FILE

```txt
.env.development
.env.staging
.env.production
```

## FIREBASE PROJECT
Ideal:
- ckg-dev
- ckg-staging
- ckg-production

## ACCEPTANCE CRITERIA
- build dev tidak bisa menulis ke production
- staging punya data dummy
- production hanya data real