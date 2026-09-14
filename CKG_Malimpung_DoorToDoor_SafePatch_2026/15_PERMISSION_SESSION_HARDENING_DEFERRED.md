# 15 — Permission Session Hardening (Deferred / Patch Terpisah)

## Latar Belakang
Sistem memiliki konsep `roles` dan juga `permissions` pada profil staff/user. Namun perubahan besar pada cara session/permission dievaluasi mempunyai blast radius ke seluruh route aplikasi.

## Keputusan untuk Patch DTD
Patch inti Door to Door **tidak boleh sekaligus merombak seluruh permission engine**.

Gunakan role existing sebagai baseline agar perubahan kecil dan mudah diuji.

## Patch Lanjutan yang Disarankan
Setelah DTD stabil, evaluasi patch terpisah untuk membawa field berikut ke session user secara konsisten:

```text
permissions
pos
staffDocId
```

Kemudian tentukan satu source of truth yang jelas untuk authorization.

## Guardrail
Saat patch lanjutan dilakukan:

- role existing harus tetap backward compatible;
- jangan membuat permission granular diam-diam menolak user yang sebelumnya sah;
- sediakan migration/compatibility fallback;
- uji seluruh route;
- jangan ubah Firestore Rules dan frontend permission engine dalam satu commit besar tanpa test matrix.

## Acceptance Criteria Patch Lanjutan

- [ ] roles existing tetap bekerja.
- [ ] permissions benar-benar termuat setelah login/refresh.
- [ ] perubahan permission dari SIMPEG tidak menghapus roles.
- [ ] route guard mempunyai satu aturan evaluasi yang terdokumentasi.
- [ ] tidak ada blank screen/redirect loop.
- [ ] Firestore security tetap menjadi boundary final.
