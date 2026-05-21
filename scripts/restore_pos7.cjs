const fs = require('fs');
let code = fs.readFileSync('Pos7.jsx', 'utf8');

const brokenChunk = `      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    try {
      // 🚀 UBAH STATUS JADI SELESAI (Hilang dari semua antrean Pos)
      await updateDoc(doc(db, "visits", pasienAktif.id), { 
          status_antrian: STATUS_MAPPING.SELESAI, 
          dokter_pemeriksa: sessionStorage.getItem('namaPegawai') || 'Dokter/Petugas', 
          kesimpulan_dokter: kesimpulan,
          waktu_selesai: serverTimestamp(),
          petugas_aktif: null
      });
      setPesan(\`✅ Pemeriksaan Selesai! Pasien dapat melihat rapornya.\`); 
      setTimeout(() => {
          setPasienAktif(null);
          navigate('/dashboard');
      }, 1500); 
    } catch (error) { setPesan("❌ Gagal menyimpan data: " + error.message); } finally { setLoading(false); }
  };`;

const fixedChunk = `      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setAntrian(data.sort((a, b) => (a.waktu_ambil_tiket?.toMillis() || 0) - (b.waktu_ambil_tiket?.toMillis() || 0)));
    });
    return () => unsubscribe();
  }, []);

  const handlePanggil = async (item) => {
    try {
      let latestData = item;
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, "visits", item.id);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error("Data tidak ditemukan!");
        latestData = { id: docSnap.id, ...docSnap.data() };
        const data = docSnap.data();
        if (data.petugas_aktif && data.petugas_aktif !== sessionStorage.getItem('namaPegawai')) {
             throw new Error(\`Pasien sedang ditangani oleh \${data.petugas_aktif}\`);
        }
        transaction.update(docRef, { petugas_aktif: sessionStorage.getItem('namaPegawai') || 'Petugas' });
      });
      setPasienAktif(latestData); setPesan(''); setKesimpulan(latestData.kesimpulan_dokter || ''); window.scrollTo({ top: 0, behavior: 'smooth' });
      try { await addDoc(collection(db, "panggilan_tv"), { pos: "POS 7", identitas_layar: item.nomor_antrian, teks_suara: \`Nomor antrean... \${item.nomor_antrian.replace(/-/g, ' ')}... Silakan menuju meja Dokter di Pos Tujuh.\`, waktu: serverTimestamp() }); } catch (e) {}
    } catch (e) {
      alert("⚠️ " + e.message);
    }
  };

  const handleSelesaikan = async (e) => {
    e.preventDefault(); if (!pasienAktif) return; setLoading(true); setPesan('');
    try {
      // 🚀 UBAH STATUS JADI SELESAI (Hilang dari semua antrean Pos)
      await updateDoc(doc(db, "visits", pasienAktif.id), { 
          status_antrian: STATUS_MAPPING.SELESAI, 
          dokter_pemeriksa: sessionStorage.getItem('namaPegawai') || 'Dokter/Petugas', 
          kesimpulan_dokter: kesimpulan,
          waktu_selesai: serverTimestamp(),
          petugas_aktif: null
      });
      setPesan(\`✅ Pemeriksaan Selesai! Pasien dapat melihat rapornya.\`); 
      setTimeout(() => {
          setPasienAktif(null);
          navigate('/dashboard');
      }, 1500); 
    } catch (error) { setPesan("❌ Gagal menyimpan data: " + error.message); } finally { setLoading(false); }
  };`;

// Also clean up any possible CRLF
code = code.replace(brokenChunk, fixedChunk);
if (!code.includes('handleSelesaikan')) {
    code = code.replace(/snapshot\.forEach\(doc => data\.push\(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\);\r?\n\s*try \{\r?\n\s*\/\/ 🚀 UBAH STATUS JADI SELESAI[\s\S]*?finally \{ setLoading\(false\); \}\r?\n\s*\};/, fixedChunk);
}

fs.writeFileSync('Pos7.jsx', code);
console.log('Restored Pos7.jsx correctly!');
