# FINAL HARDENING CHECKLIST

## AUTH
- [ ] Hapus seluruh sessionStorage auth manual
- [ ] Gunakan Firebase Auth onAuthStateChanged
- [ ] Role hanya dari custom claims
- [ ] Block akses tanpa role valid

## FIRESTORE RULES
- [ ] Disable public read
- [ ] Disable public write
- [ ] Restrict patient read by role
- [ ] Restrict export by admin only

## UI
- [ ] Konsisten button
- [ ] Konsisten typography
- [ ] Loading skeleton
- [ ] Error boundary

## WORKFLOW
- [ ] Pos tidak bisa dilompati
- [ ] Finalisasi wajib valid
- [ ] Draft autosave aktif

## TESTING
- [ ] Login
- [ ] Offline sync
- [ ] Finalisasi rapor
- [ ] Export PDF