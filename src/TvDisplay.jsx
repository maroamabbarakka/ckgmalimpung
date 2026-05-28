import { useState, useEffect, useMemo, useRef } from 'react';
import { DEFAULT_ACTIVE_LOCATION, subscribeActiveLocation } from './services/settingsService';
import { subscribeLatestTvQueueCall } from './services/queueService';
import { subscribePublicTvQueueGrid } from './services/publicQueueService';
import { enterFullscreen } from './features/tv/tvService';
import { HealthEducationPanel } from './features/tv/HealthEducationPanel';
import { QueueTicker } from './features/tv/QueueTicker';

const LOGO_PINRANG = "/logo_pinrang.png";
const LOGO_MALIMPUNG = "/logo_malimpung.png";

// ==========================================
// 🎞️ PLAYLIST VIDEO EDUKASI CLOUDINARY
// ==========================================
const VIDEO_PLAYLIST = [
  "https://res.cloudinary.com/dljbgniko/video/upload/q_auto,f_auto/v1778190671/ILM_Pencegahan_Stunting_30_Detik_cdp7s2.mp4",
  "https://res.cloudinary.com/dljbgniko/video/upload/q_auto,f_auto/v1778190668/ILM_Deteksi_Dini_PTM_untuk_Orang_Tua_Versi_15_Detik_ukot7g.mp4",
  "https://res.cloudinary.com/dljbgniko/video/upload/q_auto,f_auto/v1778190668/ILM_Deteksi_Dini_PTM_untuk_Lansia_Versi_15_Detik_yljdyc.mp4",
  "https://res.cloudinary.com/dljbgniko/video/upload/q_auto,f_auto/v1778190668/ILM_Deteksi_Dini_PTM_untuk_Suami_Versi_15_Detik_hapejh.mp4",
  "https://res.cloudinary.com/dljbgniko/video/upload/q_auto,f_auto/v1778190667/ILM_Deteksi_Dini_PTM_untuk_Istri_Versi_15_Detik_rqb7l8.mp4",
  "https://res.cloudinary.com/dljbgniko/video/upload/q_auto,f_auto/v1778190655/ILM_Anti_Rokok_15_Detik_fugs8w.mp4"
];

function TvDisplay() {
  const [waktuSekarang, setWaktuSekarang] = useState(new Date());
  const [isStarted, setIsStarted] = useState(false); 
  const [panggilanTerbaru, setPanggilanTerbaru] = useState(null);
  const [audioMessage, setAudioMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); 
  const [lokasiAktif, setLokasiAktif] = useState(DEFAULT_ACTIVE_LOCATION);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [tvQueueError, setTvQueueError] = useState('');
  const [antrianGrid, setAntrianGrid] = useState({
      pos1: [], pos2: [], pos3: [], pos4: [], pos5: [], pos6: [], pos7: []
  });

  const lastCallId = useRef(null);
  const initialLoadRef = useRef(true); 
  const callTimeoutRef = useRef(null);
  const antreanBerikutnya = useMemo(() => (
    Object.values(antrianGrid)
      .flat()
      .sort((a, b) => (a.waktu_ambil_tiket?.toMillis?.() || 0) - (b.waktu_ambil_tiket?.toMillis?.() || 0))
      .slice(0, 8)
  ), [antrianGrid]);
  const totalAntreanAktif = useMemo(() => Object.values(antrianGrid).reduce((total, items) => total + items.length, 0), [antrianGrid]);

  // 1. JAM DIGITAL REAL-TIME
  useEffect(() => {
    const timer = setInterval(() => setWaktuSekarang(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    return subscribeActiveLocation(setLokasiAktif);
  }, []);

  // 2. LISTENER PANGGILAN TV (Voice Announcer)
  useEffect(() => {
    if (!isStarted) return; 

    const unsubscribe = subscribeLatestTvQueueCall((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const docId = change.doc.id;

          if (lastCallId.current !== docId) {
             lastCallId.current = docId;
             if (initialLoadRef.current) {
                 const waktuPanggil = data.waktu?.toMillis() || 0;
                 const sekarang = new Date().getTime();
                 if (sekarang - waktuPanggil < 60000) eksekusiPanggilan(data);
             } else {
                 eksekusiPanggilan(data);
             }
          }
        }
      });
      initialLoadRef.current = false; 
    });

    return () => unsubscribe();
  }, [isStarted]);

  const eksekusiPanggilan = (data) => {
      setPanggilanTerbaru(data);
      putarBelSynthesizerLaluBicara(data.teks_suara);
      
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = setTimeout(() => setPanggilanTerbaru(null), 12000);
  };

  // 3. LISTENER SISA ANTREAN (Sinkronisasi Loket Multi-String)
  useEffect(() => {
      if (!isStarted) return;

      const unsubscribe = subscribePublicTvQueueGrid((nextGrid) => {
          setAntrianGrid(nextGrid);
          setLastSyncAt(new Date());
          setTvQueueError('');
      }, (error) => {
          console.error('Gagal memuat antrean TV:', error);
          setTvQueueError('Koneksi data antrean sedang tidak stabil. Menampilkan data terakhir yang tersedia.');
      });

      return () => unsubscribe();
  }, [isStarted]);

  // --- LOGIKA: SYNTHESIZER BEL ---
  const putarBelSynthesizerLaluBicara = (teks) => {
      if ('speechSynthesis' in window) {
          setAudioMessage('');
          window.speechSynthesis.cancel(); 
          try {
              const AudioContext = window.AudioContext || window.webkitAudioContext;
              const audioCtx = new AudioContext();
              const playNote = (frequency, startTime) => {
                  const oscillator = audioCtx.createOscillator();
                  const gainNode = audioCtx.createGain();
                  oscillator.type = 'sine'; 
                  oscillator.frequency.value = frequency;
                  gainNode.gain.setValueAtTime(0, startTime);
                  gainNode.gain.linearRampToValueAtTime(0.6, startTime + 0.05); 
                  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5); 
                  oscillator.connect(gainNode);
                  gainNode.connect(audioCtx.destination);
                  oscillator.start(startTime);
                  oscillator.stop(startTime + 1.5);
              };

              const now = audioCtx.currentTime;
              playNote(783.99, now);
              playNote(659.25, now + 0.5);
              setTimeout(() => suaraAI(teks), 1500);
          } catch (e) {
              setAudioMessage('Suara otomatis belum aktif. Pastikan audio browser diizinkan, lalu aktifkan ulang layar TV.');
              suaraAI(teks); 
          }
      } else {
          setAudioMessage('Browser ini belum mendukung suara otomatis untuk panggilan antrean.');
      }
  };

  const suaraAI = (teks) => {
      const msg = new SpeechSynthesisUtterance();
      msg.lang = 'id-ID'; 
      msg.text = teks; 
      msg.rate = 0.85; 
      
      const voices = window.speechSynthesis.getVoices();
      const indoVoice = voices.find(voice => voice.lang.includes('id') && voice.name.toLowerCase().includes('female'));
      if (indoVoice) msg.voice = indoVoice;
      window.speechSynthesis.speak(msg);
  };

  // --- LAYAR SPLASH AWAL ---
  if (!isStarted) {
      return (
          <div className="h-screen w-screen bg-slate-900 flex flex-col justify-center items-center text-white z-[999] absolute top-0 left-0">
              <div className="bg-white/10 p-10 rounded-3xl backdrop-blur-md text-center border border-white/20 max-w-xl animate-fade-in-up">
                  <div className="flex justify-center gap-6 mb-8 opacity-80">
                      <img src={LOGO_PINRANG} alt="Pinrang" className="h-20 w-auto" />
                      <div className="w-px h-20 bg-white/30 rounded-full"></div>
                      <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-20 w-auto" />
                  </div>
                  <h1 className="text-3xl font-black mb-4 uppercase tracking-widest text-teal-400">Layar TV TERSANJUNG</h1>
                  <p className="text-slate-300 mb-8 leading-relaxed">Sistem Bel Digital dan Voice Announcer siap digunakan. Silakan klik tombol di bawah untuk mengaktifkan Layar.</p>
                  {audioMessage && (
                      <p className="mb-4 rounded-2xl border border-amber-300/50 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
                          {audioMessage}
                      </p>
                  )}
                  <button 
                      onClick={() => {
                          setIsStarted(true);
                          putarBelSynthesizerLaluBicara("Layar antrean telah diaktifkan.");
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white text-xl font-black px-10 py-5 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:scale-105"
                  >
                      AKTIFKAN LAYAR TV SEKARANG
                  </button>
              </div>
          </div>
      );
  }

  // --- KOMPONEN KOTAK ANTREAN ---
  const BoxPos = ({ namaPos, headerClass, textClass, borderClass, dataAntrian }) => (
      <div className={`bg-white rounded-xl flex flex-col h-full overflow-hidden shadow-lg border-b-[10px] ${borderClass} relative`}>
          <div className={`${headerClass} text-white flex flex-col items-center justify-center py-2 shadow-sm`}>
              <h3 className="font-black text-2xl lg:text-3xl tracking-widest leading-none mt-1">{namaPos}</h3>
              <div className="bg-white/20 px-3 py-0.5 rounded-full text-[9px] xl:text-[10px] font-bold tracking-widest mt-1 mb-1">
                  {dataAntrian.length.toString().padStart(2, '0')} PASIEN
              </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center p-2 bg-white">
              {dataAntrian.length > 0 ? (
                  <>
                      {/* PENGGUNAAN FONT BEBAS NEUE */}
                      <h4 className={`text-[85px] xl:text-[100px] 2xl:text-[120px] font-normal ${textClass} font-['Bebas_Neue'] tracking-normal leading-none mt-4 mb-2 drop-shadow-sm`}>
                          {dataAntrian[0].nomor_antrian}
                      </h4>
                      {dataAntrian.length > 1 ? (
                          <div className="border border-amber-400 text-amber-500 px-2 py-0.5 rounded-full text-[8px] xl:text-[9px] font-black uppercase tracking-widest truncate w-[95%] text-center mb-1 bg-amber-50">
                              Menyusul: {dataAntrian.slice(1, 3).map(v => v.nomor_antrian).join(', ')}
                          </div>
                      ) : (
                           <div className="h-5 mb-1"></div> 
                      )}
                  </>
              ) : (
                  <div className="text-center opacity-30 flex flex-col items-center justify-center h-full">
                      <span className="mb-3 h-8 w-8 rounded-full border-4 border-slate-300 bg-slate-100 shadow-inner"></span>
                      <p className="font-bold text-[9px] xl:text-[10px] text-slate-500 uppercase tracking-widest">Antrean Kosong</p>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="h-screen w-screen bg-[#e2e8f0] flex flex-col overflow-hidden font-sans select-none cursor-default">
        {/* IMPORT FONT BEBAS NEUE DARI GOOGLE FONTS */}
        <style>
            {`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
              @keyframes tvTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
              .tv-ticker-track { animation: tvTicker 38s linear infinite; }`}
        </style>
        
        {/* HEADER */}
        <header className="bg-[#009288] text-white h-[9vh] flex justify-between items-center px-6 lg:px-10 shadow-md shrink-0 z-20">
            <div className="flex flex-col">
                <h1 className="text-2xl 2xl:text-3xl font-black tracking-widest drop-shadow-md uppercase">LAYANAN CKG TERPADU</h1>
                <p className="text-[10px] 2xl:text-[11px] font-bold text-teal-200 tracking-[0.2em] uppercase mt-1">DINAS KESEHATAN KAB. PINRANG - UPT PUSKESMAS MALIMPUNG</p>
            </div>
            
            <div className="flex items-center gap-6 2xl:gap-8">
                <button
                    type="button"
                    onClick={() => enterFullscreen()}
                    className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20"
                >
                    Fullscreen
                </button>
                <div className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest ${online ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {online ? 'Online' : 'Offline'}
                </div>
                <div className="text-right">
                    <p className="text-[9px] 2xl:text-[10px] font-bold text-teal-200 tracking-[0.2em] uppercase mb-1">LOKASI PEMERIKSAAN</p>
                    <p className="text-sm 2xl:text-base font-black tracking-widest drop-shadow-md uppercase leading-none">{lokasiAktif}</p>
                </div>
                <div className="w-px h-10 bg-teal-600"></div>
                <div className="text-right">
                    <p className="text-3xl 2xl:text-4xl font-black font-mono tracking-tighter drop-shadow-md leading-none">{waktuSekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    <p className="text-[10px] 2xl:text-[11px] font-bold text-teal-200 uppercase tracking-widest mt-1">
                        {waktuSekarang.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>
        </header>
        {audioMessage && (
            <div className="absolute left-1/2 top-[10vh] z-30 -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-sm font-black text-amber-800 shadow-lg">
                {audioMessage}
            </div>
        )}
        <section className={`flex min-h-[5vh] shrink-0 items-center justify-between gap-4 px-6 lg:px-10 text-xs font-black uppercase tracking-widest shadow-inner ${online && !tvQueueError ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
            <div className="flex min-w-0 items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${online && !tvQueueError ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                <span className="truncate">
                    {tvQueueError || (totalAntreanAktif > 0 ? `${totalAntreanAktif} antrean aktif sedang dipantau` : 'Tidak ada antrean aktif. Layar tetap siaga.')}
                </span>
            </div>
            <div className="shrink-0 text-right">
                Sinkron terakhir: {lastSyncAt ? lastSyncAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Menunggu data'}
            </div>
        </section>

        {/* MAIN LAYOUT */}
        <main className="flex-1 flex flex-col p-3 xl:p-4 2xl:p-6 gap-3 xl:gap-4 2xl:gap-6 bg-[#e2e8f0] min-h-0">
            
            {/* Sektor Atas: Info Panggilan & Video Edukasi */}
            <div className="grid flex-1 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-3 xl:gap-4 2xl:gap-6 min-h-0">
                
                {/* Kotak Kiri: Info Panggilan / Standby */}
                <div className="bg-white rounded-3xl shadow-xl border border-white flex flex-col justify-center items-center p-6 xl:p-8 relative overflow-hidden min-w-0">
                    {panggilanTerbaru ? (
                        <div className="text-center w-full animate-fade-in-up">
                            <p className="text-2xl font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Nomor Antrean</p>
                            
                            {/* PENGGUNAAN FONT BEBAS NEUE UNTUK PANGGILAN AKTIF */}
                            <h2 className="text-[180px] 2xl:text-[220px] font-normal text-[#009288] leading-none font-['Bebas_Neue'] mb-4 drop-shadow-lg">
                                {panggilanTerbaru.identitas_layar}
                            </h2>
                            
                            <div className="bg-[#009288] text-white py-3 px-10 rounded-full inline-block shadow-lg animate-pulse">
                                <h3 className="text-3xl font-black tracking-widest uppercase">MENUJU {panggilanTerbaru.pos}</h3>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center flex flex-col items-center justify-center w-full animate-fade-in-up">
                            <div className="flex items-center justify-center gap-6 mb-6">
                                <img src={LOGO_PINRANG} alt="Logo Pinrang" className="h-24 w-auto drop-shadow-sm" />
                                <div className="w-px h-16 bg-slate-200"></div>
                                <img src={LOGO_MALIMPUNG} alt="Logo Malimpung" className="h-24 w-auto drop-shadow-sm" />
                            </div>
                            
                            <h2 className="text-6xl font-black text-[#009288] mb-2 tracking-tight">TERSANJUNG</h2>
                            <p className="text-xl font-bold text-slate-400 uppercase tracking-[0.3em] mb-10">Sistem Informasi CKG</p>
                            
                            <div className="px-10 py-3 bg-teal-50 border border-teal-100 rounded-full shadow-inner">
                                <p className="font-bold text-teal-600 uppercase tracking-[0.2em] text-xs xl:text-sm animate-pulse">
                                    Menunggu Panggilan Pasien...
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Kotak Kanan: Video, edukasi, dan antrean berikutnya */}
                <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 xl:grid-cols-5 xl:grid-rows-none xl:gap-4 2xl:gap-6">
                    <div className="hidden bg-black rounded-3xl shadow-xl overflow-hidden relative items-center justify-center min-h-0 xl:col-span-3 xl:flex">
                        <video 
                            src={VIDEO_PLAYLIST[currentVideoIndex]} 
                            className="w-full h-full object-cover"
                            autoPlay 
                            muted 
                            playsInline
                            onEnded={() => setCurrentVideoIndex((prev) => (prev + 1) % VIDEO_PLAYLIST.length)} 
                        />
                        <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] pointer-events-none"></div>
                    </div>
                    <div className="flex min-h-0 flex-col gap-3 xl:col-span-2 xl:gap-4 2xl:gap-6">
                        <HealthEducationPanel />
                        <div className="min-h-0 flex-1 overflow-hidden">
                            <QueueTicker visits={antreanBerikutnya} limit={6} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sektor Bawah: Grid 7 Kotak POS Sejajar */}
            <div className="h-[35%] xl:h-[38%] min-h-[190px] shrink-0 grid grid-cols-7 gap-2 xl:gap-3 2xl:gap-4">
                <BoxPos namaPos="POS 1" dataAntrian={antrianGrid.pos1} headerClass="bg-[#2563eb]" textClass="text-[#2563eb]" borderClass="border-[#2563eb]" />
                <BoxPos namaPos="POS 2" dataAntrian={antrianGrid.pos2} headerClass="bg-[#4f46e5]" textClass="text-[#4f46e5]" borderClass="border-[#4f46e5]" />
                <BoxPos namaPos="POS 3" dataAntrian={antrianGrid.pos3} headerClass="bg-[#e11d48]" textClass="text-[#e11d48]" borderClass="border-[#e11d48]" />
                <BoxPos namaPos="POS 4" dataAntrian={antrianGrid.pos4} headerClass="bg-[#0f766e]" textClass="text-[#0f766e]" borderClass="border-[#0f766e]" />
                <BoxPos namaPos="POS 5" dataAntrian={antrianGrid.pos5} headerClass="bg-[#059669]" textClass="text-[#059669]" borderClass="border-[#059669]" />
                <BoxPos namaPos="POS 6" dataAntrian={antrianGrid.pos6} headerClass="bg-[#0284c7]" textClass="text-[#0284c7]" borderClass="border-[#0284c7]" />
                <BoxPos namaPos="POS 7" dataAntrian={antrianGrid.pos7} headerClass="bg-[#0ea5e9]" textClass="text-[#0ea5e9]" borderClass="border-[#0ea5e9]" />
            </div>

        </main>

        {/* FOOTER */}
        <footer className="bg-[#0f172a] h-[8vh] flex items-center shrink-0 relative z-20 overflow-hidden border-t-4 border-slate-700">
            <div className="w-full h-full flex items-center bg-[#0f172a] px-4">
                <div className="tv-ticker-track flex w-max whitespace-nowrap pt-1 text-xl font-black tracking-widest xl:text-2xl">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="flex items-center">
                            <span className="text-pink-300">SELAMAT DATANG DI PUSKESMAS MALIMPUNG</span>
                            <span className="mx-8 text-slate-600">|</span>
                            <span className="text-teal-400">Mohon siapkan Kartu Identitas (KTP/KK) atau Kartu BPJS Anda.</span>
                            <span className="mx-8 text-slate-600">|</span>
                            <span className="text-white">Layanan CKG mencakup: Tensi, Gula Darah, Kolesterol, Asam Urat, Skrining Penyakit.</span>
                            <span className="mx-8 text-slate-600">|</span>
                            <span className="text-emerald-400">PUSKESMAS MALIMPUNG - Dekat Melayani, Ikhlas Mengabdi</span>
                            <span className="mx-8 text-slate-600">|</span>
                        </div>
                    ))}
                </div>
            </div>
        </footer>

    </div>
  );
}

export default TvDisplay;
