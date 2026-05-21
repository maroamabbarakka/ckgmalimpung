const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const laporanToFind = `{activeMenu === 'laporan' && (
             <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
                <button onClick={() => window.open('/laporan_tersanjung_final.html', '_blank')} className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-black text-white hover:bg-teal-700 shadow-sm transition">Buka Laporan Terpisah</button>
             </div>
          )}`;

const newLaporan = `{activeMenu === 'laporan' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                  <div className="mb-6 flex flex-col gap-1 border-b border-slate-200 pb-4">
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Laporan & Ekspor Data</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Unduh laporan format Excel untuk kebutuhan PKG.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                          <span className="text-5xl mb-4">📄</span>
                          <h3 className="text-lg font-black text-slate-900 mb-2">Laporan Html Terpadu</h3>
                          <p className="text-xs text-slate-500 mb-6 px-4">Laporan komprehensif berisi rangkuman naratif dan analitik dalam bentuk presentasi digital (HTML).</p>
                          <button onClick={() => window.open('/laporan_tersanjung_final.html', '_blank')} className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all">Buka Laporan Digital</button>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl shadow-md border border-emerald-400 p-6 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 opacity-10 text-8xl -mt-6 -mr-4 transform rotate-12">📊</div>
                          <span className="text-5xl mb-4 relative z-10">📥</span>
                          <h3 className="text-lg font-black text-white mb-2 relative z-10">Ekspor Data Raw (Excel)</h3>
                          <p className="text-xs text-emerald-100 mb-6 px-4 relative z-10">Unduh master data tabel kunjungan dalam format MS Excel yang sesuai dengan format pelaporan SIMPUS.</p>
                          <button onClick={() => exportToPKGExcel(filteredVisits)} className="w-full sm:w-auto bg-white text-teal-700 hover:bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all relative z-10 flex items-center gap-2 justify-center">
                              <span className="text-lg">📊</span> Unduh Kolektif Excel
                          </button>
                      </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-4">
                      <h4 className="font-black text-slate-800 mb-4 uppercase tracking-widest text-xs">Unduh Berdasarkan Klaster</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {['Balita', 'Anak/Siswa', 'Dewasa', 'Lansia'].map(k => (
                              <button key={k} onClick={() => exportClusterExcel(filteredVisits, k)} className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 p-4 rounded-xl transition group">
                                  <span className="text-2xl group-hover:scale-110 transition-transform">{k === 'Balita' ? '🍼' : k === 'Anak/Siswa' ? '🎒' : k === 'Dewasa' ? '💼' : '🧓'}</span>
                                  <span className="font-bold text-slate-700 text-xs">{k}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              </section>
          )}`;

if (content.includes(laporanToFind)) {
    content = content.replace(laporanToFind, newLaporan);
    fs.writeFileSync(file, content);
    console.log('Successfully updated laporan tab.');
} else {
    console.log('Could not find laporan placeholder.');
}
