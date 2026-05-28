# FINAL HARDENING CHECKLIST — Sebelum Dipakai Operasional Serius

## Build
- [ ] `npm run build` sukses.
- [ ] Tidak ada error console kritis.
- [ ] Tidak ada dependency tidak terpakai yang besar.
- [ ] Tidak ada secret/API key sensitif hardcoded selain config publik Firebase yang memang diperbolehkan.

## Auth
- [ ] Role tidak hanya dicek di UI.
- [ ] Firestore Rules diuji.
- [ ] User non-admin tidak bisa akses admin lewat URL.
- [ ] Session logout berjalan.
- [ ] Audit login tersedia.

## Data Pasien
- [ ] Validasi NIK.
- [ ] Validasi umur.
- [ ] Validasi field wajib per kategori.
- [ ] Duplicate patient detection.
- [ ] Riwayat kunjungan jelas.
- [ ] Edit data pasien tercatat di audit log.

## Workflow
- [ ] Tidak bisa lompat pos tanpa status valid.
- [ ] Lock pasien aktif.
- [ ] Force unlock admin tersedia.
- [ ] Finalisasi tidak bisa jika data belum lengkap.
- [ ] Rapor hanya bisa dicetak jika ready/finalized.

## UI/UX
- [ ] Mobile 360px aman.
- [ ] Tablet aman.
- [ ] Desktop aman.
- [ ] Bottom action bar muncul di form panjang.
- [ ] Loading/empty/error state konsisten.
- [ ] Tombol tidak terlalu kecil.

## Offline
- [ ] Offline status terlihat.
- [ ] Draft recovery berjalan.
- [ ] Pending sync terlihat.
- [ ] Konflik data tidak overwrite diam-diam.

## Dashboard
- [ ] Dashboard tidak query semua data mentah.
- [ ] Filter tanggal jelas.
- [ ] Export punya header/footer.
- [ ] Data abnormal dan tindak lanjut terlihat.

## TV Display
- [ ] Fullscreen aman.
- [ ] Tidak tampil data sensitif berlebihan.
- [ ] Nomor/nama panggilan jelas.
- [ ] Auto-refresh aman.

## Dokumentasi
- [ ] README update.
- [ ] Deployment SOP.
- [ ] Backup SOP.
- [ ] Role matrix.
- [ ] Firestore schema.
- [ ] Changelog internal.
