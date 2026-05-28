# 23 — Offline Sync dan Conflict Resolution Detail

## Target
Operator selalu tahu apakah data sudah aman tersimpan.

## Komponen wajib
```txt
src/components/system/NetworkStatusProvider.jsx
src/components/system/SyncStatusBadge.jsx
src/services/syncQueueService.js
src/services/conflictService.js
```

## Status yang ditampilkan
| Status | Label UI |
|---|---|
| online | Online |
| offline | Offline — data disimpan sementara |
| saving | Menyimpan... |
| pending | Menunggu sinkron |
| synced | Tersimpan |
| failed | Gagal sinkron |
| conflict | Konflik data |

## Pending write queue
Simpan metadata setiap write:
```js
{
  id,
  collectionName,
  docId,
  action: 'create'|'update'|'delete',
  payload,
  createdAt,
  retryCount,
  status
}
```

## Conflict detection
Gunakan field:
```js
version: number,
updatedAt,
updatedBy
```

Saat save:
- baca versi terakhir;
- jika versi lokal < versi server, tampilkan konflik;
- jangan overwrite diam-diam.

## UI konflik
Tampilkan modal:
```txt
Data pasien ini sudah diperbarui oleh petugas lain.
Pilihan:
1. Lihat versi server
2. Simpan sebagai catatan baru
3. Minta admin takeover
```

## Auto-save draft
- simpan draft lokal tiap 10-15 detik;
- simpan draft saat pindah section;
- restore draft saat halaman dibuka ulang.

## Acceptance criteria
- Saat offline, operator tetap bisa isi draft.
- Saat online kembali, status berubah jelas.
- Konflik tidak menimpa data server diam-diam.
- Operator melihat pesan yang mudah dipahami.
