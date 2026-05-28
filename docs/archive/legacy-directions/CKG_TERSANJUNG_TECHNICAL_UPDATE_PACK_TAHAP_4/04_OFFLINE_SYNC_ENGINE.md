# OFFLINE SYNC ENGINE

## TARGET
Sistem tetap aman saat internet putus.

## REQUIRED

- pending queue
- retry sync
- reconnect listener
- sync indicator

## STORE

```ts
pendingWrites[]
failedWrites[]
syncedWrites[]
```

## UI STATUS

- Hijau = synced
- Kuning = pending
- Merah = failed

## RETRY FLOW

```ts
window.addEventListener('online', retryPendingSync)
```