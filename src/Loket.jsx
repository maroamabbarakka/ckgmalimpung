import { useState, useEffect } from 'react';
import { db } from './firebase'; 
// TAMBAHAN IMPORT: doc, setDoc
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc, runTransaction } from 'firebase/firestore';

const LOGO_PINRANG = "/logo_pinrang.png";
const LOGO_MALIMPUNG = "/logo_malimpung.png";
import { STATUS_MAPPING } from './utils/constants';

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
  const [, setBtDevice] = useState(null); const [btCharacteristic, setBtCharacteristic] = useState(null); const [isBtConnected, setIsBtConnected] = useState(false);

  useEffect(() => {
    setDusunAktif(WILAYAH_KERJA[desaAktif][0]);
  }, [desaAktif]);

  // ==========================================
  // FITUR BARU: MENGIRIM LOKASI KE LAYAR TV
  // ==========================================
  useEffect(() => {
    const updateLokasiGlobal = async () => {
      try {
        await setDoc(doc(db, "pengaturan", "lokasi_aktif"), {
          nama_lokasi: dusunAktif
        });
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
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '49535343-fe7d-4ae5-8fa9-9fafd205e455'] });
      const server = await device.gatt.connect(); const services = await server.getPrimaryServices(); let writeableChar = null;
      for (const service of services) { const characteristics = await service.getCharacteristics(); for (const char of characteristics) { if (char.properties.write || char.properties.writeWithoutResponse) { writeableChar = char; break; } } if (writeableChar) break; }
      if (writeableChar) { setBtDevice(device); setBtCharacteristic(writeableChar); setIsBtConnected(true); alert(`✅ Berhasil terhubung ke Printer: ${device.name || 'Thermal Printer'}`); device.addEventListener('gattserverdisconnected', () => { setIsBtConnected(false); setBtDevice(null); setBtCharacteristic(null); alert("⚠️ Printer Bluetooth terputus!"); }); } else { alert("❌ Printer tidak memiliki akses penulisan (Write) data."); }
    } catch (error) { console.error(error); alert("❌ Gagal menghubungkan Bluetooth. Pastikan Chrome & Bluetooth menyala."); }
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
      const q = query(collection(db, "visits"), where("tanggal_pelaksanaan", "==", tglHariIni), where("tempat_pelaksanaan", "==", dusunAktif));
      const querySnapshot = await getDocs(q);
      const counterId = `${tglHariIni}_${dusunAktif}`.replace(/[\\.#$[\]/]/g, "_");
      const counterRef = doc(db, "queue_counters", counterId);
      const nomorUrut = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const currentNumber = counterDoc.exists()
          ? Number(counterDoc.data().lastNumber || 0)
          : querySnapshot.size;
        const nextNumber = currentNumber + 1;
        transaction.set(counterRef, {
          tanggal_pelaksanaan: tglHariIni,
          tempat_pelaksanaan: dusunAktif,
          desa_pelaksanaan: desaAktif,
          lastNumber: nextNumber,
          updatedAt: serverTimestamp()
        }, { merge: true });
        return nextNumber;
      });
      const nomorBaru = `${kodeDesa}${String(nomorUrut).padStart(3, '0')}`;
      const waktuLengkap = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      const dataAntrian = { nomor_antrian: nomorBaru, status_antrian: STATUS_MAPPING.POS1, waktu_ambil_tiket: serverTimestamp(), tempat_pelaksanaan: dusunAktif, tanggal_pelaksanaan: tglHariIni, desa_pelaksanaan: desaAktif };
      await addDoc(collection(db, "visits"), dataAntrian);

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
          await sendToPrinter(receiptBytes); setLoading(false);
      } else {
          const dataStruk = { ...dataAntrian, waktu_cetak: waktuLengkap }; setStrukAktif(dataStruk);
          setTimeout(() => { window.print(); setLoading(false); setTimeout(() => setStrukAktif(null), 1000); }, 500);
      }
    } catch (error) { console.error("Error ambil antrian:", error); alert("❌ Gagal mengambil antrian. Periksa koneksi internet."); setLoading(false); }
  };

  return (
    <>
      <div className="print:hidden w-full min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900 flex flex-col items-center p-3 sm:p-6 relative overflow-y-auto pb-20">
        <div className="w-full max-w-[95%] sm:max-w-md md:max-w-xl bg-white rounded-2xl md:rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up border border-slate-100 mt-4 md:mt-0 mb-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 md:p-8 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 text-8xl md:text-9xl opacity-10 pointer-events-none transform rotate-12">🎟️</div>
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  {!isBtConnected ? (
                     <button onClick={connectToPrinter} className="bg-white/20 hover:bg-white/30 backdrop-blur border border-white/40 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 transition shadow-sm active:scale-95"><span className="text-[11px] md:text-xs">📡</span> <span>Hubungkan Printer</span></button>
                  ) : (
                     <span className="bg-emerald-500/80 backdrop-blur border border-emerald-400 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm"><span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></span> Printer Siap</span>
                  )}
              </div>
              <div className="flex justify-center items-center gap-3 md:gap-4 mb-3 md:mb-5 relative z-10 mt-8 md:mt-0">
                  <div className="bg-white p-2 rounded-xl shadow-md"><img src={LOGO_PINRANG} alt="Pinrang" className="h-8 md:h-12 w-auto object-contain" /></div>
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/50"></div>
                  <div className="bg-white p-2 rounded-xl shadow-md"><img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-8 md:h-12 w-auto object-contain" /></div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-widest relative z-10 drop-shadow-md">LOKET ANTRIAN</h1>
              <p className="text-blue-200 font-bold mt-1 uppercase text-[10px] md:text-xs tracking-[0.2em] relative z-10">Puskesmas Malimpung</p>
          </div>

          <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
              <div className="bg-blue-50/70 border border-blue-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center md:items-start gap-3">
                  <span className="text-xl md:text-2xl block drop-shadow-sm">📍</span>
                  <div>
                      <h3 className="font-bold md:font-black text-blue-900 text-xs md:text-sm uppercase tracking-wider">Lokasi CKG Hari Ini</h3>
                      <p className="hidden md:block text-xs text-slate-500 font-medium mt-1 leading-relaxed">Silakan atur lokasi posyandu tempat pelaksanaan Cek Kesehatan Gratis untuk men-generate karcis antrian.</p>
                  </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                  <div>
                      <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 ml-1">Desa / Kelurahan</label>
                      <div className="relative">
                          <select value={desaAktif} onChange={(e) => setDesaAktif(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm md:text-lg py-2.5 px-3 md:p-4 rounded-lg md:rounded-xl appearance-none focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm">
                              {Object.keys(WILAYAH_KERJA).map(desa => ( <option key={desa} value={desa}>{desa}</option> ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px] md:text-xs">▼</div>
                      </div>
                  </div>

                  <div>
                      <label className="block text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 ml-1">Dusun / Posyandu</label>
                      <div className="relative">
                          <select value={dusunAktif} onChange={(e) => setDusunAktif(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm md:text-lg py-2.5 px-3 md:p-4 rounded-lg md:rounded-xl appearance-none focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm">
                              {WILAYAH_KERJA[desaAktif].map(dusun => ( <option key={dusun} value={dusun}>{dusun}</option> ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px] md:text-xs">▼</div>
                      </div>
                  </div>
              </div>

              <button onClick={handleAmbilAntrian} disabled={loading} className="w-full mt-2 md:mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm sm:text-base md:text-lg tracking-wider py-3.5 md:py-5 rounded-xl md:rounded-2xl shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] md:shadow-[0_10px_25px_-10px_rgba(37,99,235,0.6)] hover:shadow-[0_15px_30px_-10px_rgba(37,99,235,0.8)] hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 md:hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 md:gap-3">
                  {loading ? ( <><span className="animate-spin text-lg md:text-xl">⏳</span> SEDANG MENCETAK...</> ) : ( <><span className="text-lg md:text-xl drop-shadow-md">🖨️</span> CETAK TIKET ANTRIAN</> )}
              </button>
          </div>
        </div>
        <div className="mt-4 md:mt-8 text-center text-slate-500 text-[9px] md:text-[10px] uppercase font-bold tracking-widest print:hidden">Sistem Loket Terpadu TERSANJUNG © 2026</div>
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
