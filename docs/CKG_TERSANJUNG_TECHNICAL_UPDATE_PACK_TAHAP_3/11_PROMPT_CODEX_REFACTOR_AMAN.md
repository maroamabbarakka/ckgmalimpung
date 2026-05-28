# Prompt VS/Codex — Refactor Aman Tanpa Mengubah Alur

Gunakan saat memecah file besar.

```txt
Refactor file berikut tanpa mengubah perilaku aplikasi:
[ISI_NAMA_FILE]

Aturan:
1. Jangan ubah schema Firestore.
2. Jangan ubah nama field data.
3. Jangan ubah hasil perhitungan klinis.
4. Jangan ubah role/permission.
5. Pecah hanya bagian UI/helper yang aman.
6. Setelah refactor, semua import harus valid.
7. Pastikan build sukses.

Output yang diminta:
- daftar komponen baru,
- daftar helper baru,
- file yang diubah,
- risiko perubahan,
- langkah test manual.
```
