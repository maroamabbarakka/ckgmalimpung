# FORM_SCHEMA_REFERENCE.md

# FORM SCHEMA REFERENCE

## Fungsi File

`src/formSchemas.json` adalah pusat:

* seluruh pertanyaan,
* struktur form,
* conditional logic,
* mapping output,
* validasi field,
* render Pos.

---

# Status Saat Ini

Schema saat ini digunakan oleh:

* Pos1–Pos7,
* Dashboard,
* Export,
* Rapor,
* Laporan,
* Statistik,
* Filter pasien.

---

# Rule Utama

## DILARANG:

* rename ID,
* duplicate ID,
* orphan conditional,
* missing options,
* type mismatch.

---

# Validator Wajib

Developer wajib membuat validator schema.

Validator harus memeriksa:

* total form,
* total pertanyaan,
* duplicate ID,
* missing option,
* invalid type,
* empty label,
* invalid conditional logic.

---

# Compatibility Rule

Semua data lama:

* wajib tetap terbaca,
* wajib tetap valid,
* wajib tetap bisa diexport.

---

# Conditional Logic

Conditional field:

* tidak boleh orphan,
* tidak boleh circular,
* tidak boleh menghilang diam-diam.

---

# Field Naming Rule

ID field:

* stabil,
* konsisten,
* tidak boleh berubah tanpa migration.

---

# Output Rule

Hanya field resmi schema:
yang boleh masuk:

* export,
* rapor,
* laporan,
* statistik.

Field helper/UI tidak boleh ikut tersimpan.
