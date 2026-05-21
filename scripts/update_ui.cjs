const fs = require('fs');

let code = fs.readFileSync('Pos7.jsx', 'utf8');

const tOld = `              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  'Dalam batas normal. Tetap pertahankan pola hidup sehat dan kontrol rutin sesuai jadwal.',
                  'Edukasi pola hidup sehat: kurangi garam, gula, dan lemak; tingkatkan aktivitas fisik bertahap.',
                  'Ditemukan faktor risiko. Anjurkan kontrol ulang dan pemantauan di Puskesmas.',
                  'Perlu pemeriksaan lanjutan/rujukan sesuai indikasi klinis.'
                ].map((text, index) => (
                  <button key={text} type="button" onClick={() => applyTemplate(text)} className="bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-slate-600 hover:text-teal-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                    Template {index + 1}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tuliskan hasil diagnosis, anjuran gaya hidup, atau instruksi rujukan.</p>
              <textarea 
                 value={kesimpulan} 
                 onChange={(e) => setKesimpulan(e.target.value)} 
                 placeholder="Contoh: Pasien terindikasi Hipertensi Tahap 1. Anjuran: Kurangi konsumsi garam dan kontrol kembali minggu depan..." 
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[150px] outline-none focus:ring-2 focus:ring-[#0f766e] text-sm font-semibold text-slate-800"
                 required
              />`;

const tOldWindows = tOld.replace(/\n/g, '\r\n');

const tNew = `              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { title: "Normal Sehat", text: 'Dalam batas normal. Tetap pertahankan pola hidup sehat dan kontrol rutin sesuai jadwal.' },
                  { title: "Edukasi Pola", text: 'Edukasi pola hidup sehat: kurangi garam, gula, dan lemak; tingkatkan aktivitas fisik bertahap.' },
                  { title: "Kontrol Ulang", text: 'Ditemukan faktor risiko. Anjurkan kontrol ulang dan pemantauan di Puskesmas.' },
                  { title: "Rujuk Lanjut", text: 'Perlu pemeriksaan lanjutan/rujukan sesuai indikasi klinis.' }
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
              />`;

if (code.includes(tOld)) {
    fs.writeFileSync('Pos7.jsx', code.replace(tOld, tNew));
    console.log('Replaced Unix');
} else if (code.includes(tOldWindows)) {
    fs.writeFileSync('Pos7.jsx', code.replace(tOldWindows, tNew));
    console.log('Replaced Windows');
} else {
    console.log('Target block not found in Pos7.jsx. The file may have changed.');
}
