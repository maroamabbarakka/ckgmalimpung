# 02 — Backup Data, Source Code, dan Recovery

## Prinsip
Tidak boleh melakukan patch role/security pada produksi tanpa dua lapis backup:

1. **Backup source code**.
2. **Backup data Firestore**.

Backup source code saja tidak cukup untuk memulihkan data jika rules atau logic save bermasalah.

---

## A. Backup Source Code
Repo sudah mempunyai `scripts/backup.cjs` yang menyalin folder `src`, `public`, `scripts`, dan `docs` serta sejumlah file konfigurasi ke folder `Backups_Tersanjung`.

### Catatan penting
Script existing menggunakan `xcopy`, sehingga secara praktis ditujukan untuk Windows.

Jalankan dari root repo:

```bash
node scripts/backup.cjs
```

Setelah selesai:

- pastikan folder backup benar-benar ada;
- buka beberapa file hasil backup secara acak;
- catat timestamp folder backup;
- jangan mengandalkan pesan “berhasil” tanpa verifikasi isi.

### Tambahkan Git Safety Point

```bash
git status
git rev-parse HEAD
git tag safety-pre-dtd-YYYYMMDD-HHMM
```

Tag boleh lokal dulu jika kebijakan repo tidak mengizinkan push tag.

---

## B. Backup Firestore — Wajib
Dokumentasi repo mengharuskan backup harian `patients`, `visits`, `users` dan snapshot mingguan. Untuk patch role DTD, backup minimum diperluas karena patch menyentuh otorisasi dan identitas user.

### Collection minimum yang harus dibackup

- `patients`
- `visits`
- `users`
- `staff`
- `activity_logs`
- `public_queue`
- collection konfigurasi lain yang benar-benar digunakan oleh environment produksi

### Metode yang Diperbolehkan
Gunakan salah satu metode berikut, dipilih sesuai environment:

#### Opsi 1 — Managed Firestore Export
Gunakan hanya bila project/environment sudah mendukungnya dan bucket backup telah disiapkan.

Kelebihan:
- snapshot konsisten;
- cocok untuk recovery skala besar.

Kekurangan:
- dapat memerlukan konfigurasi Google Cloud/billing sesuai project.

**Jangan mengaktifkan layanan berbayar hanya demi patch tanpa persetujuan pemilik sistem.**

#### Opsi 2 — Read-only JSON Backup Script
Jika managed export tidak tersedia, buat utility **read-only** terpisah yang:

- login menggunakan akun admin yang sah;
- hanya melakukan `getDocs`/read;
- tidak melakukan `setDoc`, `updateDoc`, `deleteDoc`;
- mengekspor collection ke JSON bertimestamp;
- menyimpan Firestore Timestamp dalam bentuk yang dapat direkonstruksi;
- menyimpan document ID;
- membuat manifest jumlah dokumen dan checksum.

Contoh struktur hasil:

```text
Backups_Tersanjung/
  firestore_pre_dtd_20260915_130000/
    patients.json
    visits.json
    users.json
    staff.json
    activity_logs.json
    public_queue.json
    manifest.json
    SHA256SUMS.txt
```

### Isi `manifest.json` minimum

```json
{
  "purpose": "pre-door-to-door-rbac-patch",
  "createdAt": "ISO-8601",
  "baselineCommit": "<git-sha>",
  "collections": {
    "patients": {"count": 0},
    "visits": {"count": 0},
    "users": {"count": 0},
    "staff": {"count": 0},
    "activity_logs": {"count": 0},
    "public_queue": {"count": 0}
  }
}
```

---

## C. Backup Rules dan Konfigurasi
Simpan salinan eksplisit:

- `firestore.rules`
- `firestore.indexes.json`
- `.firebaserc`
- `firebase.json`
- `.env.example`

Jangan pernah menyimpan secret production ke Git atau ZIP dokumentasi.

---

## D. Restore Drill — Wajib Sebelum Deploy
Backup dianggap valid hanya jika dapat dipanggil kembali.

Minimal lakukan:

1. pilih satu file backup, misalnya `users.json`;
2. verifikasi jumlah record sesuai baseline;
3. verifikasi beberapa document ID;
4. verifikasi tipe data penting/timestamp tidak hilang;
5. dokumentasikan cara import kembali;
6. **jangan uji restore langsung ke production**.

Untuk managed export, lakukan restore test di project/emulator terpisah bila memungkinkan.

---

## E. Recovery Source Code
Jika patch bermasalah sebelum data rusak:

```bash
git checkout safety-pre-dtd-YYYYMMDD-HHMM -- .
```

atau revert commit patch secara spesifik:

```bash
git revert <commit-patch>
```

Lebih disarankan `git revert` daripada reset pada branch yang sudah dibagikan.

---

## F. Recovery Data
Restore data **hanya jika benar-benar ada korupsi/perubahan data**, bukan sekadar UI error.

Urutan:

1. hentikan deploy/traffic perubahan;
2. rollback source + rules ke versi baseline;
3. bandingkan jumlah dokumen dengan manifest;
4. identifikasi collection dan rentang waktu yang terdampak;
5. restore **hanya data terdampak**, kecuali kerusakan luas memerlukan full snapshot;
6. verifikasi ulang count, sampling, laporan, dan export.

Jangan menimpa seluruh database bila hanya satu subset data yang bermasalah.

---

## G. Data yang Tidak Boleh Diubah oleh Backup Tool
Backup tool dilarang:

- menambahkan field;
- memperbaiki data;
- menormalkan data;
- mengubah timestamp;
- menghapus data duplikat;
- melakukan migration;
- menulis kembali ke database.

Backup adalah **copy**, bukan cleanup.

## Exit Criteria Gate 1
- [ ] backup source code tersedia.
- [ ] backup Firestore tersedia.
- [ ] manifest count tersedia.
- [ ] checksum tersedia.
- [ ] baseline commit tercatat.
- [ ] restore procedure diuji pada lingkungan aman/sampling.
