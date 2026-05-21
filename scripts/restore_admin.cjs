const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const anchorStart = \`          <Link to="/" className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-colors block">
            ← Kembali ke Beranda
          </Link>\`;

const anchorEnd = \`                    </div>
                  </div>
                  
                  <div className="mt-5 mb-5 flex">
                    <input
                      type="search"
                      value={schoolSearch}\`;

const newCode = \`          <Link to="/" className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-colors block">
            ← Kembali ke Beranda
          </Link>
          <button type="button" onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors block">
            Keluar Sistem
          </button>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col bg-slate-50 lg:pl-64">
        {/* Header mobile & title */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-8">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <span className="text-xl">☰</span>
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">Master Command Center</h1>
              <p className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">Dashboard Eksekutif TERSANJUNG</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8">

          {activeMenu !== 'laporan' && activeMenu !== 'privasi' && activeMenu !== 'wilayah' && activeMenu !== 'simpeg' && activeMenu !== 'sekolah' && (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
              <p className="text-4xl">🚧</p>
              <h3 className="mt-4 text-lg font-black text-slate-900">Modul Dalam Pengembangan</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Fitur ini sedang dalam tahap integrasi dengan SIMPUS.</p>
            </div>
          )}

          {activeMenu === 'laporan' && (
             <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
                <button onClick={() => window.open('/laporan_tersanjung_final.html', '_blank')} className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-black text-white hover:bg-teal-700 shadow-sm transition">Buka Laporan Terpisah</button>
             </div>
          )}

          {/* WILAYAH SECTION */}
          {activeMenu === 'wilayah' && (
              <section className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Master Control Peta Kritis</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Pemantauan strategis indikator kesehatan wilayah kerja.</p>
                  </div>
                  <button type="button" onClick={() => setShowFilters(!showFilters)} className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition">
                    {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
                  {[
                    ['Kardiovaskular', 'hipertensi', wilayahAnalytics.risks?.hipertensi || 0, '#e11d48', 'Hipertensi berat'],
                    ['Gula Tinggi', 'hiperglikemia', wilayahAnalytics.risks?.hiperglikemia || 0, '#d97706', 'Indikasi diabetes'],
                    ['Obesitas', 'obesitas', wilayahAnalytics.risks?.obesitas || 0, '#2563eb', 'IMT >= 25'],
                    ['Paru / TB', 'paru', wilayahAnalytics.risks?.paru || 0, '#0d9488', 'Batuk / PPOK'],
                    ['Kesehatan Jiwa', 'mental', wilayahAnalytics.risks?.mental || 0, '#475569', 'Gejala SRQ/SDQ'],
                    ['Fungsi Indera', 'indera', wilayahAnalytics.risks?.indera || 0, '#db2777', 'Penglihatan / Pendengaran']
                  ].map(([title, key, value, color, desc]) => (
                    <button 
                      key={key}
                      onClick={() => setSelectedRiskCategory(selectedRiskCategory === key ? null : key)}
                      className={\`text-left p-4 rounded-xl border transition-all duration-200 \${selectedRiskCategory === key ? 'ring-2 shadow-md bg-white scale-[1.02]' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}\`}
                      style={{ borderColor: selectedRiskCategory === key ? color : undefined }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(value)}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">{desc}</p>
                    </button>
                  ))}
                </div>

                {selectedRiskCategory && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <h3 className="text-lg font-black text-slate-900 capitalize">Daftar Pasien: {selectedRiskCategory}</h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{wilayahAnalytics.riskPatients?.[selectedRiskCategory]?.length || 0} Pasien</span>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                      {wilayahAnalytics.riskPatients?.[selectedRiskCategory]?.length === 0 ? (
                        <p className="text-center py-8 text-sm font-medium text-slate-400">Tidak ada data pasien untuk kategori ini pada rentang filter aktif.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {wilayahAnalytics.riskPatients?.[selectedRiskCategory]?.map((visit) => (
                            <button
                              key={visit.id}
                              onClick={() => setSelectedRiskPatient(visit)}
                              className="flex flex-col text-left rounded-lg border border-slate-100 bg-slate-50 p-3 hover:border-teal-300 hover:bg-teal-50 transition"
                            >
                              <span className="font-bold text-slate-900 text-sm truncate">{visit.pasien_snapshot?.nama || visit.patientNIK || 'Tanpa Nama'}</span>
                              <span className="text-xs font-medium text-slate-500 mt-1">{visit.pasien_snapshot?.desa || '-'} - {visit.pasien_snapshot?.dusun || '-'}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeMenu === 'sekolah' && (
              <section className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">Basis Data Sekolah & Sinkronisasi</h3>
                      <p className="text-sm font-medium text-slate-500">
                        Cari, perbarui, dan validasi data sekolah. Data akan disinkronkan otomatis dengan kunjungan pasien (Klaster Anak/Siswa).
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={cleanDuplicates} className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 mr-2 shadow-sm">
                          Hapus Duplikat
                        </button>
                        <button type="button" onClick={() => openSchoolForm()} className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-teal-700">
                          + Tambah Sekolah
                        </button>
                    </div>
                  </div>
                  
                  <div className="mt-5 mb-5 flex">
                    <input
                      type="search"
                      value={schoolSearch}\`;

const startIndex = content.indexOf(anchorStart);
const endIndex = content.indexOf(anchorEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newCode + content.substring(endIndex + anchorEnd.length);
  fs.writeFileSync(file, content);
  console.log('Successfully restored AdminDashboard.jsx layout!');
} else {
  console.log('Failed to find anchors!');
  console.log('Start found:', startIndex !== -1);
  console.log('End found:', endIndex !== -1);
}
