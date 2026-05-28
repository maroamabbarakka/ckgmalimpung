# MICROINTERACTIONS & SMART FEEDBACK

## AKSI SIMPAN
State:
- idle
- saving
- saved
- failed

UI:
- tombol berubah loading
- tampil "Data tersimpan"
- jika gagal tampil retry

## AKSI FINALISASI
Wajib:
- confirmation modal
- checklist validasi
- loading state
- success message

## AKSI PANGGIL PASIEN
Feedback:
- nomor berubah status
- TV display update
- toast "Pasien dipanggil ke Pos X"

## TOAST
Gunakan untuk:
- sukses simpan
- gagal sync
- export selesai

Jangan gunakan toast untuk:
- error field form
- konfirmasi hapus

## ANIMASI
Gunakan halus:
- fade
- slide ringan
- skeleton shimmer

Hindari:
- animasi lama
- bounce berlebihan
- efek ramai

## ACCEPTANCE
- setiap klik penting punya feedback
- tidak ada double submit
- user tahu apakah data sudah tersimpan