const fs = require('fs');

let code = fs.readFileSync('Dashboard.jsx', 'utf8');

const missingUI = \`
  if (loading) return <div className="fixed inset-0 bg-slate-50 flex flex-col justify-center items-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><p className="mt-4 font-black text-blue-900 tracking-widest animate-pulse">MEMUAT SISTEM...</p></div>;

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8fafc] flex flex-col h-screen w-screen overflow-hidden font-sans">
      
      {/* HEADER PUTIH ATAS */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex justify-between items-center shrink-0 shadow-sm print-hidden sticky top-0 z-50">
          <div className="flex items-center gap-2 md:gap-3">
              <span className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm shadow-sm">📊</span>
              <h1 className="font-black text-slate-800 text-sm md:text-base tracking-widest uppercase hidden sm:block">Master Command Center</h1>
          </div>
          <div className="flex items-center gap-2">
              {!isMobile && (
                  <button onClick={toggleEditMode} className={\`px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition flex items-center gap-1.5 border shadow-sm \${isEditMode ? 'bg-amber-500 text-white border-amber-600 animate-pulse' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}\`}>
                      {isEditMode ? '💾 KUNCI TATA LETAK' : '🛠️ KUSTOMISASI'}
                  </button>
              )}
              <div className="w-px h-5 bg-slate-300 mx-1 hidden md:block"></div>
              <button onClick={() => navigate('/')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition flex items-center gap-1.5 hidden md:flex"><span>🏠</span> Beranda</button>
              <button onClick={handleLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition flex items-center gap-1.5 hidden md:flex"><span>🚪</span> Keluar</button>
          </div>
      </header>

      {/* DASHBOARD KONTEN AREA */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative">
          
          {/* BANNER HITAM */}
          <div className="m-4 lg:m-6 bg-slate-900 rounded-2xl px-5 py-4 md:px-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                  <div className="hidden md:flex w-16 h-16 bg-white rounded-2xl items-center justify-center border-4 border-emerald-400 p-1.5 animate-pulse shadow-lg shadow-emerald-500/50 shrink-0">
                      <img src="http://localhost:5173/logo_pinrang.png" alt="Logo Pinrang" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-center md:text-left">
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md leading-none">Dashboard Data TERSANJUNG</h2>
                      <p className="text-emerald-400 text-[10px] mt-1 font-bold uppercase tracking-widest">Live Monitoring • Puskesmas Malimpung</p>
                  </div>
              </div>
              
              <div className="relative z-10 flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center shrink-0">
                  
                  {/* TOMBOL EKSPOR PKG */}
                  <div className="relative">
                      <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-white font-bold text-xs transition-all w-full sm:w-auto justify-center shadow-inner">
                          <span className="mr-1.5 text-lg">📥</span> Ekspor Data (PKG)
                      </button>
                      {showExportMenu && (
                          <div className="absolute top-full mt-2 left-0 w-full sm:w-48 bg-white rounded-[1rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in-up">
                              <button onClick={() => { setShowExportMenu(false); exportToPKGExcel(filteredVisits); }} className="w-full text-left px-4 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 border-b border-slate-100 transition-colors">
                                  <span className="text-lg">📊</span> Tabel Excel
                              </button>
                              <button onClick={() => { setShowExportMenu(false); exportToPKG_PDF(filteredVisits); }} className="w-full text-left px-4 py-3 text-xs font-black text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors">
                                  <span className="text-lg">📄</span> Dokumen PDF
                              </button>
                          </div>
                      )}
                  </div>

                  <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 w-full sm:w-auto">
                      <span className="text-xs mr-1">🌍</span>
                      <select value={filterDesa} onChange={(e) => setFilterDesa(e.target.value)} className="w-full sm:w-48 bg-transparent text-white py-2 font-bold text-xs outline-none cursor-pointer">
                          <option value="Semua" className="text-slate-900">Seluruh Wilayah Kerja</option>
                          <option value="Desa Malimpung" className="text-slate-900">Desa Malimpung</option>
                          <option value="Desa Padang Loang" className="text-slate-900">Desa Padang Loang</option>
                          <option value="Kelurahan Maccirinna" className="text-slate-900">Kel. Maccirinna</option>
                      </select>
                  </div>
                  
                  {!isMobile && (
                      <button onClick={resetLayout} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 border border-rose-500 active:scale-95 shrink-0">
                          🔄 RESET LAYOUT
                      </button>
                  )}
              </div>
          </div>

          {pesan && <div className="mx-4 lg:mx-6 mb-4 p-3 bg-blue-600 text-white rounded-2xl font-black text-xs text-center shadow-xl animate-bounce shrink-0">{pesan}</div>}

          {/* AREA WIDGET (CONDITIONAL RENDERING) */}
          <div className={\`mx-4 lg:mx-6 mb-10 \${isEditMode && !isMobile ? "bg-slate-200/50 rounded-[2rem] border-2 border-dashed border-amber-400 p-2" : ""}\`}>
              
              {isMobile ? (
                  // =====================================================================
                  // TAMPILAN MOBILE: NATIVE FLEXBOX (Performa Sangat Tinggi)
                  // =====================================================================
                  <div className="flex flex-col gap-4 w-full">
                      <div className="h-28">{widgets['tot-antrian']}</div>
                      <div className="h-28">{widgets['tot-selesai']}</div>
                      {widgets['traffic']}
                      {widgets['umur']}
                      {widgets['demografi']}
                      {/* Grid khusus untuk 6 Kartu Klinik di Mobile */}
                      <div className="grid grid-cols-2 gap-3 h-56">
                          {widgets['stat-hipertensi']}
                          {widgets['stat-diabetes']}
                          {widgets['stat-obesitas']}
                          {widgets['stat-paru']}
                          {widgets['stat-mental']}
                          {widgets['stat-indera']}
                      </div>
                      {widgets['ekspor']}
                      {widgets['tabel']}
                  </div>
              ) : (
                  // =====================================================================
                  // TAMPILAN DESKTOP: REACT-GRID-LAYOUT (Drag & Drop)
                  // =====================================================================
                  <div className="min-h-[500px]">
                      <AutoWidthGrid
                          className="layout"
                          layouts={layouts}
                          breakpoints={{ lg: 1200, md: 996, sm: 768 }} 
                          cols={{ lg: 24, md: 24, sm: 24 }} 
                          rowHeight={40} 
                          onLayoutChange={handleLayoutChange}
                          isDraggable={isEditMode} 
                          isResizable={isEditMode} 
                          margin={[16, 16]} 
                          useCSSTransforms={true}
                      >
                          {/* Render semua value dari objek widgets */}
                          {Object.keys(widgets).map(key => (
                              <div key={key}>{widgets[key]}</div>
                          ))}
                      </AutoWidthGrid>
                  </div>
              )}

          </div>

      </div>

      {/* POPUP DETAIL PASIEN KLINIS */}
\`;

const targetAnchor = "{/* POPUP DETAIL PASIEN KLINIS */}";

if (code.includes(targetAnchor)) {
    code = code.replace(targetAnchor, missingUI);
    fs.writeFileSync('Dashboard.jsx', code);
    console.log('Restored missing UI logic successfully!');
} else {
    console.log('Anchor not found!');
}
