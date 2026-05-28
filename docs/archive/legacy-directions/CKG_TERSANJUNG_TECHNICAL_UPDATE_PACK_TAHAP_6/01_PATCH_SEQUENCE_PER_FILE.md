# PATCH SEQUENCE PER FILE

Tujuan dokumen ini adalah memberi urutan kerja agar developer/Codex tidak mengacak perubahan.

## URUTAN PATCH WAJIB

### 1. App Routing
File target:
- `src/App.jsx`
- `src/routes/*`

Tugas:
- pastikan semua route memakai guard
- pastikan unknown route diarahkan ke halaman 404
- pastikan tombol back mobile tidak membuka halaman kosong

Acceptance:
- reload di semua halaman tidak blank
- back button kembali ke halaman sebelumnya

---

### 2. Auth Provider
File target:
- `src/auth/*`
- `src/context/*`

Tugas:
- pindahkan status auth ke provider tunggal
- hapus logic auth tersebar
- jangan simpan role manual sebagai sumber kebenaran

Acceptance:
- logout membersihkan state
- refresh halaman tetap valid
- user tanpa role ditolak

---

### 3. Firestore Service
File target:
- `src/services/firestore/*`

Tugas:
- semua query dipindahkan dari component
- semua write punya error handling
- semua query besar wajib limit

Acceptance:
- component tidak import langsung `firebase/firestore`
- semua query reusable

---

### 4. Pos Workflow
File target:
- `src/Pos*.jsx`
- `src/features/pos*/*`

Tugas:
- tambah workflow state
- validasi sebelum lanjut pos
- lock pasien aktif

Acceptance:
- pasien tidak bisa final tanpa data wajib
- pasien tidak bisa diedit dua user bersamaan