# STATUS EKSEKUSI SMART UI/UX

Tanggal: 2026-05-28

## Fokus Eksekusi

- Sprint UI/UX 1: Design System baseline.
- Sprint UI/UX 2: Layout Shell mobile.
- Sprint UI/UX 3: Smart Form Input baseline di Pos 1.
- Sprint UI/UX 3 lanjutan: Smart Form Input pada form dinamis Pos 2-6.
- Sprint UI/UX 4: Pos Workflow UX baseline.
- Sprint UI/UX 5: Dashboard/TV smoke QA.
- Sprint UI/UX 6: QA multi-device responsive.
- QA mobile awal pada viewport 390x844.

## Hasil Implementasi

- Token global dibuat di `src/styles/tokens.css`.
- Global UX guard dibuat di `src/styles/globals.css`.
- Focus state keyboard terlihat untuk link, tombol, input, select, textarea.
- Target sentuh kontrol dibuat minimal 44px.
- Input mobile memakai ukuran 16px untuk menghindari zoom keyboard.
- Bottom navigation mobile dibatasi maksimal 5 item.
- Bottom navigation tidak lagi scroll horizontal.
- Home unauthenticated tidak lagi menampilkan section alur pos kosong.
- Workflow stepper dibuat di `src/components/patient/WorkflowStepper.jsx`.
- Header pasien aktif Pos 2-7 kini menampilkan stepper Loket-Pos-Rapor.
- Header pasien aktif menampilkan panel kesiapan ringkas: identitas, antrean aktif, draft/sinkron.
- Header pasien aktif menampilkan petugas yang sedang membuka pasien jika lock tersedia.
- Input Pos 1 ditambah `inputMode`, `pattern`, `autoComplete`, dan `aria-invalid`.
- NIK/nomor HP Pos 1 otomatis disanitasi menjadi angka.
- NIK dan tanggal lahir Pos 1 punya error inline dekat field.
- Pos 1 menampilkan checklist kesiapan sebelum lanjut ke Pos 2.
- Form dinamis Pos 2-6 kini memakai input angka yang disanitasi untuk mencegah huruf/notasi `e` tersimpan.
- Keyboard mobile form dinamis dibedakan antara angka bulat dan desimal.
- Field klinis utama seperti tensi, antropometri, gula darah, lipid, dan skor menampilkan hint serta peringatan nilai ekstrem dekat field.
- Sticky bottom action bar Pos 2-7 distandarkan lewat `PosBottomActionBar`.
- Label aksi Pos 2-7 diseragamkan menjadi `Kembali ke Pos X`, `Simpan & Lanjut Pos X`, dan `Tandai Selesai`.
- Playwright production smoke untuk TV display lulus pada HD TV, Full HD TV, dan tablet landscape.
- Playwright responsive production lulus pada narrow phone, small phone, modern phone, large phone, dan small tablet.
- Test responsive diperbarui agar validasi label Pos tidak rapuh terhadap kapitalisasi UI.
- Dashboard operator kini menampilkan panel `Yang perlu diperhatikan hari ini`.
- Panel insight dashboard merangkum pasien belum final, bottleneck pos, masalah data, dan risiko dominan tanpa membuka detail pasien.
- TV display publik kini menampilkan status antrean aktif, waktu sinkron terakhir, dan fallback saat koneksi data antrean tidak stabil.
- QA TV display diperbarui untuk memastikan status sinkron tampil di layar publik.
- Guard anti submit ganda diterapkan pada Pos 1-7 dan Kunjungan Rumah.
- Tombol simpan Kunjungan Rumah ikut terkunci saat OCR masih berjalan.
- Checklist Smart UI QA ditandai selesai sesuai hasil audit baseline production.

## Verifikasi

- `npm run lint` sukses.
- `npm run test:run` sukses.
- `npm run build` sukses.
- Playwright mobile 390px:
  - tidak ada horizontal overflow.
  - bottom navigation proporsional.
  - section kosong tidak tampil.
- Playwright production:
  - `responsive.spec.cjs` sukses pada 10 skenario mobile/tablet.
  - `public-tv.spec.cjs` sukses pada 3 skenario TV/tablet.
- Checklist `14_SMART_UI_QA_CHECKLIST.md` selesai untuk baseline production.

## Catatan Lanjutan

- Item utama Sprint UI/UX 1-6 sudah dieksekusi pada baseline production. Polish lanjutan dashboard insight, TV display resilience, dan anti submit ganda sudah ditambahkan; item berikutnya dapat diarahkan pada temuan operator lapangan.
