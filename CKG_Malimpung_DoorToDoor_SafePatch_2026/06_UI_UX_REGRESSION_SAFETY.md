# 06 — UI/UX Regression Safety

## Tujuan
Menambahkan role Door to Door tanpa merusak visual, responsive behavior, navigasi, dan workflow existing.

## Prinsip
Patch ini **bukan redesign**.

Yang diperbolehkan:
- menambah satu opsi hak akses;
- menambah label/grup kecil jika tidak mengubah layout secara signifikan;
- menampilkan Kunjungan Rumah untuk role DTD;
- redirect DTD-only bila aman.

Yang tidak diperbolehkan:
- mengganti design system;
- memindahkan menu role lain;
- mengubah ukuran global typography;
- mengubah global spacing;
- mengubah shell/sidebar/bottom nav untuk semua user hanya demi DTD;
- refactor CSS besar.

## SIMPEG Modal
Saat menambah “Petugas Door to Door”:

- gunakan komponen/style yang sama dengan pilihan role existing;
- jangan membuat tinggi modal melebihi viewport tanpa scroll;
- jangan membuat checkbox terpotong;
- pertahankan tombol Simpan di posisi/behavior existing;
- jangan mengubah field profil lain.

Jika role list menjadi terlalu panjang, solusi paling aman adalah membuat container role **scrollable** atau menambah satu section kecil dengan style existing, bukan mendesain ulang modal.

## Kunjungan Rumah
Untuk user DTD:

- komponen form existing harus tetap sama;
- validasi existing tetap aktif;
- tombol submit tetap sama;
- jangan menghapus step;
- jangan mengubah struktur pertanyaan;
- jangan mengubah schema output;
- jangan mengubah ID form.

## Navigation
User DTD-only cukup melihat entry point Kunjungan Rumah.

Jangan menampilkan Pos 1–7 apabila role tidak mengizinkan.

Jangan mengubah visibility menu role lain.

## Redirect DTD-only
Jika diimplementasikan:

```text
login DTD-only → /kunjungan-rumah
```

Pastikan:
- multi-role user tidak dipaksa selalu ke DTD;
- back button tetap bekerja;
- logout tetap tersedia;
- deep link tidak crash.

## Visual Regression Checklist
Bandingkan screenshot before/after:

### Desktop
- [ ] Login identik kecuali perubahan yang memang diminta.
- [ ] Dashboard tidak bergeser.
- [ ] Sidebar tidak overflow.
- [ ] SIMPEG table tidak berubah width tanpa alasan.
- [ ] Modal edit staff tidak terpotong.
- [ ] Kunjungan Rumah tidak berubah layout.
- [ ] Pos 1–7 tidak berubah.
- [ ] Rapor tidak berubah.

### Mobile
- [ ] tidak ada horizontal scroll.
- [ ] bottom navigation tidak overlap konten.
- [ ] modal dapat di-scroll.
- [ ] checkbox role dapat ditekan.
- [ ] tombol save tetap reachable.
- [ ] form DTD tidak tertutup keyboard/navigation.

## Functional UI Regression
Pastikan bukan hanya visual:

- klik role checkbox berfungsi;
- Simpan staff berhasil;
- reopen modal menampilkan role yang benar;
- logout/login memuat role terbaru;
- unauthorized route memberikan behavior existing (redirect/denied), bukan blank screen;
- loading state tidak infinite.

## CSS Rule
Jika memungkinkan, **jangan edit global CSS** untuk patch ini.

Jika harus:
- gunakan selector lokal;
- hindari selector generik seperti `button`, `input`, `table`, `div`;
- jangan ubah root font-size;
- jangan ubah breakpoint global.

## Acceptance Criteria
- [ ] screenshot comparison lulus.
- [ ] tidak ada overflow baru.
- [ ] role existing UI tidak berubah.
- [ ] DTD UI mudah dipakai di mobile.
- [ ] tidak ada redesign yang ikut terbawa patch.
