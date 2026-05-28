# CODEX PROMPT — SMART UI/UX IMPLEMENTATION

Gunakan prompt ini saat meminta VS/Codex mengerjakan UI/UX.

```text
Anda bertindak sebagai senior product designer sekaligus senior frontend engineer React/Firebase.

Tujuan:
Meningkatkan UI/UX aplikasi CKG TERSANJUNG agar profesional, cerdas, cepat untuk input, ramah operator, dan aman untuk data kesehatan.

Aturan wajib:
- Jangan ubah alur data/firestore tanpa instruksi eksplisit.
- Jangan hapus fitur existing.
- Jangan membuat style berbeda-beda per halaman.
- Buat komponen reusable.
- Mobile-first untuk operator.
- Desktop-friendly untuk admin.
- Semua form harus punya label, helper text, inline error, dan loading state.
- Semua tombol utama harus konsisten.
- Semua halaman harus punya loading, empty, error state.
- Tidak boleh menampilkan data medis sensitif di TV display.
- Tidak boleh membuat dashboard berat di mobile.
- Jangan menambah library besar kecuali perlu.

Target patch:
[ISI TARGET: contoh Smart Form Pos 1 / Dashboard Operator / TV Display / Design System]

Output wajib:
1. daftar file yang diubah
2. komponen yang dibuat
3. perubahan UX
4. testing mobile
5. testing desktop
6. risiko
7. rollback plan
```

## ACCEPTANCE
Codex tidak boleh dianggap selesai jika hanya mengubah warna. Harus meningkatkan usability nyata.