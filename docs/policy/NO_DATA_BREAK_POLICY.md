# NO_DATA_BREAK_POLICY.md

# CKG MALIMPUNG — NO DATA BREAK POLICY

## Definisi

NO DATA BREAK POLICY berarti:
tidak ada update yang boleh:

* merusak data lama,
* mengubah struktur output tanpa validasi,
* membuat laporan lama gagal dibaca,
* membuat schema mismatch,
* membuat export berubah,
* membuat rapor gagal.

---

# Struktur yang Dianggap Sakral

## 1. formSchemas.json

DILARANG:

* rename ID,
* menghapus field,
* mengubah type,
* mengubah structure,
* mengubah conditional logic tanpa audit.

---

## 2. Firestore Structure

DILARANG:

* rename collection,
* rename document structure,
* mengubah nesting utama,
* mengubah field utama pasien.

---

## 3. Export Structure

DILARANG:

* rename column,
* mengubah grouping,
* mengubah struktur sheet,
* mengubah field output resmi.

---

# Virtual Field Policy

Field:

* `VIRTUAL_*`
* `TEMP_*`
* `UI_*`
* `CALC_*`

Tidak boleh masuk Firestore.

Harus dibersihkan sebelum save.

---

# Regression Test Wajib

Setelah setiap patch:

## WAJIB TEST:

* Pos1–Pos7,
* save data,
* edit data,
* export,
* rapor,
* dashboard,
* filter,
* category logic.

---

# Build Policy

Build wajib:

* lint clean,
* no schema warning,
* no duplicate key,
* no export mismatch.

Jika gagal:

# deploy dilarang.

---

# Commit Policy

Commit harus spesifik.

Contoh:

* `fix/export-anak`
* `fix/mobile-overflow`
* `fix/pos4-validation`

Dilarang:

* `big update`
* `final fix`
* `all improvements`

---

# Migration Policy

Jika suatu hari schema berubah:

* wajib migration plan,
* wajib compatibility test,
* wajib backup,
* wajib rollback plan.

---

# Prinsip Utama

# FORM SCHEMA IS SACRED

# EXPORT STRUCTURE IS SACRED

# SMALL PATCH ONLY

# REGRESSION TEST REQUIRED
