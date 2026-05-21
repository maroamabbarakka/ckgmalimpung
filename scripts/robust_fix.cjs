const fs = require('fs');

let code = fs.readFileSync('KunjunganRumah.jsx', 'utf8');

const newLogic = `      let payloadPos3 = { disabilitas };
      let payloadPos4 = { keterangan: catatanAkhir };
      let payloadPos5 = {};
      let payloadPos6 = {};

      if (kategoriPasien === 'Bayi') {
        payloadPos3.bayi = { pjb1, pjb2, ikterus, kulit_tinja: kulitTinja, edukasi: edukasiBbl, hb0 };
      } else if (kategoriPasien === 'Balita') {
        payloadPos3.mata = { kanan: mataKanan, kiri: mataKiri }; payloadPos3.telinga = { serumen: telingaSerumen, infeksi: telingaInfeksi, daya_dengar: dayaDengar };
        payloadPos5.risiko_gula = { riwayat_keluarga: gulaRiwKeluarga, sering_lapar: gulaLapar, bb_turun: gulaTurunBb, sering_haus: gulaHaus };
        payloadPos3.imunisasi = { hep_0_24: imunHep, opv: imunOpv, pcv: imunPcv, dpt_hb_hib: imunDpt, bcg: imunBcg, rotavirus: imunRota, ipv: imunIpv, campak_rubella: imunCampak };
      } else if (kategoriPasien === 'Anak/Siswa') {
        payloadPos3.mata = { kanan: mataKanan, kiri: mataKiri, visus, kacamata }; payloadPos3.telinga = { serumen: telingaSerumen, infeksi: telingaInfeksi, gg_pendengaran: telingaGgPendengaran };
        payloadPos5.risiko_gula = { riwayat_keluarga: gulaRiwKeluarga, sering_lapar: gulaLapar, bb_turun: gulaTurunBb, sering_haus: gulaHaus }; 
        payloadPos6.jiwa_sdq = { khawatir_gelisah: jiwaKhawatirAnak, sulit_kontrol: jiwaKontrolAnak, sulit_fokus: jiwaFokusAnak };
        
        payloadPos4.kulit = { kusta: kulitKusta, skabies: kulitSkabies, frambusia: kulitFrambusia };
        payloadPos4.hepatitis = { transfusi: hepTransfusi, hd: hepHd, riw_klg: hepKlg };
        payloadPos4.aktivitas_fisik = aktivitasFisik;
        payloadPos5.resiko_tb = { batuk: resTbBatuk === '>2Mg' ? 'Ya' : 'Tidak', kontak: resTbKontak === 'Erat' || resTbKontak === 'Riw' ? 'Ya' : 'Tidak' };
      } else if (kategoriPasien === 'Dewasa' || kategoriPasien === 'Lansia') {
        payloadPos3.mata = { kanan: mataKanan, kiri: mataKiri, visus, pupil, kacamata }; payloadPos3.telinga = { serumen: telingaSerumen, infeksi: telingaInfeksi, gg_pendengaran: telingaGgPendengaran };
        
        payloadPos5.skrining_kanker = { ca_usus: caUsus, ca_lain: caLain };
        if (isPerempuan) {
          payloadPos5.skrining_kanker.ca_payudara = caPayudara; payloadPos5.skrining_kanker.ca_serviks = caServiks;
          payloadPos5.reproduksi_wanita = { sadanis, usg, iva, hpv_dna: hpvDna, hamil: kategoriPasien === 'Dewasa' ? hamil : 'Tidak' };
        }
        if (isUsiaKankerParu) payloadPos5.skrining_kanker_paru = kankerParu;
        
        if (kategoriPasien === 'Dewasa') {
          payloadPos6.jiwa_srq20 = { tdk_semangat: jiwaSrqSemangat, murung: jiwaSrqMurung, gugup: jiwaSrqGugup, khawatir: jiwaSrqKhawatir };
          payloadPos6.depresi_cemas = (jiwaSrqSemangat === 'Ya' || jiwaSrqMurung === 'Ya') ? 'Ya' : 'Tidak';
          payloadPos3.catin = { hiv: catinHiv, sifilis: catinSifilis, tt: catinTt };
        } else {
          payloadPos6.skilas = lansia;
          payloadPos6.depresi = (lansia.dep_sedih === 'Ya' || lansia.dep_minat_turun === 'Ya') ? 'Ya' : 'Tidak';
        }
        
        payloadPos4.kulit = { kusta: kulitKusta, skabies: kulitSkabies, frambusia: kulitFrambusia };
        payloadPos4.xray_tb = { bb_turun: xrayDewasaBb, demam: xrayDewasaDemam, keringat_malam: xrayDewasaKeringat };
        payloadPos4.hepatitis = { transfusi: hepTransfusi, hd: hepHd, riw_klg: hepKlg };
        payloadPos4.aktivitas_fisik = aktivitasFisik;
        
        payloadPos5.resiko_tb = { batuk: resTbBatuk === '>2Mg' ? 'Ya' : 'Tidak', kontak: resTbKontak === 'Erat' || resTbKontak === 'Riw' ? 'Ya' : 'Tidak', riw_tb_ppok: resTbRiwPpok };
        payloadPos5.merokok = { batuk_lama: rokokBatukLama, sesak: rokokSesak };
        payloadPos5.ppok = { nafas_pendek: ppokNafas, sulit_dahak: ppokDahak };
      }

      const visitDoc = doc(collection(db, "visits"));
      await setDoc(visitDoc, {
        jalur_pemeriksaan: "Kunjungan Rumah",
        nomor_antrian: nomorAntrianDtd,
        patientNIK: finalNik,
        kategori_usia_satusehat: dataUmur.kategori,
        umur_saat_periksa: dataUmur.tahun,
        status_antrian: "Selesai",
        waktu_ambil_tiket: serverTimestamp(),
        waktu_selesai_total: serverTimestamp(),
        pasien_snapshot: { nama: formData.nama, j_kelamin: formData.j_kelamin, tgl_lahir: formData.tgl_lahir, desa: formData.desa, dusun: formData.dusun, no_hp: formData.no_hp, status: (dataUmur.kategori === 'Bayi' || dataUmur.kategori === 'Balita') ? '-' : formData.status_perkawinan },
        petugas_pos1: namaPetugas, petugas_pos2: namaPetugas, petugas_pos3: namaPetugas, petugas_pos4: namaPetugas, petugas_pos5: namaPetugas, petugas_pos6: namaPetugas, petugas_pos7: namaPetugas,
        dokter_pemeriksa: namaPetugas,
        kesimpulan_dokter: catatanAkhir,
        pos2: payloadPos2, pos3: payloadPos3, pos4: payloadPos4, pos5: payloadPos5, pos6: payloadPos6
      });`;

const startStr = '      let payloadPos3 = { disabilitas };';
const endStr = '      });';

const startIndex = code.indexOf(startStr);
// Need to find the endStr AFTER the startIndex, inside the try block
const tryIndex = code.indexOf('try {', startIndex - 500); // we are inside try {
const endOfSetDocIndex = code.indexOf('      });', startIndex);

if (startIndex !== -1 && endOfSetDocIndex !== -1) {
    code = code.substring(0, startIndex) + newLogic + code.substring(endOfSetDocIndex + endStr.length);
    fs.writeFileSync('KunjunganRumah.jsx', code);
    console.log('Fixed payload securely!');
} else {
    console.log('Could not find bounds');
}
