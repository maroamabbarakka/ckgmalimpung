# SPRINT 5 — Offline Sync dan Resilience Lapangan

## Tujuan
Membuat aplikasi tahan kondisi lapangan: internet putus, browser crash, device restart, operator pindah halaman.

## Komponen Wajib
```txt
src/features/sync/
  SyncStatusBadge.jsx
  offlineQueue.js
  syncRetryService.js
  draftRecoveryService.js
  conflictDetector.js
```

## Status Sinkron
Tampilkan global status:
- Online
- Offline
- Menyimpan
- Menunggu Sinkron
- Gagal Sinkron
- Konflik Data

## Draft Recovery
Setiap form pos menyimpan draft lokal:
```js
{
  visitId,
  pos,
  data,
  updatedAt,
  userId
}
```

Saat halaman dibuka ulang:
- jika draft lebih baru dari server, tawarkan restore,
- jika server lebih baru, tampilkan warning.

## Conflict Detection
Jika field `updatedAt` di server lebih baru dari versi yang dibuka operator:
- jangan overwrite diam-diam,
- tampilkan modal konflik,
- beri pilihan reload atau simpan sebagai catatan baru.

## Retry
Jika save gagal:
- simpan ke pending queue,
- retry saat online,
- tampilkan jumlah pending.

## Checklist
- [ ] Global sync indicator dibuat.
- [ ] Draft local dibuat per pos.
- [ ] Pending queue dibuat.
- [ ] Retry berjalan saat online.
- [ ] Conflict warning muncul.
- [ ] Operator tidak kehilangan data saat refresh.

## Acceptance Criteria
- Saat offline, operator tahu datanya belum terkirim.
- Saat online kembali, pending data terkirim.
- Refresh browser tidak menghapus input panjang.
