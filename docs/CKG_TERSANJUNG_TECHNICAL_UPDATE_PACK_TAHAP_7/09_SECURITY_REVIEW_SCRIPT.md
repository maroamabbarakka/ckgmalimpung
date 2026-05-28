# SECURITY REVIEW SCRIPT

Jalankan review ini sebelum release besar.

## AUTH
- apakah semua route protected?
- apakah role berasal dari sumber terpercaya?
- apakah session tidak bisa dimanipulasi?

## FIRESTORE
- apakah rules menolak unauthenticated?
- apakah role viewer tidak bisa write?
- apakah staff hanya admin yang bisa ubah?

## DATA
- apakah TV display bebas data sensitif?
- apakah export dibatasi role?
- apakah audit log aktif?

## FRONTEND
Cari:
```bash
grep -R "sessionStorage" src
grep -R "console.log" src
grep -R "firebaseConfig" src
grep -R "allow read, write" .
```

Semua temuan wajib ditinjau.