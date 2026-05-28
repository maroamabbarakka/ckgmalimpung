# PATIENT LOCKING SYSTEM

## OBJECTIVE
Hindari 2 petugas mengedit pasien bersamaan.

## FIRESTORE STRUCTURE

```json
patientLocks: {
  patientId: string,
  lockedBy: string,
  lockedAt: timestamp,
  pos: string
}
```

## FLOW

1. Saat pasien dibuka:
   - create lock

2. Saat keluar:
   - release lock

3. Jika lock aktif:
   - tampilkan modal warning

## AUTO RELEASE

Release otomatis jika:
- idle > 15 menit
- browser close
- logout