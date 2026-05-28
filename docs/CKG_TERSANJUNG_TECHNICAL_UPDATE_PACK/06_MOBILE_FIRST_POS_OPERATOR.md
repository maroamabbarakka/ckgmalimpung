# 06 — Mobile-First Untuk Operator Pos

## Tujuan

Aplikasi harus nyaman dipakai di HP berbagai ukuran oleh petugas lapangan dan operator pos.

## Masalah Yang Harus Dihindari

- Tombol terlalu kecil.
- Form terlalu panjang tanpa grouping.
- Queue dan form bercampur.
- Aksi utama sulit ditemukan.
- Banyak card terlalu besar.
- Dashboard desktop dipaksakan ke mobile.

---

## Layout Mobile Pos

Urutan mobile:

```txt
1. Header pos
2. Status online/sync
3. Pasien aktif
4. Progress pos
5. Form section
6. Bottom action bar
7. Antrean sebagai drawer/bottom sheet
```

Jangan tampilkan antrean panjang di atas form pada mobile.

---

## Pasien Aktif Card

Wajib tampil di semua Pos:

```jsx
function ActivePatientCard({ patient, visit }) {
  return (
    <section className="rounded-3xl border border-teal-100 bg-teal-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-teal-700">Pasien Aktif</p>
      <h2 className="mt-1 text-xl font-black text-slate-900">{patient.nama}</h2>
      <p className="text-sm text-slate-600">
        NIK: {patient.nik || '-'} · {patient.umur || '-'} tahun · {patient.jenisKelamin || '-'}
      </p>
      <p className="mt-2 text-xs font-bold text-teal-700">
        Status: {visit.statusLabel || visit.status}
      </p>
    </section>
  );
}
```

---

## Section Form

Pisahkan form panjang menjadi section:

```txt
A. Identitas
B. Vital Sign
C. Pemeriksaan
D. Catatan
E. Validasi
```

Setiap section:
- Bisa collapse.
- Default buka section yang belum lengkap.
- Tampilkan jumlah field wajib yang belum diisi.

---

## Ukuran Target Sentuh

Minimal:
```txt
44px tinggi tombol/input
```

Input:
```txt
py-3 atau py-4
```

Button mobile:
```txt
min-h-[48px]
```

---

## Bottom Action Bar

Wajib di semua Pos pada mobile:

Tombol:
- Kembali
- Simpan Draft
- Selesai Pos

Contoh:
```jsx
<div className="grid grid-cols-[0.8fr_1fr_1.4fr] gap-2">
  <Button variant="ghost">Kembali</Button>
  <Button variant="secondary">Draft</Button>
  <Button>Selesai Pos</Button>
</div>
```

---

## Queue Mobile

Antrean di mobile jangan selalu tampil sebagai sidebar.

Buat tombol:
```txt
Lihat Antrean (12)
```

Saat diklik:
- buka modal/drawer.
- tampilkan list pasien ringkas.
- ada search.
- ada filter status.

---

## Queue Card Mobile

```jsx
function QueueItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left ${
        active ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="font-black text-slate-900">{item.nama}</p>
      <p className="text-xs text-slate-500">No: {item.noAntrian} · {item.umur} tahun</p>
      <p className="mt-1 text-xs font-bold text-teal-700">{item.statusLabel}</p>
    </button>
  );
}
```

---

## Desktop Pos

Desktop tetap boleh 2 kolom:

```txt
Sidebar antrean 320px
Konten form fleksibel
```

Tetapi jangan buat card terlalu lebar. Gunakan grid form:
- 1 kolom di mobile.
- 2 kolom di tablet.
- 3 kolom di desktop jika field pendek.

---

## Hindari Horizontal Scroll

Audit semua halaman dengan:
- width 360px
- width 390px
- width 414px
- tablet 768px
- desktop 1366px

CSS wajib:
```css
html, body {
  overflow-x: hidden;
}
```

Tabel di mobile:
- ubah menjadi card,
- atau bungkus `overflow-x-auto`.

---

## Input Numeric

Untuk NIK, BB, TB, TTV:
```jsx
<input inputMode="numeric" pattern="[0-9]*" />
```

Untuk PIN:
```jsx
<input inputMode="numeric" type="password" />
```

---

## UX Validasi

Jangan hanya alert.

Tampilkan:
- field error langsung di bawah input.
- summary error di atas form.
- scroll ke error pertama.

Pseudo:
```js
if (errors.length) {
  setErrors(errors);
  document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return;
}
```

---

## Mode Petugas Lapangan

Untuk Kunjungan Rumah:
- Tombol scan identitas besar.
- Field alamat/desa mudah dipilih.
- Offline status jelas.
- Simpan draft lokal otomatis.
- Tidak perlu dashboard berat.

---

## Checklist Mobile Per Pos

Untuk setiap Pos:
- [ ] Header tidak terlalu tinggi.
- [ ] Pasien aktif jelas.
- [ ] Antrean tidak memenuhi layar.
- [ ] Tombol utama fixed di bawah.
- [ ] Input minimal 44px.
- [ ] Error tampil inline.
- [ ] Tidak ada horizontal scroll.
- [ ] Bisa dipakai satu tangan.
- [ ] Form bisa disimpan draft.
- [ ] Status sinkron terlihat.

## Definition of Done

- Minimal Pos1 dan Pos2 sudah mobile-first.
- Bottom action bar aktif.
- Queue mobile jadi drawer/modal.
- Tidak ada horizontal scroll pada 360px.
