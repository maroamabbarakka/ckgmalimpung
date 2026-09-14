# 05 — Firestore Rules: Least Privilege untuk Door to Door

## Tujuan
Membuat user DTD dapat menyelesaikan Kunjungan Rumah tanpa memperoleh akses tulis luas ke seluruh alur klinis.

## Prinsip
Frontend guard **bukan** security boundary. Firestore Rules harus tetap menolak operasi yang tidak sah walaupun user mencoba memanggil SDK secara langsung.

## Role Helper
Tambahkan `door_to_door` ke helper role hanya pada konteks yang memang memerlukannya.

Konsep helper:

```rules
function isDoorToDoor() {
  return hasRole('door_to_door');
}
```

## Identifikasi Visit DTD
Untuk kompatibilitas data lama dan baru:

```rules
function isDoorToDoorVisit(data) {
  return data.visit_source == 'door_to_door'
    || data.jalur_pemeriksaan == 'Kunjungan Rumah';
}
```

## Create `visits`
DTD boleh create hanya jika document yang dibuat adalah visit DTD.

Ideal data baru juga harus memastikan:

```text
created_by_uid == request.auth.uid
```

Konsep:

```rules
allow create: if existingClinicalWriteRule()
  || (
    isDoorToDoor()
    && isDoorToDoorVisit(request.resource.data)
    && request.resource.data.created_by_uid == request.auth.uid
  );
```

## Update `visits`
DTD tidak boleh mengubah visit non-DTD.

Konsep:

```rules
allow update: if existingClinicalWriteRule()
  || (
    isDoorToDoor()
    && isDoorToDoorVisit(resource.data)
    && isDoorToDoorVisit(request.resource.data)
  );
```

Jika `created_by_uid` sudah ada, jangan izinkan field itu diganti.

## `patients`
Kunjungan Rumah membutuhkan create/update patient sesuai flow existing.

Tambahkan write DTD hanya sejauh dibutuhkan flow Kunjungan Rumah.

Jangan memberikan DTD akses admin terhadap seluruh user/staff/settings.

## `public_queue`
Jangan memperluas rule `public_queue` kepada DTD hanya agar write tidak gagal.

Lebih aman ubah service agar visit DTD yang sudah `Selesai` tidak mencoba sinkronisasi ke public queue.

Rekomendasi API service:

```js
createVisitWithRef(visitRef, payload, { syncPublicQueue: false })
```

Default untuk flow existing tetap `true` agar Pos/Loket tidak berubah.

## Read `visits`
**Jangan memperketat global read-policy dalam patch role DTD ini** tanpa pengujian menyeluruh.

Alasannya: validasi CKG tahunan dapat mencari visit pasien yang dibuat melalui jalur lain. Jika read terlalu dibatasi, sistem dapat gagal mendeteksi CKG yang sudah pernah dilakukan.

Hardening read `visits` harus menjadi proyek terpisah, idealnya menggunakan registry CKG tahunan yang hanya menyimpan status minimal tanpa membocorkan detail klinis.

## Collection yang Dilarang untuk DTD Write
Pastikan DTD tidak memperoleh write ke:

- `users`
- `staff`
- settings/config admin
- data audit existing
- koleksi administrasi lain

## Rule Test Wajib
Gunakan emulator/test environment dan buktikan:

| Operasi | Expected |
|---|---|
| DTD create DTD visit | ALLOW |
| DTD update DTD visit | ALLOW sesuai kebutuhan |
| DTD create normal/Pos visit | DENY |
| DTD update normal/Pos visit | DENY |
| DTD write patient sesuai flow | ALLOW |
| DTD write staff | DENY |
| DTD write users | DENY |
| DTD write admin config | DENY |
| Admin existing operations | tetap ALLOW |
| Dokter/perawat existing operations | tetap sesuai baseline |

## Deployment Rules
Rules harus dideploy dalam commit yang dapat direvert terpisah dari perubahan UI besar.

Simpan file baseline `firestore.rules` dalam backup sebelum deploy.

## Acceptance Criteria
- [ ] least privilege terpenuhi.
- [ ] DTD tidak dapat menulis visit non-DTD.
- [ ] flow DTD save berhasil.
- [ ] role existing tidak kehilangan permission.
- [ ] tidak ada perubahan global read-policy dalam patch ini.
