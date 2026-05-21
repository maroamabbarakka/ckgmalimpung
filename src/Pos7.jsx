import { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { STATUS_MAPPING } from './utils/constants';

const extractValue = (posData, keywords, questionMap) => {
  if (!questionMap) questionMap = {};
  if (!posData) return null;
  const key = Object.keys(posData).find(k => {
    const keyText = k.toLowerCase();
    const questionText = String(questionMap[k] || '').toLowerCase();
    return keywords.some(kw => keyText.includes(kw) || questionText.includes(kw));
  });
  return key ? posData[key] : null;
};


const evalTensi = (td) => {
    if (!td || !td.includes('/')) return { status: 'Belum Diperiksa', tone: 'slate' };
    const sys = parseInt(td.split('/')[0]);
    if (isNaN(sys)) return { status: 'Data Invalid', tone: 'slate' };
    if (sys < 120) return { status: 'Normal', tone: 'emerald' };
    if (sys >= 120 && sys <= 139) return { status: 'Prehipertensi', tone: 'amber' };
    return { status: 'Hipertensi', tone: 'rose' };
};

const evalGula = (gds, gdp) => {
    if (gdp && String(gdp).trim() !== '') {
        const val = parseFloat(gdp); if (isNaN(val)) return { nilai: '-', status: 'Invalid', tone: 'slate' };
        if (val < 100) return { nilai: `${val} mg/dL`, status: 'Normal', tone: 'emerald' };
        if (val >= 100 && val <= 125) return { nilai: `${val} mg/dL`, status: 'Prediabetes', tone: 'amber' };
        return { nilai: `${val} mg/dL`, status: 'Diabetes', tone: 'rose' };
    }
    if (gds && String(gds).trim() !== '') {
        const val = parseFloat(gds); if (isNaN(val)) return { nilai: '-', status: 'Invalid', tone: 'slate' };
        if (val < 140) return { nilai: `${val} mg/dL`, status: 'Normal', tone: 'emerald' };
        if (val >= 140 && val <= 199) return { nilai: `${val} mg/dL`, status: 'Prediabetes', tone: 'amber' };
        return { nilai: `${val} mg/dL`, status: 'Diabetes', tone: 'rose' };
    }
    return { nilai: '-', status: 'Belum Diperiksa', tone: 'slate' };
};

const buildClinicalSummary = (visit) => {
    if (!visit) return [];

    const tensiField = extractValue(visit.pos2, ['sistolik'], visit.pos2_question_map || {}) ? `${extractValue(visit.pos2, ['sistolik'], visit.pos2_question_map || {})}/${extractValue(visit.pos2, ['diastolik'], visit.pos2_question_map || {})}` : '-';
    const tensiData = evalTensi(tensiField);
    
    const gds = extractValue(visit.pos2, ['gula darah sewaktu', 'gds'], visit.pos2_question_map || {}) || extractValue(visit.pos4, ['gula darah sewaktu', 'gds'], visit.pos4_question_map || {});
    const gdp = extractValue(visit.pos2, ['gula darah puasa', 'gdp'], visit.pos2_question_map || {}) || extractValue(visit.pos4, ['gula darah puasa', 'gdp'], visit.pos4_question_map || {});
    const gulaData = evalGula(gds, gdp);
    
    const imtValFull = extractValue(visit.pos2, ['imt'], visit.pos2_question_map || {}) || '-';
    let imtTone = 'slate'; let imtStatus = 'Belum Diperiksa';
    if (imtValFull !== '-') {
        if (imtValFull.includes('NORMAL')) { imtTone = 'emerald'; imtStatus = 'Ideal'; }
        else if (imtValFull.includes('GEMUK') || imtValFull.includes('OBESITAS')) { imtTone = 'rose'; imtStatus = 'Waspada'; }
        else { imtTone = 'amber'; imtStatus = 'Kurus'; }
    }
    
    const tbParuRaw = extractValue(visit.pos5, ['batuk', 'tb', 'tbc'], visit.pos5_question_map || {});
    let tbTone = 'emerald'; let tbStatus = 'Aman'; let tbVal = 'Aman'; // Default Rapor Cetak
    if (tbParuRaw && tbParuRaw.toLowerCase().includes('ya')) { 
        tbTone = 'rose'; tbStatus = 'Risiko'; tbVal = 'Suspek'; 
    }

    return [
        { icon: '❤️', label: 'Tensi', value: tensiField, status: tensiData.status, tone: tensiData.tone },
        { icon: '🩸', label: 'Gula Darah', value: gulaData.nilai.split(' ')[0], status: gulaData.status, tone: gulaData.tone },
        { icon: '⚖️', label: 'IMT / Gizi', value: imtValFull.split(' ')[0], status: imtStatus, tone: imtTone },
        { icon: '🫁', label: 'TB/Paru', value: tbVal, status: tbStatus, tone: tbTone },
    ];
};

const VoiceTextArea = ({ value, onChange, placeholder }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const valueRef = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onresult = (event) => {
        let currentFinal = "";
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript + " ";
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        
        if (currentFinal) {
           const prevVal = valueRef.current ? valueRef.current.trim() + " " : "";
           const newVal = prevVal + currentFinal.trim();
           valueRef.current = newVal;
           onChange(newVal);
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed' || event.error === 'network') {
            isListeningRef.current = false;
            setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
           try { recognition.start(); } catch(e) { isListeningRef.current = false; setIsListening(false); }
        } else {
           setIsListening(false);
           setInterimText("");
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
       if (recognitionRef.current) {
          recognitionRef.current.onend = null; 
          recognitionRef.current.stop();
       }
    };
  }, [onChange]);

  const toggleListen = () => {
    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current?.stop();
      setInterimText("");
    } else {
      if (recognitionRef.current) {
        try {
          isListeningRef.current = true;
          setIsListening(true);
          recognitionRef.current.start();
        } catch(e) { console.warn("Gagal memulai voice recognition:", e); }
      } else {
        alert("Browser Anda tidak mendukung fitur Voice Recognition.");
      }
    }
  };

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const displayValue = isListening && interimText ? (value ? value + " " + interimText : interimText) : value;

  return (
    <div className="relative w-full">
      <textarea 
        value={displayValue || ''} 
        onChange={(e) => {
           onChange(e.target.value);
           if (isListeningRef.current) toggleListen();
        }} 
        placeholder={isListening ? "Mendengarkan suara Anda..." : placeholder}
        className={`w-full bg-slate-50 border rounded-xl p-4 min-h-[150px] outline-none transition-all text-sm font-semibold text-slate-800 shadow-inner pb-14 ${isListening ? 'border-teal-500 ring-2 ring-teal-200 placeholder-teal-600' : 'border-slate-200 focus:ring-2 focus:ring-[#0f766e]'}`}
        required
      />
      {isSupported && (
        <button 
           type="button" 
           onClick={toggleListen}
           className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex justify-center items-center transition-all shadow-md ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#0f766e] text-white hover:bg-[#115e59]'}`}
           title="Dikte Suara"
        >
           {isListening ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="5" width="10" height="10" /></svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-2a5 5 0 01-10 0H3a7.001 7.001 0 006 6.93V17H6v2h8v-2h-3v-2z" clipRule="evenodd" /></svg>
           )}
        </button>
      )}
    </div>
  );
};


const RangkumanCardPos7 = ({ icon, title, value, status, tone }) => {
    let dotPos = 0; let barClass = 'from-slate-200 to-slate-300';
    if (tone === 'rose') { dotPos = 85; barClass = 'from-emerald-500 via-yellow-400 to-rose-500'; }
    else if (tone === 'amber') { dotPos = 60; barClass = 'from-emerald-500 via-yellow-400 to-rose-500'; }
    else if (tone === 'emerald') { dotPos = 25; barClass = 'from-emerald-500 via-yellow-400 to-rose-500'; }
    
    return (
        <div className="min-w-0 border border-slate-200 rounded-2xl p-3 md:p-4 bg-white flex flex-col justify-between h-full shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3 mb-4 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xl md:text-2xl shrink-0">{icon}</div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-wide leading-tight mb-1.5 break-words">{title}</h4>
                    <p className="text-base md:text-xl font-black text-slate-800 leading-tight break-words">{value}</p>
                    <p className={`text-[9px] md:text-[10px] font-black uppercase mt-1.5 leading-tight break-words ${tone === 'rose' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-slate-400'}`}>{status}</p>
                </div>
            </div>
            <div className={`w-full h-2 rounded-full bg-gradient-to-r ${barClass} relative mt-auto`}>
                {tone !== 'slate' && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-slate-700 rounded-full shadow-md transition-all" style={{ left: `calc(${dotPos}% - 8px)` }}></div>
                )}
            </div>
        </div>
    );
};

function Pos7() {
  const [antrian, setAntrian] = useState([]);
  const [pasienAktif, setPasienAktif] = useState(null);
  const [kesimpulan, setKesimpulan] = useState('');
  const [loading, setLoading] = useState(false); 
  const [pesan, setPesan] = useState('');
  const navigate = useNavigate();

  // 1. Tarik Pasien yang sudah selesai dari Pos 6
  useEffect(() => {
    const q = query(collection(db, "visits"), where("status_antrian", "in", [STATUS_MAPPING.POS7, 'Menunggu Pos 7', 'Antri Pos 7', 'Antre Pos 7', 'POS 7', 'Pos 7']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = []; 
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
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
        const rawRole = sessionStorage.getItem('rolePegawai') || '';
        const isAdmin = rawRole.includes('admin');
        if (!isAdmin && data.petugas_aktif && data.petugas_aktif !== sessionStorage.getItem('namaPegawai')) {
             throw new Error(`Pasien sedang ditangani oleh ${data.petugas_aktif}`);
        }
        transaction.update(docRef, { petugas_aktif: sessionStorage.getItem('namaPegawai') || 'Petugas' });
      });
      setPasienAktif(latestData); setPesan(''); setKesimpulan(latestData.kesimpulan_dokter || ''); window.scrollTo({ top: 0, behavior: 'smooth' });
      try { await addDoc(collection(db, "panggilan_tv"), { pos: "POS 7", identitas_layar: item.nomor_antrian, teks_suara: `Nomor antrean... ${item.nomor_antrian.replace(/-/g, ' ')}... Silakan menuju meja Dokter di Pos Tujuh.`, waktu: serverTimestamp() }); } catch (e) { console.warn("Gagal membuat panggilan TV Pos 7:", e); }
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
      setPesan(`✅ Pemeriksaan Selesai! Pasien dapat melihat rapornya.`); 
      setTimeout(() => {
          setPasienAktif(null);
          navigate('/dashboard');
      }, 1500); 
    } catch (error) { setPesan("❌ Gagal menyimpan data: " + error.message); } finally { setLoading(false); }
  };

  const handleBatal = async () => {
    if (pasienAktif?.id) {
      try { await updateDoc(doc(db, "visits", pasienAktif.id), { petugas_aktif: null }); }
      catch (error) { console.error("Gagal melepas pasien:", error); }
    }
    setPasienAktif(null);
  };

  const handleKembaliPosSebelumnya = async () => {
    if (!pasienAktif?.id || loading) return;
    const lanjut = window.confirm('Kembalikan pasien ke Pos 6? Kesimpulan dokter yang belum disimpan tidak akan dicatat.');
    if (!lanjut) return;
    setLoading(true);
    setPesan('');
    try {
      await updateDoc(doc(db, "visits", pasienAktif.id), {
        status_antrian: STATUS_MAPPING.POS6,
        petugas_aktif: null
      });
      setPasienAktif(null);
    } catch (error) {
      setPesan("❌ Gagal mengembalikan pasien: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (text) => {
    setKesimpulan(text);
  };

    const kirimWA = async () => {
      const nama = pasienAktif.pasien_snapshot?.nama || "Pasien";
      let noHp = pasienAktif.pasien_snapshot?.no_hp || pasienAktif.no_hp;
      if (!noHp && pasienAktif.patientNIK && !pasienAktif.patientNIK.startsWith('NONIK')) {
          try {
              const pDoc = await getDoc(doc(db, "patients", pasienAktif.patientNIK));
              if (pDoc.exists()) noHp = pDoc.data().phone || pDoc.data().no_hp;
          } catch(e) { console.warn("Gagal mengambil nomor HP pasien:", e); }
      }
      if(!noHp || noHp.length < 9) { alert("Nomor HP tidak valid/tidak ada di database."); return; }

      // Tarik Data Ringkas (Fallback Aman)
      const imt = extractValue(pasienAktif.pos2, ['imt', 'index massa tubuh'], pasienAktif.pos2_question_map) || '-';
      const sys = extractValue(pasienAktif.pos2, ['sistolik'], pasienAktif.pos2_question_map);
      const dia = extractValue(pasienAktif.pos2, ['diastolik'], pasienAktif.pos2_question_map);
      const tensiRes = sys && dia ? `${sys}/${dia}` : '-';
      
      let teks = `Halo ${nama},%0A%0ABerikut adalah ringkasan hasil Pemeriksaan Kesehatan Anda hari ini di Puskesmas:%0A`;
      teks += `-%20IMT/Gizi:%20${imt}%0A`;
      teks += `-%20Tensi:%20${tensiRes}%0A`;
      teks += `%0A*Kesimpulan Dokter:*%0A${kesimpulan || 'Dalam batas normal. Tetap jaga kesehatan.'}%0A%0A`;
      teks += `Untuk melihat dan mengunduh Rapor Digital lengkap Anda, silakan klik link berikut:%0A`;
      teks += `https://domain-anda.com/rapor/${pasienAktif.id}%0A%0A`;
      teks += `Salam Sehat,%0APuskesmas Malimpung`;

      // Bersihkan angka 0 di depan
      let hpFormat = noHp.replace(/\D/g, '');
      if (hpFormat.startsWith('0')) hpFormat = '62' + hpFormat.substring(1);

      window.open(`https://wa.me/${hpFormat}?text=${teks}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto mobile-safe-page px-2 md:px-0 font-sans">
      {!pasienAktif ? (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">POS 7: KESIMPULAN DOKTER ({antrian.length})</h3>
            {antrian.length === 0 ? (<div className="text-center py-16 opacity-50">☕ <p className="font-bold text-[10px] uppercase text-slate-400 mt-2">Tidak ada antrean</p></div>) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {antrian.map((item) => (
                <div key={item.id} onClick={() => handlePanggil(item)} className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-[#0f766e] group shadow-sm transition-all">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-[#0f766e]">Antrian</p>
                    <h3 className="text-3xl font-black text-slate-800 mb-3 group-hover:text-[#0f766e]">{item.nomor_antrian}</h3>
                    <div className="bg-slate-100 text-slate-600 text-[8px] font-black px-3 py-1 rounded uppercase tracking-widest">{item.kategori_usia_satusehat}</div>
                </div>
                ))}
            </div>
            )}
        </div>
      ) : (
      <div className="bg-slate-50 rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-[#0f766e] p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3"><span className="text-3xl">🩺</span><h2 className="text-4xl font-black">{pasienAktif.nomor_antrian}</h2></div>
            <button type="button" onClick={handleBatal} className="bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-white/30 transition-all">✕ Batal</button>
        </div>

        <form onSubmit={handleSelesaikan} className="p-4 md:p-6 bg-[#f8fafc] mobile-safe-page">
            {pesan && <div className={`p-4 rounded-xl font-bold text-xs shadow-sm mb-6 ${pesan.includes('❌') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{pesan}</div>}
            
            <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center mb-6">
                <div>
                   <h3 className="font-black text-lg">{pasienAktif.pasien_snapshot?.nama || "Tanpa Nama"}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{pasienAktif.umur_saat_periksa} THN • {pasienAktif.kategori_usia_satusehat}</p>
                </div>
                <a href={`/rapor/${pasienAktif.id}?petugas=${encodeURIComponent(sessionStorage.getItem('namaPegawai') || '')}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#0f766e] bg-teal-50 px-4 py-2 rounded-lg border border-teal-200 hover:bg-teal-100">📄 Lihat Draft Rapor</a>
            </div>

            <div className="bg-white rounded-[2rem] p-5 border border-slate-200 shadow-sm mb-6">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-black text-slate-800 flex items-center gap-2"><span>📌</span> Ringkasan Klinis</h4>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Review cepat</span>
              </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {buildClinicalSummary(pasienAktif).map(item => (
                  <RangkumanCardPos7 key={item.label} icon={item.icon} title={item.label} value={item.value} status={item.status} tone={item.tone} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-200 shadow-sm animate-fade-in-up">
              <h4 className="flex items-center gap-3 text-slate-800 font-black mb-5 border-b border-slate-100 pb-3"><span className="text-xl">✍️</span> Kesimpulan & Edukasi Dokter</h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { title: "Normal Sehat", text: 'Dalam batas normal. Tetap pertahankan pola hidup sehat dan kontrol rutin sesuai jadwal.' },
                  { title: "Edukasi Pola", text: 'Edukasi pola hidup sehat: kurangi garam, gula, dan lemak; tingkatkan aktivitas fisik bertahap.' },
                  { title: "Kontrol Ulang", text: 'Ditemukan faktor risiko. Anjurkan kontrol ulang dan pemantauan di Puskesmas.' },
                  { title: "Rujuk Spesialis", text: 'Perlu pemeriksaan lanjutan/rujukan sesuai indikasi klinis.' }
                ].map((tpl) => (
                  <button key={tpl.title} type="button" onClick={() => applyTemplate(tpl.text)} className="bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-slate-600 hover:text-teal-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-sm">
                    {tpl.title}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tuliskan hasil diagnosis, anjuran gaya hidup, atau instruksi rujukan.</p>
              <VoiceTextArea 
                 value={kesimpulan} 
                 onChange={(val) => setKesimpulan(val)} 
                 placeholder="Contoh: Pasien terindikasi Hipertensi Tahap 1. Anjuran: Kurangi konsumsi garam dan kontrol kembali minggu depan..." 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 sticky mobile-safe-submit z-40">
               <button type="button" onClick={handleKembaliPosSebelumnya} disabled={loading} className="w-full min-h-[60px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black rounded-2xl shadow-sm active:scale-95 transition-all text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-50">
                   ‹ Pos 6
               </button>
               <button type="button" onClick={kirimWA} className="w-full min-h-[60px] bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase flex items-center justify-center gap-2">
                   💬 Kirim WA
               </button>
               <button type="submit" disabled={loading} className="w-full min-h-[60px] bg-[#0f766e] hover:bg-[#115e59] text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase flex items-center justify-center gap-2">
                   {loading ? 'MENYIMPAN...' : '🏁 Selesai'}
               </button>
            </div>
        </form>
      </div>
      )}
    </div>
  );
}
export default Pos7;
