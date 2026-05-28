# 30 — Prompt VS/Codex Per Tugas

## Cara pakai
Tempel prompt per tugas ke VS/Codex. Jangan berikan semua sekaligus jika ingin hasil rapi. Setelah Codex membuat perubahan, review diff, jalankan build, lalu commit.

---

## Prompt 1 — Audit repo tanpa mengubah kode
```txt
Audit repository ini tanpa mengubah kode. Buat ringkasan file terbesar, semua penggunaan Firestore collection/doc/query, semua penggunaan sessionStorage/localStorage, dan semua pengecekan role/permission. Simpan hasilnya ke docs/audit/*. Jangan refactor dulu. Setelah selesai, jelaskan risiko P0/P1/P2.
```

## Prompt 2 — Pusatkan permission
```txt
Buat modul permission terpusat untuk aplikasi ini. Tambahkan src/auth/permissions.js berisi daftar permission dan ROLE_PERMISSIONS. Ganti pengecekan role langsung di route/menu utama agar memakai hasPermission(). Jangan ubah tampilan halaman. Pastikan build tetap sukses.
```

## Prompt 3 — Buat RequirePermission
```txt
Tambahkan komponen src/auth/RequirePermission.jsx. Komponen ini harus membaca session auth yang ada sekarang, menampilkan loading saat belum siap, redirect ke login jika belum login, dan menampilkan halaman akses ditolak jika permission tidak cukup. Terapkan ke route utama Pos, Dashboard, Rapor, Export, dan Staff. Jangan ubah logic data.
```

## Prompt 4 — Workflow helper
```txt
Buat helper workflow di src/workflow/visitStatus.js dan src/workflow/visitTransitions.js. Definisikan status kunjungan CKG dari REGISTERED sampai FINALIZED. Tambahkan fungsi canStartPos, canCompletePos, getNextVisitStatus, dan getHumanReadableStatus. Integrasikan minimal di satu halaman Pos sebagai pilot tanpa merusak pos lain.
```

## Prompt 5 — Validasi form Pos pilot
```txt
Refactor validasi halaman Pos 1 sebagai pilot. Buat src/validation/commonValidators.js dan src/features/pos1/pos1Validation.js. Tambahkan error summary dan field-level error. Jangan ubah schema data besar. Pastikan data yang sebelumnya valid tetap bisa disimpan.
```

## Prompt 6 — Audit log service
```txt
Buat src/services/auditLogService.js dengan fungsi logAuditEvent, logPatientUpdate, logVisitStatusChange, dan logExport. Integrasikan pada create pasien, update pasien, complete pos, finalize visit, dan export. Jangan simpan data medis lengkap di audit log; simpan ringkasan perubahan saja.
```

## Prompt 7 — Sync status UI
```txt
Tambahkan NetworkStatusProvider dan SyncStatusBadge. Badge harus tampil di header aplikasi dan halaman Pos. Status minimal: online, offline, saving, pending, synced, failed. Jangan mengubah mekanisme Firestore offline yang sudah ada, hanya tambahkan indikator dan wrapper save yang jelas.
```

## Prompt 8 — Dashboard optimization
```txt
Audit query dashboard. Jangan membaca semua visits/patients untuk statistik jika bisa difilter tanggal. Buat dashboardService.js. Tambahkan filter tanggal default hari ini. Tambahkan loading skeleton dan empty state. Jangan mengubah desain besar dulu.
```

## Prompt 9 — Export privacy guard
```txt
Tambahkan guard export laporan. Export wajib punya filter tanggal dan permission EXPORT_REPORT. Masking NIK dan nomor HP secara default. Tambahkan metadata export di file hasil. Semua export wajib mencatat audit log.
```

## Prompt 10 — Mobile back button
```txt
Tambahkan hook useMobileBackNavigation untuk mencegah tombol back HP menuju halaman kosong. Terapkan pada halaman detail pasien, pos, dan dashboard. Atur fallback route yang logis. Jangan membuat loop navigasi.
```

## Prompt 11 — TV display queue
```txt
Rapikan TV Display agar punya mode fullscreen khusus tanpa sidebar. Nomor antrean harus besar, pos tujuan jelas, dan data pasien sensitif tidak ditampilkan. Tambahkan tombol operator untuk panggil, panggil ulang, lewati, sedang dilayani, selesai. Jika memakai audio, gunakan Web Speech API dengan fallback visual.
```

## Prompt 12 — Release checklist
```txt
Tambahkan docs/release/RELEASE_CHECKLIST.md dan docs/release/ROLLBACK_PLAN.md. Isi dengan checklist build, QA manual, Firestore rules, deploy staging, deploy production, dan rollback Firebase Hosting. Jangan ubah kode aplikasi.
```
