import { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Printer, Ticket } from 'lucide-react';

const LOGO_PINRANG = "/logo_pinrang.png";
const LOGO_MALIMPUNG = "/logo_malimpung.png";
import SyncStatusBanner from './components/system/SyncStatusBanner';
import { createQueueTicket } from './services/queueService';
import { updateActiveLocation } from './services/settingsService';

const WILAYAH_KERJA = {
  "Desa Malimpung": ["Dusun Malimpung", "Dusun Palita", "Dusun Pajalele"],
  "Desa Padang Loang": ["Dusun Banga", "Dusun Padang", "Dusun Palita"],
  "Kelurahan Maccirinna": ["Lingkungan Dioang", "Lingkungan Bulu Dua", "Lingkungan Paraungan"],
  "Luar Wilayah": ["Lainnya"]
};

const ESC = 0x1B; const GS = 0x1D; const CMD_INIT = [ESC, 0x40]; const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01]; const CMD_BOLD_ON = [ESC, 0x45, 0x01]; const CMD_BOLD_OFF = [ESC, 0x45, 0x00]; const CMD_TEXT_NORMAL = [GS, 0x21, 0x00]; const CMD_FONT_A = [ESC, 0x4D, 0x00]; const CMD_FONT_B = [ESC, 0x4D, 0x01]; const CMD_LINE_SPACING_TIGHT = [ESC, 0x33, 20]; const CMD_LINE_SPACING_DEFAULT = [ESC, 0x32]; const CMD_CUT_PAPER = [GS, 0x56, 0x42, 0x00]; const CMD_TINY_FEED = [ESC, 0x4A, 0x18]; 

function createImageFromText(text) {
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); canvas.width = 384; canvas.height = 160; 
  ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'black'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 120px "Segoe UI Semibold", Segoe, sans-serif'; ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 5);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); const pixels = imageData.data; const widthBytes = Math.ceil(canvas.width / 8); const imageBytes = new Uint8Array(widthBytes * canvas.height);
  for (let y = 0; y < canvas.height; y++) { for (let x = 0; x < canvas.width; x++) { const idx = (y * canvas.width + x) * 4; const isBlack = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3 < 128; if (isBlack) { const byteIndex = y * widthBytes + Math.floor(x / 8); const bitIndex = 7 - (x % 8); imageBytes[byteIndex] |= (1 << bitIndex); } } }
  const command = []; command.push(0x1D, 0x76, 0x30, 0x00); command.push(widthBytes & 0xFF, (widthBytes >> 8) & 0xFF); command.push(canvas.height & 0xFF, (canvas.height >> 8) & 0xFF); return [...command, ...imageBytes];
}

function Loket() {
  const [desaAktif, setDesaAktif] = useState("Desa Malimpung");
  const [dusunAktif, setDusunAktif] = useState("Dusun Malimpung");
  const [loading, setLoading] = useState(false);
  const [strukAktif, setStrukAktif] = useState(null); 
  const [lastTicket, setLastTicket] = useState(null);
  const [, setBtDevice] = useState(null); const [btCharacteristic, setBtCharacteristic] = useState(null); const [isBtConnected, setIsBtConnected] = useState(false);
  const [printerMessage, setPrinterMessage] = useState('');

  useEffect(() => {
    setDusunAktif(WILAYAH_KERJA[desaAktif][0]);
  }, [desaAktif]);

  // ==========================================
  // FITUR BARU: MENGIRIM LOKASI KE LAYAR TV
  // ==========================================
  useEffect(() => {
    const updateLokasiGlobal = async () => {
      try {
        await updateActiveLocation(dusunAktif);
        console.log("Lokasi berhasil disinkronkan ke TV:", dusunAktif);
      } catch (error) {
        console.error("Gagal sinkronisasi lokasi:", error);
      }
    };
    
    if (dusunAktif) {
        updateLokasiGlobal();
    }
  }, [dusunAktif]);

  const connectToPrinter = async () => {
    if (!navigator.bluetooth) {
      setPrinterMessage('Bluetooth printer hanya tersedia di browser yang mendukung Web Bluetooth, seperti Chrome di Android atau desktop.');
      return;
    }

    try {
      setPrinterMessage('Meminta izin Bluetooth dan mencari printer...');
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '49535343-fe7d-4ae5-8fa9-9fafd205e455'] });
      const server = await device.gatt.connect(); const services = await server.getPrimaryServices(); let writeableChar = null;
      for (const service of services) { const characteristics = await service.getCharacteristics(); for (const char of characteristics) { if (char.properties.write || char.properties.writeWithoutResponse) { writeableChar = char; break; } } if (writeableChar) break; }
      if (writeableChar) { setBtDevice(device); setBtCharacteristic(writeableChar); setIsBtConnected(true); setPrinterMessage(`Printer terhubung: ${device.name || 'Thermal Printer'}`); device.addEventListener('gattserverdisconnected', () => { setIsBtConnected(false); setBtDevice(null); setBtCharacteristic(null); setPrinterMessage("Printer Bluetooth terputus. Hubungkan kembali sebelum mencetak tiket."); }); } else { setPrinterMessage("Printer ditemukan, tetapi tidak memiliki akses tulis data. Coba printer lain atau gunakan cetak browser."); }
    } catch (error) {
      console.error(error);
      if (error.name === 'NotFoundError') {
        setPrinterMessage('Pemilihan printer dibatalkan. Pilih printer Bluetooth saat dialog muncul, atau gunakan cetak browser.');
      } else if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        setPrinterMessage('Aplikasi membutuhkan izin Bluetooth untuk mencetak tiket. Izinkan akses Bluetooth dari browser lalu coba lagi.');
      } else {
        setPrinterMessage('Gagal menghubungkan Bluetooth. Pastikan Chrome dan Bluetooth aktif, lalu coba lagi.');
      }
    }
  };

  const sendToPrinter = async (dataArray) => {
    if (!btCharacteristic) return; const uint8Array = new Uint8Array(dataArray); const CHUNK_SIZE = 100; 
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) { const chunk = uint8Array.slice(i, i + CHUNK_SIZE); await btCharacteristic.writeValue(chunk); }
  };

  const handleAmbilAntrian = async () => {
    setLoading(true);
    try {
      const tglHariIni = new Date().toISOString().split('T')[0];
      let kodeDesa = "A"; if(desaAktif === "Desa Padang Loang") kodeDesa = "B"; if(desaAktif === "Kelurahan Maccirinna") kodeDesa = "C"; if(desaAktif === "Luar Wilayah") kodeDesa = "Z";
      const { dataAntrian } = await createQueueTicket({
        tanggalPelaksanaan: tglHariIni,
        desaPelaksanaan: desaAktif,
        tempatPelaksanaan: dusunAktif,
        kodeDesa
      });
      const nomorBaru = dataAntrian.nomor_antrian;
      const waktuLengkap = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const dataStruk = { ...dataAntrian, waktu_cetak: waktuLengkap };
      setLastTicket(dataStruk);

      if (isBtConnected && btCharacteristic) {
          const encoder = new TextEncoder(); let receiptBytes = [];
          receiptBytes.push(...CMD_INIT); receiptBytes.push(...CMD_LINE_SPACING_TIGHT); receiptBytes.push(...CMD_ALIGN_CENTER);
          receiptBytes.push(...CMD_BOLD_ON); receiptBytes.push(...CMD_TEXT_NORMAL); receiptBytes.push(...encoder.encode("PUSKESMAS MALIMPUNG\n")); receiptBytes.push(...CMD_BOLD_OFF); receiptBytes.push(...CMD_FONT_B); receiptBytes.push(...encoder.encode("Layanan Cek Kesehatan Gratis\n")); receiptBytes.push(...encoder.encode("--------------------------------\n"));
		  receiptBytes.push(...CMD_FONT_A); receiptBytes.push(...encoder.encode("NOMOR ANTRIAN\n"));
          const imageBytes = createImageFromText(nomorBaru); receiptBytes.push(...imageBytes);
          receiptBytes.push(...CMD_TEXT_NORMAL); receiptBytes.push(...CMD_FONT_B); receiptBytes.push(...CMD_BOLD_ON); receiptBytes.push(...encoder.encode("MOHON SABAR MENUNGGU PANGGILAN\n")); receiptBytes.push(...encoder.encode("--------------------------------\n"));
		  receiptBytes.push(...CMD_BOLD_OFF); receiptBytes.push(...CMD_FONT_B); receiptBytes.push(...encoder.encode("Lokasi Pelaksanaan CKG:\n")); receiptBytes.push(...CMD_FONT_A); receiptBytes.push(...CMD_BOLD_ON); receiptBytes.push(...encoder.encode(`${dusunAktif}\n`)); receiptBytes.push(...CMD_BOLD_OFF); receiptBytes.push(...encoder.encode(`Tgl : ${tglHariIni}\n`)); receiptBytes.push(...encoder.encode(`Jam : ${waktuLengkap} WITA\n`)); receiptBytes.push(...encoder.encode("--------------------------------\n"));
          receiptBytes.push(...CMD_FONT_B); receiptBytes.push(...CMD_BOLD_ON); receiptBytes.push(...encoder.encode('"DEKAT MELAYANI, IKHLAS MENGABDI"\n'));
          receiptBytes.push(...CMD_LINE_SPACING_DEFAULT); receiptBytes.push(...CMD_TINY_FEED); receiptBytes.push(...CMD_CUT_PAPER);
          await sendToPrinter(receiptBytes); setPrinterMessage('Nomor antrean berhasil dicetak'); setLoading(false);
      } else {
          setStrukAktif(dataStruk);
          setTimeout(() => { window.print(); setPrinterMessage('Nomor antrean berhasil dicetak'); setLoading(false); setTimeout(() => setStrukAktif(null), 1000); }, 500);
      }
    } catch (error) { console.error("Error ambil antrian:", error); setPrinterMessage("Gagal mengambil antrian. Periksa koneksi internet, lalu coba lagi."); setLoading(false); }
  };

  return (
    <>
      <div className="loket-page print:hidden w-full min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900 flex flex-col items-center p-3 sm:p-6 relative overflow-y-auto pb-20">
        <div className="fixed left-3 top-[76px] z-50 hidden md:block">
          <SyncStatusBanner />
        </div>
        <div className="loket-wrapper">
        <div className="loket-card w-full max-w-[95%] sm:max-w-md md:max-w-xl bg-white rounded-2xl md:rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up border border-slate-100 mt-4 md:mt-0 mb-4">
          <div className="loket-hero bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 md:p-8 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 text-8xl md:text-9xl opacity-10 pointer-events-none transform rotate-12">🎟️</div>
              <div className="printer-control absolute top-4 right-4 z-20 flex items-center gap-2">
                  {!isBtConnected ? (
                     <button onClick={connectToPrinter} className="printer-btn bg-white/20 hover:bg-white/30 backdrop-blur border border-white/40 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 transition shadow-sm active:scale-95"><Printer className="h-4 w-4" aria-hidden="true" /> <span>Hubungkan Printer</span></button>
                  ) : (
                     <span className="printer-btn printer-ready bg-emerald-500/80 backdrop-blur border border-emerald-400 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm"><span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></span> Printer Siap</span>
                  )}
              </div>
              <div className="hero-logo-group loket-logo-row flex justify-center items-center gap-3 md:gap-4 mb-3 md:mb-5 relative z-10 mt-8 md:mt-0">
                  <div className="loket-logo-box bg-white p-2 rounded-xl shadow-md"><img src={LOGO_PINRANG} alt="Pinrang" className="h-8 md:h-12 w-auto object-contain" /></div>
                  <div className="loket-logo-dot w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/50"></div>
                  <div className="loket-logo-box bg-white p-2 rounded-xl shadow-md"><img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-8 md:h-12 w-auto object-contain" /></div>
              </div>
              <h1 className="loket-title text-xl sm:text-2xl md:text-3xl font-black tracking-widest relative z-10 drop-shadow-md">Loket Antrean</h1>
              <p className="loket-subtitle text-blue-200 font-bold mt-1 uppercase text-[10px] md:text-xs tracking-[0.2em] relative z-10">Puskesmas Malimpung</p>
          </div>

          <div className="info-section p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
              <div className="info-card location-info-card bg-blue-50/70 border border-blue-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center md:items-start gap-3">
                  <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-[#0080FF]" aria-hidden="true" />
                  <div>
                      <h3 className="info-label font-bold md:font-black text-blue-900 text-xs md:text-sm uppercase tracking-wider">Lokasi CKG Hari Ini</h3>
                      <p className="info-value hidden md:block">{dusunAktif}</p>
                      <p className="hidden md:block text-xs text-slate-500 font-medium mt-1 leading-relaxed">Silakan atur lokasi posyandu tempat pelaksanaan Cek Kesehatan Gratis untuk men-generate karcis antrian.</p>
                  </div>
              </div>

              {printerMessage && (
                  <div className={`loket-toast rounded-xl border px-3 py-2 text-xs font-bold ${printerMessage.includes('berhasil') || isBtConnected ? 'loket-toast-success border-emerald-200 bg-emerald-50 text-emerald-700' : 'loket-toast-warn border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {printerMessage}
                  </div>
              )}

              <div className="loket-status-grid grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="loket-status-card rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Lokasi Aktif</p>
                      <p className="mt-1 text-sm font-black leading-snug text-slate-800">{dusunAktif}</p>
                  </div>
                  <div className="loket-status-card loket-status-teal rounded-2xl border border-teal-200 bg-teal-50 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-700">Nomor Terakhir</p>
                      <p className="mt-1 text-2xl font-black leading-none text-slate-900">{lastTicket?.nomor_antrian || '-'}</p>
                  </div>
                  <div className={`loket-status-card ${isBtConnected ? 'loket-status-teal border-emerald-200 bg-emerald-50' : 'loket-status-amber border-amber-200 bg-amber-50'} rounded-2xl border p-3`}>
                      <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${isBtConnected ? 'text-emerald-700' : 'text-amber-700'}`}>Printer</p>
                      <p className="mt-1 text-sm font-black leading-snug text-slate-800">{isBtConnected ? 'Tersambung' : 'Cetak Browser'}</p>
                  </div>
              </div>

              <div className="section-spacing space-y-3 md:space-y-4">
                  <div>
                      <label className="loket-field-label block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 ml-1">Desa / Kelurahan</label>
                      <div className="relative">
                          <select value={desaAktif} onChange={(e) => setDesaAktif(e.target.value)} className="selector w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm md:text-lg py-2.5 px-3 md:p-4 rounded-lg md:rounded-xl appearance-none focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm">
                              {Object.keys(WILAYAH_KERJA).map(desa => ( <option key={desa} value={desa}>{desa}</option> ))}
                          </select>
                          <ChevronDown className="loket-select-icon pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px] md:text-xs">▼</div>
                      </div>
                  </div>

                  <div>
                      <label className="loket-field-label block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 ml-1">Dusun / Posyandu</label>
                      <div className="relative">
                          <select value={dusunAktif} onChange={(e) => setDusunAktif(e.target.value)} className="selector w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm md:text-lg py-2.5 px-3 md:p-4 rounded-lg md:rounded-xl appearance-none focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm">
                              {WILAYAH_KERJA[desaAktif].map(dusun => ( <option key={dusun} value={dusun}>{dusun}</option> ))}
                          </select>
                          <ChevronDown className="loket-select-icon pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px] md:text-xs">▼</div>
                      </div>
                  </div>
              </div>

              <button type="button" onClick={handleAmbilAntrian} disabled={loading} className="queue-btn w-full mt-2 md:mt-4 text-sm md:text-lg tracking-wider flex justify-center items-center gap-2 md:gap-3">
                {loading ? (<><span className="animate-spin text-lg md:text-xl">...</span> Memproses Antrean</>) : (<><Ticket className="h-5 w-5" aria-hidden="true" /> Ambil Nomor Antrean</>)}
              </button>

              {lastTicket && (
                  <div className="success-ticket rounded-2xl border border-teal-200 bg-teal-50 p-4 text-center shadow-sm">
                      <p className="info-label text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">Nomor Anda</p>
                      <p className="ticket-number mt-2 text-5xl font-black tracking-tight text-slate-900">{lastTicket.nomor_antrian}</p>
                      <p className="mt-2 text-sm font-bold text-slate-600">Silakan menunggu panggilan</p>
                      <p className="mt-2 text-xs font-bold text-slate-500">
                          {lastTicket.tempat_pelaksanaan} - {lastTicket.waktu_cetak} WITA
                      </p>
                  </div>
              )}
          </div>
        </div>
        <div className="loket-footer mt-4 md:mt-8 text-center text-slate-500 text-[9px] md:text-[10px] uppercase font-bold tracking-widest print:hidden">Sistem Loket Terpadu TERSANJUNG © 2026</div>
        </div>
      </div>
      {strukAktif && !isBtConnected && (
        <div className="hidden print:block w-full bg-white text-black font-sans text-center z-50">
            <style type="text/css" media="print">{`@page { size: 58mm auto; margin: 0; padding: 0; } body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .thermal-container { width: 52mm; margin: 0 auto; text-align: center; padding-top: 2mm; font-family: 'Courier New', Courier, monospace; color: black; line-height: 1.1; } .garis-putus { border-top: 1px dashed black; margin: 4px 0; } p { margin: 1px 0; }`}</style>
            <div className="thermal-container">
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>PUSKESMAS MALIMPUNG</h2><p style={{ fontSize: '10px' }}>Layanan Cek Kesehatan Gratis</p><div className="garis-putus"></div><p style={{ fontSize: '11px', marginTop: '4px' }}>NOMOR ANTRIAN</p>
                <h1 style={{ fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '66px', fontWeight: '900', margin: '8px 0', letterSpacing: '1px', transform: 'scaleY(1.3)', display: 'inline-block', lineHeight: '1' }}>{strukAktif.nomor_antrian}</h1>
                <div className="garis-putus" style={{ marginTop: '12px' }}></div><p style={{ fontSize: '10px', marginTop: '4px' }}>LOKASI PELAKSANAAN:</p><p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>{strukAktif.tempat_pelaksanaan}</p>
                <div style={{ textAlign: 'center', fontSize: '10px', margin: '2px 0' }}><p>Tgl : {strukAktif.tanggal_pelaksanaan}</p><p>Jam : {strukAktif.waktu_cetak} WITA</p></div><div className="garis-putus" style={{ marginTop: '4px' }}></div><p style={{ fontSize: '9px', marginTop: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>"Dekat Melayani, Ikhlas Mengabdi"</p><p style={{ fontSize: '9px' }}>Harap tunggu panggilan di Pos 1</p>
            </div>
        </div>
      )}
    </>
  );
}

export default Loket;

