# Backend — PMB Online

## Arsitektur Ringkas
- Frontend publik: Blogger (landing) dengan CTA ke aplikasi
- Aplikasi PMB: SPA (Next.js / React) terhubung ke Firebase

## Layanan Firebase yang Digunakan
- Firebase Authentication: pendaftaran, login, reset password, role-based access
- Cloud Firestore: menyimpan data peserta, status, pembayaran, pengumuman
- Firebase Storage: menyimpan dokumen unggahan (foto, KTP, ijazah, bukti transfer)
- Firebase Functions: generate nomor pendaftaran, notifikasi, export data, validasi otomatis
- (Opsional) Firebase Hosting untuk aplikasi PMB

## Proses Kritis
- Generate nomor pendaftaran ter-atomic (cloud function dengan counter/collection khusus)
- Flow pembayaran: buat record invoice → tunggu bukti/konfirmasi → ubah status
- Upload dokumen: sediakan signed upload URL atau integrasi SDK Storage

## Keamanan
- Gunakan Firestore Security Rules berdasarkan `uid` dan `role`
- Batasi akses Storage hanya untuk owner file dan verifikator/admin
- Semua endpoint dan fungsi menggunakan HTTPS

## Integrasi Pembayaran
- Mulai dengan manual upload bukti transfer
- Tahap lanjut: integrasi gateway (QRIS/VA) dengan callback dari provider

## Notifikasi
- Email dan WhatsApp (gateway pihak ketiga) untuk event: registrasi, pembayaran, revisi, pengumuman

## Jobs / Cron
- Scheduled exports (CSV/Excel)
- Pembersihan file sementara atau expired invoices

## Observabilitas
- Logging fungsi (Cloud Functions logs)
- Monitoring dan alert pada error rate atau job gagal
