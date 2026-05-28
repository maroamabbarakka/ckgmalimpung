# STABILIZATION_FIRST.md

# CKG MALIMPUNG — STABILIZATION FIRST POLICY

## Status Sistem Saat Ini

Aplikasi CKG Malimpung masuk fase:

# STABILIZATION MODE

Artinya:

* fokus utama bukan fitur baru,
* bukan redesign besar,
* bukan refactor massal,
* bukan smart automation,
* bukan enhancement besar.

Fokus utama saat ini:

* menjaga integritas data,
* memastikan Pos1–Pos7 stabil,
* memastikan export valid,
* memastikan laporan kompatibel,
* memastikan schema tetap aman.

---

# Prinsip Utama

## FOUNDATION FIRST

Seluruh pengembangan harus dimulai dari:

1. struktur data,
2. schema,
3. output resmi,
4. flow Pos,
5. Firestore structure,
6. regression safety.

Bukan dimulai dari:

* UI,
* animasi,
* redesign,
* enhancement besar.

---

# Source of Truth

## File paling penting sistem:

### 1. `src/formSchemas.json`

Adalah:

* pusat schema,
* pusat question mapping,
* pusat conditional logic,
* pusat export mapping.

---

### 2. `public/Laporan_Tersanjung_Final.html`

Adalah:

* referensi output resmi,
* referensi struktur laporan,
* referensi validasi data,
* referensi grouping dan filtering.

---

# Aturan Utama

## DILARANG:

* refactor besar,
* redesign total,
* mengubah schema tanpa audit,
* mengubah export tanpa validasi,
* mengubah Firestore structure tanpa compatibility test.

---

# Filosofi Patch

## WAJIB:

1 patch = 1 tujuan.

Contoh:

* fix Pos2 validation,
* fix export lansia,
* fix mobile navbar.

Bukan:

* redesign total,
* update seluruh Pos,
* refactor semua component.

---

# Prioritas Pengembangan

## PRIORITAS 1

Stabilitas:

* save data,
* read data,
* export,
* rapor,
* dashboard,
* Pos flow.

---

## PRIORITAS 2

Konsistensi UI ringan:

* spacing,
* overflow,
* responsive,
* alignment.

---

## PRIORITAS 3

Optimasi:

* query,
* loading,
* caching.

---

## PRIORITAS 4

Fitur tambahan.

---

# Prinsip Developer

Developer wajib:

* konservatif,
* incremental,
* regression-safe,
* tidak agresif melakukan perubahan besar.

---

# Kesimpulan

Target aplikasi:

# STABIL

# DATA AMAN

# OUTPUT VALID

# MOBILE USABLE

# TIDAK MERUSAK DATA LAMA
