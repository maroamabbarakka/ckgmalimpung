Berikut dokumen arahan teknis yang bisa langsung diberikan ke developer VS/Codex.

````md
# AUDIT & ARAHAN TEKNIS DEVELOPER
# Aplikasi CKG Malimpung (TERSANJUNG)

## Repository
https://github.com/maroamabbarakka/ckgmalimpung

---

# TUJUAN AUDIT

Dokumen ini dibuat untuk:

1. Mengamankan aplikasi layanan kesehatan
2. Merapikan struktur kode
3. Menstabilkan alur antrean
4. Mempermudah maintenance jangka panjang
5. Meningkatkan performa dan reliability
6. Menyiapkan aplikasi untuk operasional skala nyata

---

# PRIORITAS EKSEKUSI

Urutan pengerjaan WAJIB:

1. Authentication & Authorization
2. Firestore Security Rules
3. Refactor struktur kode
4. Standardisasi status antrean
5. Audit trail
6. Optimasi Firestore
7. PWA & offline sync
8. Testing
9. UI/UX operasional

---

# 1. AUTHENTICATION REFACTOR

## MASALAH

Saat ini login masih:

- membaca username dan PIN langsung dari Firestore
- PIN kemungkinan plaintext
- session memakai sessionStorage
- role hanya dicek frontend

Ini berbahaya untuk aplikasi kesehatan.

---

## TARGET

Migrasi ke:

- Firebase Authentication
- Firestore users collection
- centralized auth context
- secure role-based access

---

## STRUKTUR BARU

Buat:

```txt
src/
  auth/
    AuthContext.jsx
    RequireAuth.jsx
    RequireRole.jsx
  services/
    authService.js
    userService.js
````

---

## STRUKTUR DATA USERS

Collection:

```txt
users/{uid}
```

Field:

```js
{
  uid: string,
  username: string,
  nama: string,
  roles: array,
  isActive: boolean,
  posAccess: array,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## TUGAS CODEX

```txt
Refactor sistem login menjadi Firebase Authentication.

Target:
1. Hilangkan login berbasis query Firestore username+pin
2. Gunakan Firebase Auth
3. Tambahkan AuthContext global
4. Semua route memakai AuthContext
5. Logout harus signOut(auth)
6. Jangan gunakan sessionStorage untuk role utama
7. Tambahkan loading state auth
8. Tambahkan error boundary login
```

---

# 2. FIRESTORE SECURITY RULES

## MASALAH

Role access saat ini hanya dicek di frontend.

Ini TIDAK cukup aman.

---

## TARGET

Tambahkan:

```txt
firestore.rules
firestore.indexes.json
```

---

## FIRESTORE RULES

Buat rules berikut:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function userDoc() {
      return get(
        /databases/$(database)/documents/users/$(request.auth.uid)
      );
    }

    function activeUser() {
      return signedIn() &&
             userDoc().data.isActive == true;
    }

    function hasRole(role) {
      return activeUser() &&
             role in userDoc().data.roles;
    }

    function hasAnyRole(roles) {
      return activeUser() &&
             userDoc().data.roles.hasAny(roles);
    }

    match /users/{uid} {
      allow read:
        if request.auth.uid == uid || hasRole('admin');

      allow write:
        if hasRole('admin');
    }

    match /patients/{docId} {
      allow read:
        if hasAnyRole([
          'admin',
          'dokter',
          'perawat',
          'perawat_bidan',
          'petugas'
        ]);

      allow create, update:
        if hasAnyRole([
          'admin',
          'dokter',
          'perawat',
          'perawat_bidan',
          'petugas'
        ]);

      allow delete:
        if hasRole('admin');
    }

    match /visits/{docId} {
      allow read:
        if activeUser();

      allow create:
        if hasAnyRole([
          'admin',
          'petugas'
        ]);

      allow update:
        if hasAnyRole([
          'admin',
          'petugas',
          'ttlm',
          'dokter',
          'perawat',
          'perawat_bidan',
          'apoteker'
        ]);

      allow delete:
        if hasRole('admin');
    }

    match /activity_logs/{docId} {
      allow create:
        if activeUser();

      allow read:
        if hasRole('admin');

      allow update, delete:
        if false;
    }

    match /{document=**} {
      allow read, write:
        if false;
    }
  }
}
```

---

# 3. STANDARDISASI STATUS ANTREAN

## MASALAH

Masih ada variasi:

* Menunggu Pos 1
* Antri Pos 1
* Antre Pos 1

Ini berbahaya untuk filtering dan reporting.

---

## TARGET

Semua status wajib memakai:

```js
STATUS_MAPPING
```

---

## STRUKTUR

Buat:

```txt
src/utils/queueStatus.js
```

Isi:

```js
export const QUEUE_STATUS_ALIASES = {
  'Menunggu Pos 1': 'POS1',
  'Antri Pos 1': 'POS1',
  'Antre Pos 1': 'POS1',
};

export function normalizeQueueStatus(status) {
  return QUEUE_STATUS_ALIASES[status] || status;
}
```

---

## MIGRATION SCRIPT

Buat:

```txt
scripts/migrateQueueStatus.js
```

Tugas:

1. scan seluruh collection visits
2. normalize status lama
3. update ke status baru
4. log hasil migrasi

---

# 4. REFACTOR FILE BESAR

## MASALAH

File terlalu besar:

* AdminDashboard.jsx
* Pos1.jsx

Sulit maintenance.

---

## TARGET STRUKTUR

```txt
src/
  services/
    patientService.js
    visitService.js
    queueService.js
    auditService.js
    reportService.js

  hooks/
    useQueue.js
    useKtpScanner.js
    usePatientForm.js

  components/
    patient/
    queue/
    dashboard/
```

---

# 5. POS1 REFACTOR

## TARGET

Pisahkan:

### OCR

```txt
hooks/useKtpScanner.js
```

### Query pasien

```txt
services/patientService.js
```

### Queue logic

```txt
services/queueService.js
```

### Visit update

```txt
services/visitService.js
```

### Form UI

```txt
components/patient/PatientIdentityForm.jsx
```

---

## TUGAS CODEX

```txt
Refactor Pos1.jsx tanpa mengubah flow bisnis.

Pisahkan:
1. OCR
2. Kamera
3. Validasi umur
4. Query Firestore
5. Queue handling
6. Form pasien

Pastikan build tetap sukses.
```

---

# 6. VALIDASI PASIEN TANPA NIK

## MASALAH

Pasien tanpa NIK memakai:

```txt
NONIK-{timestamp}
```

Ini buruk untuk identitas jangka panjang.

---

## TARGET

Tambahkan:

```txt
patient_identity_key
```

Format:

```txt
child:{nama}:{tgl_lahir}:{nik_wali}
```

---

## IMPLEMENTASI

Simpan ke:

```txt
patients
visits
```

Gunakan untuk:

* validasi kunjungan tahunan
* pencarian pasien
* duplicate detection

---

# 7. AUDIT TRAIL

## MASALAH

Belum ada audit trail medis lengkap.

---

## TARGET

Buat:

```txt
services/auditService.js
```

---

## FORMAT LOG

```js
{
  actorUid,
  actorName,
  actorRoles,
  action,
  module,
  visitId,
  patientKey,
  before,
  after,
  createdAt,
  deviceInfo
}
```

---

## WAJIB LOG

* login
* logout
* edit pasien
* edit hasil pemeriksaan
* update status antrean
* delete data
* export laporan

---

# 8. FIRESTORE INDEX

## TARGET

Buat:

```txt
firestore.indexes.json
```

---

## INDEX WAJIB

```json
{
  "indexes": [
    {
      "collectionGroup": "visits",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status_antrian",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "waktu_ambil_tiket",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "visits",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "patientNIK",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "tanggal_kunjungan",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

---

# 9. PWA & OFFLINE MODE

## MASALAH

Petugas bisa mengira data sudah tersimpan server padahal offline.

---

## TARGET

Buat:

```txt
components/system/SyncStatusBanner.jsx
```

---

## FITUR

* deteksi online/offline
* status sinkronisasi
* indikator pending sync
* warning saat offline

---

## UI

### ONLINE

```txt
🟢 Online
```

### OFFLINE

```txt
🔴 Offline - data akan disinkronkan otomatis
```

---

# 10. TV DISPLAY REFACTOR

## MASALAH

Lokasi masih hardcoded.

---

## TARGET

TvDisplay wajib membaca:

```txt
pengaturan/lokasi_aktif
```

secara realtime.

---

## TAMBAHAN

* cleanup speech synthesis
* limit data realtime
* indikator koneksi Firestore
* fallback lokasi default

---

# 11. TESTING

## INSTALL

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## SCRIPT

Tambahkan:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

---

## TEST WAJIB

### dateAge.test.js

Test:

* bayi
* balita
* anak
* dewasa
* lansia

---

### queueStatus.test.js

Test:

* normalize status
* alias status

---

### ckgValidation.test.js

Test:

* duplicate kunjungan
* pasien NONIK
* validasi tahunan

---

# 12. UI/UX OPERASIONAL

## MASALAH

UI masih campur antara admin dashboard dan operasional lapangan.

---

## TARGET

### MODE OPERASIONAL

* tombol besar
* kontras tinggi
* mudah dipakai touchscreen
* minim popup

---

## STANDAR

### Tinggi tombol minimum

```css
min-height: 48px;
```

### Font minimum

```css
font-size: 14px;
```

---

# 13. CLEANUP YANG WAJIB

## HAPUS

* string status manual
* query Firestore duplikat
* logic Firestore langsung di komponen UI
* sessionStorage role utama
* hardcoded lokasi

---

# 14. CHECKLIST FINAL

## BUILD

```bash
npm run build
```

WAJIB SUCCESS.

---

## LINT

```bash
npm run lint
```

WAJIB CLEAN.

---

## TEST

```bash
npm run test
```

WAJIB PASS.

---

# TARGET AKHIR

Aplikasi harus:

✅ aman
✅ maintainable
✅ scalable
✅ realtime stabil
✅ aman untuk data kesehatan
✅ mudah dipakai petugas lapangan
✅ siap dikembangkan jangka panjang

---

# CATATAN PENTING

JANGAN mengubah flow bisnis layanan CKG tanpa persetujuan.

Fokus utama saat ini:

1. keamanan
2. stabilitas
3. struktur kode
4. konsistensi data
5. reliability operasional

Bukan menambah fitur baru.

```
```
