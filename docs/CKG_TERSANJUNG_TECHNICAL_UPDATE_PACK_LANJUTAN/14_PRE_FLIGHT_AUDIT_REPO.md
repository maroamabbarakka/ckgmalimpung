# 14 — Pre-Flight Audit Repo Sebelum Update

## Target
Pastikan developer memahami kondisi repo sebelum mengubah kode.

## Langkah teknis

### 1. Jalankan project lokal
```bash
npm install
npm run dev
```

Jika gagal:
- catat error lengkap;
- jangan langsung update dependency besar;
- cek versi Node;
- cek `.env`.

### 2. Jalankan build
```bash
npm run build
```

Acceptance:
- build sukses;
- tidak ada error import;
- tidak ada file route hilang.

### 3. Catat dependency utama
Buka `package.json`, catat:
- React;
- Vite;
- Firebase;
- Tailwind;
- library PDF/Excel/QR/OCR;
- library chart/grid.

Jangan update major version sebelum stabilisasi selesai.

### 4. Petakan file besar
Jalankan:
```bash
find src -type f \( -name "*.jsx" -o -name "*.js" \) -print0 | xargs -0 wc -l | sort -nr | head -30
```

Masukkan hasil ke `docs/audit/file-size-audit.md`.

### 5. Petakan akses Firestore
Jalankan:
```bash
grep -R "collection(" -n src > docs/audit/firestore-collection-usage.txt
grep -R "doc(" -n src > docs/audit/firestore-doc-usage.txt
grep -R "query(" -n src > docs/audit/firestore-query-usage.txt
```

Tujuan:
- tahu collection apa saja dipakai;
- tahu halaman mana menulis data;
- tahu query mana perlu index.

### 6. Petakan sessionStorage/localStorage
```bash
grep -R "sessionStorage\|localStorage" -n src > docs/audit/browser-storage-usage.txt
```

Tandai semua penggunaan untuk auth/role sebagai risiko tinggi.

### 7. Petakan role hardcode
```bash
grep -R "role\|admin\|petugas\|super" -n src > docs/audit/role-usage.txt
```

Acceptance:
- semua role diketahui;
- tidak ada role baru dibuat tanpa matrix.

### 8. Buat branch kerja
```bash
git checkout -b stabilization/ckg-core-hardening
```

Jangan kerja langsung di `main`.

## Output wajib
Buat folder:
```txt
docs/audit/
  file-size-audit.md
  firestore-collection-usage.txt
  firestore-doc-usage.txt
  firestore-query-usage.txt
  browser-storage-usage.txt
  role-usage.txt
```
