import { useState, useEffect, useMemo, useRef } from 'react';
import { DEFAULT_ACTIVE_LOCATION, subscribeActiveLocation } from './services/settingsService';
import { subscribeLatestTvQueueCall, subscribeTvQueueGrid } from './services/queueService';
import { subscribePublicTvQueueGrid } from './services/publicQueueService';
import { enterFullscreen, HEALTH_MESSAGES, sanitizePublicQueueItem } from './features/tv/tvService';

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
  const [internalAntrianGrid, setInternalAntrianGrid] = useState(null);

  const lastCallId = useRef(null);
  const initialLoadRef = useRef(true); 
  const callTimeoutRef = useRef(null);
  const tickerTrackRef = useRef(null);
  const tickerAnimationRef = useRef(null);
  const publicQueueTotal = useMemo(() => Object.values(antrianGrid).reduce((total, items) => total + items.length, 0), [antrianGrid]);
  const internalQueueTotal = useMemo(() => {
    if (!internalAntrianGrid) return 0;
    return Object.values(internalAntrianGrid).reduce((total, items) => total + items.length, 0);
  }, [internalAntrianGrid]);
  const displayGrid = internalQueueTotal > 0 ? internalAntrianGrid : antrianGrid;
  const antreanBerikutnya = useMemo(() => (
    Object.values(displayGrid)
      .flat()
      .sort((a, b) => (a.waktu_ambil_tiket?.toMillis?.() || 0) - (b.waktu_ambil_tiket?.toMillis?.() || 0))
      .slice(0, 8)
  ), [displayGrid]);
  const totalAntreanAktif = useMemo(() => Object.values(displayGrid).reduce((total, items) => total + items.length, 0), [displayGrid]);
  const tickerQueueText = useMemo(() => {
    if (!antreanBerikutnya.length) return 'Antrean berikutnya: belum ada antrean aktif';
    return `Antrean berikutnya: ${antreanBerikutnya.map((visit) => {
      const item = sanitizePublicQueueItem(visit);
      return `${item.nomorAntrian} menuju ${item.posTujuan}`;
    }).join(' | ')}`;
  }, [antreanBerikutnya]);

  const getCurrentCallForPos = (posName) => {
    if (!panggilanTerbaru?.identitas_layar || !panggilanTerbaru?.pos) return null;
    const normalize = (value) => String(value || '').replace(/\s+/g, '').toUpperCase();
    if (normalize(panggilanTerbaru.pos) !== normalize(posName)) return null;
    return {
      nomor_antrian: panggilanTerbaru.identitas_layar,
      isCurrentCall: true
    };
  };

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
      }, () => {
          setTvQueueError('Koneksi data antrean sedang tidak stabil. Menampilkan data terakhir yang tersedia.');
      });

      return () => unsubscribe();
  }, [isStarted]);

  useEffect(() => {
      if (!isStarted) return;

      const unsubscribe = subscribeTvQueueGrid((nextGrid) => {
          setInternalAntrianGrid(nextGrid);
          setLastSyncAt(new Date());
      }, () => {
          setInternalAntrianGrid(null);
      });

      return () => unsubscribe();
  }, [isStarted]);

  useEffect(() => {
      if (!isStarted) return undefined;

      const track = tickerTrackRef.current;
      if (!track) return undefined;

      let lastFrame = performance.now();
      let offset = 0;
      const speed = 120;

      const tick = (now) => {
          const deltaSeconds = Math.min((now - lastFrame) / 1000, 0.08);
          lastFrame = now;

          const loopWidth = track.scrollWidth / 2;
          if (loopWidth > 0) {
              offset = (offset + speed * deltaSeconds) % loopWidth;
              track.style.transform = `translate3d(${-offset}px, 0, 0)`;
          }

          tickerAnimationRef.current = requestAnimationFrame(tick);
      };

      track.style.transform = 'translate3d(0, 0, 0)';
      tickerAnimationRef.current = requestAnimationFrame(tick);

      return () => {
          if (tickerAnimationRef.current) cancelAnimationFrame(tickerAnimationRef.current);
          tickerAnimationRef.current = null;
      };
  }, [isStarted, tickerQueueText]);

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
  const BoxPos = ({ namaPos, theme, dataAntrian, currentCall }) => {
    const visibleQueue = dataAntrian.length > 0 ? dataAntrian : currentCall ? [currentCall] : [];
    const countLabel = visibleQueue.length.toString().padStart(2, '0');
    const currentNumber = visibleQueue[0]?.nomor_antrian || visibleQueue[0]?.queueNumber || '...';
    const nextNumbers = visibleQueue
      .slice(1, 3)
      .map((item) => item.nomor_antrian || item.queueNumber)
      .filter(Boolean);

    return (
      <div className="tv-pos-card relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]" style={{ borderColor: theme.border }}>
          <div className="flex flex-col items-center justify-center py-1.5 text-white shadow-sm" style={{ background: theme.solid }}>
              <h3 className="mt-0.5 text-2xl font-black leading-none tracking-widest lg:text-[28px]">{namaPos}</h3>
              <div className="mt-1 rounded-full bg-white/20 px-3 py-0.5 text-[9px] font-bold tracking-widest xl:text-[10px]">
                  {currentCall && dataAntrian.length === 0 ? 'DIPANGGIL' : `${countLabel} PASIEN`}
              </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-white px-3 py-3">
              {visibleQueue.length > 0 ? (
                  <>
                      {/* PENGGUNAAN FONT BEBAS NEUE */}
                      <h4 className="font-['Bebas_Neue'] text-[68px] font-normal leading-none tracking-normal drop-shadow-sm xl:text-[82px] 2xl:text-[98px]" style={{ color: theme.solid }}>
                          {currentNumber}
                      </h4>
                      <div className="flex min-h-[30px] w-full items-center justify-center">
                          {nextNumbers.length > 0 ? (
                              <div className="w-full truncate rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-center text-[10px] font-black uppercase tracking-widest text-amber-600 xl:text-[11px]">
                                  Berikut: {nextNumbers.join(', ')}
                              </div>
                          ) : !visibleQueue[0]?.nomor_antrian && !visibleQueue[0]?.queueNumber ? (
                              <div className="w-full truncate rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-center text-[10px] font-black uppercase tracking-widest text-sky-700 xl:text-[11px]">
                                  Sinkron nomor
                              </div>
                          ) : currentCall ? (
                              <div className="rounded-full bg-teal-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-700 xl:text-[11px]">
                                  Sedang dipanggil
                              </div>
                          ) : (
                              <div className="h-[28px]"></div>
                          )}
                      </div>
                  </>
              ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center opacity-55">
                      <span className="mb-2 text-5xl font-black leading-none text-slate-300">-</span>
                      <p className="font-bold text-[9px] uppercase tracking-widest text-slate-500 xl:text-[10px]">Antrean Kosong</p>
                  </div>
              )}
          </div>
      </div>
    );
  };

  return (
    <div className="tv-display-root h-screen w-screen overflow-hidden bg-[#eaf3f8] font-sans select-none cursor-default">
        {/* IMPORT FONT BEBAS NEUE DARI GOOGLE FONTS */}
        <style>
            {`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
              .tv-ticker-track {
                min-width: max-content;
                transform: translate3d(0,0,0);
                will-change: transform;
              }
              .tv-fullscreen-btn { opacity: .56; transition: all .18s ease; }
              .tv-fullscreen-btn:hover { opacity: 1; transform: translateY(-1px); }
              .tv-pos-card { transition: transform .18s ease, box-shadow .18s ease; }
              .tv-pos-card:has(h4) { box-shadow: 0 14px 34px rgba(15,23,42,.16); }
              .tv-mobile-guard { display: none; }
              @media (max-width: 767px) {
                .tv-display-shell { display: none !important; }
                .tv-mobile-guard {
                  display: flex;
                  height: 100vh;
                  width: 100vw;
                  align-items: center;
                  justify-content: center;
                  background: linear-gradient(180deg, #10233F 0%, #0C1B30 100%);
                  padding: 24px;
                  color: white;
                  text-align: center;
                }
              }`}
        </style>
        <div className="tv-mobile-guard">
            <div className="max-w-sm rounded-[28px] border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-md">
                <div className="mx-auto mb-5 flex items-center justify-center gap-4">
                    <img src={LOGO_PINRANG} alt="Pinrang" className="h-12 w-auto" />
                    <div className="h-10 w-px bg-white/25"></div>
                    <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-12 w-auto" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Layar Antrean TV</p>
                <h1 className="mt-2 text-2xl font-black uppercase tracking-tight">Gunakan Layar Besar</h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                    Mode TV dirancang untuk monitor, proyektor, atau perangkat landscape agar nomor antrean terbaca jelas oleh masyarakat.
                </p>
                <button
                    type="button"
                    onClick={() => enterFullscreen()}
                    className="mt-6 h-12 rounded-2xl bg-white px-5 text-xs font-black uppercase tracking-widest text-slate-900"
                >
                    Coba Fullscreen
                </button>
            </div>
        </div>
        <div className="tv-display-shell flex h-screen w-screen flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-[9vh] shrink-0 z-20 flex items-center justify-between bg-gradient-to-r from-[#0f766e] via-[#0080ff] to-[#2563eb] px-6 text-white shadow-md lg:px-10">
            <div className="flex flex-col">
                <h1 className="text-2xl 2xl:text-3xl font-black tracking-widest drop-shadow-md uppercase">LAYANAN CKG TERPADU</h1>
                <p className="text-[10px] 2xl:text-[11px] font-bold text-white/70 tracking-[0.2em] uppercase mt-1">DINAS KESEHATAN KAB. PINRANG - UPT PUSKESMAS MALIMPUNG</p>
            </div>
            
            <div className="flex items-center gap-6 2xl:gap-8">
                <button
                    type="button"
                    onClick={() => enterFullscreen()}
                    className="tv-fullscreen-btn rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-white/20"
                >
                    Fullscreen
                </button>
                <div className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest ${online ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {online ? 'Online' : 'Offline'}
                </div>
                <div className="text-right">
                    <p className="text-[9px] 2xl:text-[10px] font-bold text-white/70 tracking-[0.2em] uppercase mb-1">LOKASI PEMERIKSAAN</p>
                    <p className="text-sm 2xl:text-base font-black tracking-widest drop-shadow-md uppercase leading-none">{lokasiAktif}</p>
                </div>
                <div className="w-px h-10 bg-white/25"></div>
                <div className="text-right">
                    <p className="text-3xl 2xl:text-4xl font-black font-mono tracking-tighter drop-shadow-md leading-none">{waktuSekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    <p className="text-[10px] 2xl:text-[11px] font-bold text-white/70 uppercase tracking-widest mt-1">
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
        <main className="flex-1 flex flex-col p-3 xl:p-4 2xl:p-6 gap-3 xl:gap-4 2xl:gap-6 bg-[#eaf3f8] min-h-0">
            
            {/* Sektor Atas: Info Panggilan & Video Edukasi */}
            <div className="grid flex-1 grid-cols-2 gap-3 xl:gap-4 2xl:gap-6 min-h-0">
                
                {/* Kotak Kiri: Info Panggilan / Standby */}
                <div className="relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-3xl border border-white bg-white p-6 shadow-[0_18px_46px_rgba(48,64,80,.14)] xl:p-8">
                    {panggilanTerbaru ? (
                        <div className="text-center w-full animate-fade-in-up">
                            <p className="text-2xl font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Nomor Antrean</p>
                            
                            {/* PENGGUNAAN FONT BEBAS NEUE UNTUK PANGGILAN AKTIF */}
                            <h2 className="mb-4 font-['Bebas_Neue'] text-[176px] font-normal leading-none text-[#0080FF] drop-shadow-lg 2xl:text-[216px]">
                                {panggilanTerbaru.identitas_layar}
                            </h2>
                            
                            <div className="inline-block animate-pulse rounded-full bg-gradient-to-r from-[#18B6A4] to-[#0080FF] px-10 py-3 text-white shadow-lg">
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
                            
                            <h2 className="mb-2 text-6xl font-black tracking-tight text-[#304050]">TERSANJUNG</h2>
                            <p className="text-xl font-bold text-slate-400 uppercase tracking-[0.3em] mb-10">Sistem Informasi CKG</p>
                            
                            <div className="rounded-full border border-teal-100 bg-teal-50 px-10 py-3 shadow-inner">
                                <p className="font-bold text-teal-600 uppercase tracking-[0.2em] text-xs xl:text-sm animate-pulse">
                                    Menunggu Panggilan Pasien...
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Kotak Kanan: Video edukasi dibuat dominan; info ringkas masuk running text bawah. */}
                <div className="relative min-h-0 min-w-0 overflow-hidden rounded-3xl bg-black shadow-xl">
                    <video
                        src={VIDEO_PLAYLIST[currentVideoIndex]}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted
                        playsInline
                        onEnded={() => setCurrentVideoIndex((prev) => (prev + 1) % VIDEO_PLAYLIST.length)}
                    />
                    <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.45)]"></div>
                </div>
            </div>

            {/* Sektor Bawah: Grid 7 Kotak POS Sejajar */}
            <div className="grid h-[33%] min-h-[186px] shrink-0 grid-cols-7 gap-2 xl:h-[36%] xl:gap-3 2xl:gap-4">
                <BoxPos namaPos="POS 1" dataAntrian={displayGrid.pos1} currentCall={getCurrentCallForPos('POS 1')} theme={{ solid: '#0080FF', border: '#BAE1FF' }} />
                <BoxPos namaPos="POS 2" dataAntrian={displayGrid.pos2} currentCall={getCurrentCallForPos('POS 2')} theme={{ solid: '#4F46E5', border: '#C7D2FE' }} />
                <BoxPos namaPos="POS 3" dataAntrian={displayGrid.pos3} currentCall={getCurrentCallForPos('POS 3')} theme={{ solid: '#DB2777', border: '#FBCFE8' }} />
                <BoxPos namaPos="POS 4" dataAntrian={displayGrid.pos4} currentCall={getCurrentCallForPos('POS 4')} theme={{ solid: '#7C3AED', border: '#DDD6FE' }} />
                <BoxPos namaPos="POS 5" dataAntrian={displayGrid.pos5} currentCall={getCurrentCallForPos('POS 5')} theme={{ solid: '#8B5CF6', border: '#DDD6FE' }} />
                <BoxPos namaPos="POS 6" dataAntrian={displayGrid.pos6} currentCall={getCurrentCallForPos('POS 6')} theme={{ solid: '#0891B2', border: '#A5F3FC' }} />
                <BoxPos namaPos="POS 7" dataAntrian={displayGrid.pos7} currentCall={getCurrentCallForPos('POS 7')} theme={{ solid: '#059669', border: '#A7F3D0' }} />
            </div>

        </main>

        {/* FOOTER */}
        <footer className="relative z-20 flex h-[9vh] min-h-[70px] shrink-0 items-center overflow-hidden border-t-4 border-slate-700 bg-[#0f172a]">
            <div className="flex h-full w-full items-center bg-[#0f172a] px-4">
                <div ref={tickerTrackRef} className="tv-ticker-track flex w-max items-center whitespace-nowrap text-lg font-black tracking-widest xl:text-xl 2xl:text-2xl">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="flex items-center">
                            <span className="text-pink-300">SELAMAT DATANG DI PUSKESMAS MALIMPUNG</span>
                            <span className="mx-8 text-slate-600">|</span>
                            <span className="text-teal-400">Mohon siapkan Kartu Identitas (KTP/KK) atau Kartu BPJS Anda.</span>
                            <span className="mx-8 text-slate-600">|</span>
                            <span className="text-white">{tickerQueueText}</span>
                            <span className="mx-8 text-slate-600">|</span>
                            <span className="text-cyan-300">Edukasi: {HEALTH_MESSAGES.join('  |  ')}</span>
                            <span className="mx-8 text-slate-600">|</span>
                            <span className="text-emerald-400">PUSKESMAS MALIMPUNG - Dekat Melayani, Ikhlas Mengabdi</span>
                            <span className="mx-8 text-slate-600">|</span>
                        </div>
                    ))}
                </div>
            </div>
        </footer>
        </div>

    </div>
  );
}

export default TvDisplay;
