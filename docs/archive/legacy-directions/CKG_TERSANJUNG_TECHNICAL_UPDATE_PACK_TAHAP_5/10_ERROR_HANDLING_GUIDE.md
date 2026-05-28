# ERROR HANDLING GUIDE

## FORBIDDEN

Jangan tampil:
- raw firebase error
- raw stack trace

## REQUIRED

Convert:
- permission-denied
→ "Anda tidak memiliki akses"

- unavailable
→ "Koneksi bermasalah"

## LOGGING

Semua error:
- timestamp
- page
- action
- user