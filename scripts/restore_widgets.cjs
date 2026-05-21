const fs = require('fs');

const code = fs.readFileSync('Dashboard.jsx', 'utf8');

const missingWidgets = \`
  // =====================================================================
  // OBJEK WIDGETS (MENCEGAH DUPLIKASI KODE UNTUK DESKTOP & MOBILE)
  // =====================================================================
  const widgets = {
    'traffic': (
        <div key="traffic" className={\`bg-white rounded-[1.5rem] shadow-sm border p-6 flex flex-col h-full \${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}\`}>
            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><span>🚦</span> Traffic Real-Time</h3>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
                {POS_QUEUE_OPTIONS.map(pos => (
                    <ProgressBarQueue key={pos.key} label={pos.trafficLabel} count={stats.perPos[pos.key]} colorClass={pos.colorClass} />
                ))}
            </div>
        </div>
    ),
    'umur': (
        <div key="umur" className={\`bg-white rounded-[1.5rem] shadow-sm border p-6 flex flex-col h-full \${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}\`}>
            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2"><span>📊</span> Proporsi Sasaran</h3>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
                <ProgressBarAge label="Bayi & Balita" count={(stats.usia['Bayi']||0) + (stats.usia['Balita']||0)} total={stats.total} colorClass="bg-pink-400" />
                <ProgressBarAge label="Anak & Siswa" count={stats.usia['Anak/Siswa'] || 0} total={stats.total} colorClass="bg-amber-400" />
                <ProgressBarAge label="Usia Produktif" count={stats.usia['Dewasa'] || 0} total={stats.total} colorClass="bg-emerald-400" />
                <ProgressBarAge label="Lansia (60+)" count={stats.usia['Lansia'] || 0} total={stats.total} colorClass="bg-orange-400" />
            </div>
        </div>
    ),
    'demografi': (
        <div key="demografi" className={\`bg-white rounded-[1.5rem] shadow-sm border p-6 flex flex-col justify-center h-full \${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}\`}>
            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] mb-4">🚻 Gender</h3>
            <div className="flex justify-between text-[11px] font-black mb-2">
                <span className="text-blue-600">PRIA ({stats.gender.L})</span>
                <span className="text-pink-600">WANITA ({stats.gender.P})</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden border border-slate-200">
                <div style={{ width: \`\${stats.total ? (stats.gender.L/stats.total)*100 : 0}%\` }} className="h-full bg-blue-500 shadow-inner"></div>
                <div style={{ width: \`\${stats.total ? (stats.gender.P/stats.total)*100 : 0}%\` }} className="h-full bg-pink-500 shadow-inner"></div>
            </div>
        </div>
    ),
    'tot-antrian': (
        <div key="tot-antrian" className={\`h-full \${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}\`}>
            <CardStat title="Total Antrian" value={stats.total} subtitle="Pasien Terdaftar" gradient="from-blue-600 to-indigo-700" icon="👥" />
        </div>
    ),
    'tot-selesai': (
        <div key="tot-selesai" className={\`h-full \${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}\`}>
            <CardStat title="Selesai Skrining" value={stats.selesai} subtitle="Rapor Diterbitkan" gradient="from-emerald-600 to-teal-700" icon="✅" />
        </div>
    ),
    'stat-hipertensi': (
        <div key="stat-hipertensi" className={\`h-full \${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}\`}>
            <CardStatClickable title="Hipertensi" value={stats.klinis.hipertensi} subtitle="Tensi >= 140" gradient="from-rose-500 to-pink-600" icon="🩺" onClick={() => setPopupConfig({isOpen: true, type: 'hipertensi'})} />
        </div>
    ),
    'stat-diabetes': (
        <div key="stat-diabetes" className={\`h-full \${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}\`}>
            <CardStatClickable title="Gula Tinggi" value={stats.klinis.hiperglikemia} subtitle="GDS >= 200" gradient="from-orange-500 to-amber-600" icon="🩸" onClick={() => setPopupConfig({isOpen: true, type: 'diabetes'})} />
        </div>
    ),
    'stat-obesitas': (
        <div key="stat-obesitas" className={\`h-full \${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}\`}>
            <CardStatClickable title="Obesitas" value={stats.klinis.obesitas} subtitle="IMT >= 25" gradient="from-amber-500 to-yellow-600" icon="⚖️" onClick={() => setPopupConfig({isOpen: true, type: 'obesitas'})} />
        </div>
    ),
    'stat-paru': (
        <div key="stat-paru" className={\`h-full \${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}\`}>
            <CardStatClickable title="Risiko Paru" value={stats.klinis.paru_ppok} subtitle="PPOK/TB/Rokok" gradient="from-cyan-500 to-sky-600" icon="🫁" onClick={() => setPopupConfig({isOpen: true, type: 'paru_ppok'})} />
        </div>
    ),
    'stat-mental': (
        <div key="stat-mental" className={\`h-full \${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}\`}>
            <CardStatClickable title="Mental Jiwa" value={stats.klinis.mental} subtitle="Risiko Emosional" gradient="from-indigo-500 to-purple-600" icon="🧠" onClick={() => setPopupConfig({isOpen: true, type: 'mental'})} />
        </div>
    ),
    'stat-indera': (
        <div key="stat-indera" className={\`h-full \${isEditMode && !isMobile ? 'border-2 border-dashed border-amber-400 cursor-move rounded-[1.5rem] p-0.5' : ''}\`}>
            <CardStatClickable title="Indera" value={stats.klinis.indera} subtitle="Mata & Telinga" gradient="from-teal-500 to-emerald-600" icon="👁️" onClick={() => setPopupConfig({isOpen: true, type: 'indera'})} />
        </div>
    ),
    'ekspor': (
        <div key="ekspor" className={\`bg-white rounded-[1.5rem] shadow-sm border p-4 lg:p-6 flex flex-col justify-center h-full \${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}\`}>
            <h3 className="font-black text-[11px] text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">📂 Unduh Laporan Per-Klaster (Format Dinas)</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {['Balita', 'Anak/Siswa', 'Dewasa', 'Lansia'].map(k => (
                    <div key={k} className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-lg leading-none">{k === 'Balita' ? '🍼' : k === 'Anak/Siswa' ? '🎒' : k === 'Dewasa' ? '💼' : '🧓'}</span>
                            <span className="font-black text-[10px] text-slate-700 uppercase tracking-widest">{k}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => exportExcelKategori(k)} className="w-full bg-white hover:bg-green-500 hover:text-white border border-slate-200 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm">UNDUH EXCEL</button>
                            <button onClick={() => exportPDFKategori(k)} className="w-full bg-white hover:bg-red-500 hover:text-white border border-slate-200 p-2.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm">UNDUH PDF</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ),
    'tabel': (
        <div key="tabel" className={\`bg-white rounded-[2.5rem] shadow-xl border overflow-hidden flex flex-col h-full min-h-[400px] \${isEditMode && !isMobile ? 'border-amber-400 cursor-move border-2' : 'border-slate-200'}\`}>
            <div className="p-5 border-b flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50/80 backdrop-blur-md sticky top-0 z-20">
                <div className="relative w-full lg:w-80">
                    <input type="text" placeholder="Cari NIK / Nama / Antrian..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 text-xs font-bold focus:border-blue-500 outline-none transition-all shadow-inner" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                </div>
                {selectedRows.length > 0 && (
                    <div className="flex gap-2 w-full lg:w-auto">
                        <button onClick={handleBulkDelete} className="flex-1 lg:flex-none bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition">HAPUS ({selectedRows.length})</button>
                        <button onClick={() => setSelectedRows([])} className="bg-white text-slate-500 border border-slate-200 px-5 py-3 rounded-2xl text-[10px] font-black uppercase">BATAL</button>
                    </div>
                )}
            </div>
            {/* Tabel Scroll dengan efek shadow inner agar jelas bisa di-scroll di Mobile */}
            <div className="flex-1 overflow-auto custom-scrollbar shadow-inner">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                    <thead className="bg-white border-b-2 border-slate-100 sticky top-0 z-10 shadow-sm">
                        <tr className="font-black uppercase text-slate-400 text-[10px] tracking-widest">
                            <th className="p-5 w-14 text-center"><input type="checkbox" onChange={handleSelectAll} checked={selectedRows.length === filteredVisits.length && filteredVisits.length > 0} className="w-4 h-4 rounded border-slate-300 cursor-pointer" /></th>
                            <th className="p-5">Identitas Pasien</th>
                            <th className="p-5">Status Klinis Dasar</th>
                            <th className="p-5">Posisi Antrian</th>
                            <th className="p-5 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredVisits.length === 0 ? (
                            <tr><td colSpan="5" className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">Tidak ada data ditemukan</td></tr>
                        ) : (
                            filteredVisits.map(v => (
                                <tr key={v.id} className={\`hover:bg-blue-50/40 transition-colors \${selectedRows.includes(v.id) ? 'bg-blue-50' : ''}\`}>
                                    <td className="p-5 text-center"><input type="checkbox" checked={selectedRows.includes(v.id)} onChange={() => handleSelectRow(v.id)} className="w-4 h-4 rounded border-slate-300 cursor-pointer" /></td>
                                    <td className="p-5">
                                        <p className="font-black text-slate-800 text-sm">{v.pasien_snapshot?.nama}</p>
                                        <p className="text-[10px] font-mono text-slate-400 mt-1 tracking-tighter">NIK: {v.patientNIK}</p>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-2">
                                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-rose-600 text-[10px] shadow-sm">🩺 {v.pos2?.td || '-'}</span>
                                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-orange-600 text-[10px] shadow-sm">🩸 {v.pos2?.gds || v.pos2?.gdp || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={\`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm \${v.status_antrian === 'Selesai' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}\`}>
                                            {v.status_antrian}
                                        </span>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => window.open(\`/rapor/\${v.id}\`, '_blank')} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-teal-600 shadow-sm hover:bg-teal-600 hover:text-white transition">🖨️</button>
                                            <button onClick={() => openEditModal(v)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition">✏️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Hint scrollable untuk mobile */}
            <div className="md:hidden text-center py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Geser tabel ke kiri/kanan ➔
            </div>
        </div>
    )
  };
\n`;

const targetAnchor = "const handleLogout = () => { sessionStorage.removeItem('isAuthenticated'); navigate('/login'); };";

if (code.includes(targetAnchor) && !code.includes('const widgets = {')) {
    const newCode = code.replace(targetAnchor, targetAnchor + '\n' + missingWidgets);
    fs.writeFileSync('Dashboard.jsx', newCode);
    console.log('Restored missing widgets successfully!');
} else {
    console.log('Anchor not found or widgets already exists!');
}
