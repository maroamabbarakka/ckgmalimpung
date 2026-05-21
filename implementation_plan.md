# Master Engine V22 (Automasi Profil Lipid & Bugfix Toggles)

Berdasarkan analisis tangkapan layar, saya menemukan dua celah besar yang membuat pekerjaan tenaga medis (nakes) menjadi lambat dan membingungkan:

1. **Bug Penyakit Menular ("POSITIF / POSITIF")**:
   Ada kesalahan logika pembacaan teks pada Mesin Master. Kata `"Non Reaktif"` ternyata mengandung kata `"Reaktif"`, sehingga mesin salah menafsirkan keduanya sebagai hasil `POSITIF`. Hal ini menyebabkan tombol toggle menjadi ganda (POSITIF dan POSITIF).
2. **Beban Manual Profil Lipid**:
   Kemenkes mewajibkan nakes mengisi angka *Kolesterol, HDL, LDL, dan Trigliserida*, lalu memaksa nakes juga mengetikkan **Interpretasi** dari angka tersebut secara manual satu per satu. Ini sangat tidak efisien (menghabiskan waktu).

## Rencana Automasi

### 1. Bugfix Toggle Hepatitis & Penyakit Menular
Saya akan membalik logika mesin (`parseOption`) agar ia mengecek kata `"Non Reaktif"` terlebih dahulu sebelum `"Reaktif"`. Ini akan mengembalikan tombol toggle menjadi normal: `NEGATIF` / `⚠️ POSITIF`.

### 2. Automasi Cerdas Profil Lipid (Zero-Click Interpretation)
Saya akan membangun sebuah Blok Kustom "Profil Lipid / Asam Urat" yang mengadopsi AI ringan.
- Form Interpretasi akan **disembunyikan** dari pandangan perawat.
- Perawat hanya perlu mengetikkan **angka** (misal Kolesterol: 250).
- Mesin akan **berpikir di latar belakang** dan langsung menyimpulkan statusnya (Normal, Ambang Batas, atau Tinggi) berdasarkan standar medis.
- Mesin akan menyuntikkan (auto-fill) teks interpretasi tersebut langsung ke memori form (`formData`) agar tetap valid saat dikirim ke *server* SatuSehat/Kemenkes, namun UI tetap terlihat sangat bersih dan ringkas!

## User Review Required

> [!IMPORTANT]
> Untuk automasi interpretasi, saya akan menggunakan standar nilai rujukan umum:
> - **Kolesterol Total**: Normal (<200), Ambang Batas (200-239), Tinggi (>=240)
> - **HDL**: Rendah (<40), Normal (>=40)
> - **LDL**: Optimal (<100), Mendekati Optimal (100-129), Ambang Batas (130-159), Tinggi (>=160)
> - **Trigliserida**: Normal (<150), Ambang Batas (150-199), Tinggi (>=200)
>
> Apakah nilai rentang (threshold) ini sudah sesuai dengan standar instansi Anda? Jika iya, mohon berikan persetujuan ("Lanjutkan").
