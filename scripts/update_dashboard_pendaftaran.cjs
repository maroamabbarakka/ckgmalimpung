const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `{activeMenu === 'pendaftaran' && (`;
const endStr = `{activeMenu === 'kehadiran' && (`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{activeMenu === 'pendaftaran' && (() => {
        // Data calculations specific to Dashboard Pendaftaran
        const totalUmum = filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa').length;
        const totalSekolah = filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa').length;
        
        // Tren Harian (Umum vs Sekolah)
        const trendMap = new Map();
        filteredVisits.forEach(v => {
            const date = dateKey(v._date);
            if (!trendMap.has(date)) trendMap.set(date, { tanggal: date, Umum: 0, Sekolah: 0 });
            if (getCluster(v) === 'Anak/Siswa') trendMap.get(date).Sekolah++;
            else trendMap.get(date).Umum++;
        });
        const trenPendaftar = Array.from(trendMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-30); // Last 30 days
        
        // Klaster Usia
        const bayi = filteredVisits.filter(v => getCluster(v) === 'Bayi/Balita').length;
        const anakSekolah = totalSekolah;
        const dewasa = filteredVisits.filter(v => getCluster(v) === 'Dewasa').length;
        const lansia = filteredVisits.filter(v => getCluster(v) === 'Lansia').length;
        const totalSemua = analytics.total || 1; // Prevent div by zero

        // Klaster Pendidikan
        const sd = filteredVisits.filter(v => ['1','2','3','4','5','6'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const smp = filteredVisits.filter(v => ['7','8','9'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const sma = filteredVisits.filter(v => ['10','11','12'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const totalSiswa = Math.max(sd + smp + sma, 1);

        return (
            <section className="space-y-8 animate-in fade-in duration-500 bg-slate-50 p-2 sm:p-6 rounded-2xl">
                <div className="mb-2 flex flex-col border-b border-slate-200 pb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pemantauan Pendaftaran CKG</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Rangkuman demografi, rasio, dan tren pendaftar.</p>
                </div>

                {/* Baris 1: Total & Tren */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                      <div>
                         <h3 className="text-sm font-bold text-slate-800">Total Pendaftar</h3>
                         <p className="text-4xl font-black text-slate-950 mt-1">{formatNumber(analytics.total)} <span className="text-sm font-semibold text-slate-500">Orang</span></p>
                      </div>
                      <div className="h-64 mt-4 relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={[{ name: 'Laki-Laki', value: analytics.laki }, { name: 'Perempuan', value: analytics.perempuan }]} cx="50%" cy="50%" innerRadius={0} outerRadius={90} dataKey="value">
                                  <Cell fill="#3b82f6" />
                                  <Cell fill="#f43f5e" />
                               </Pie>
                               <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-black text-xs pointer-events-none drop-shadow-md flex justify-between w-32 px-4">
                            <span className={analytics.laki === 0 ? 'hidden' : ''}>{((analytics.laki/totalSemua)*100).toFixed(1)}%</span>
                            <span className={analytics.perempuan === 0 ? 'hidden' : ''}>{((analytics.perempuan/totalSemua)*100).toFixed(1)}%</span>
                         </div>
                      </div>
                   </div>

                   <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Tren Pendaftar Harian (Umum vs Sekolah)</h3>
                      <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trenPendaftar}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(5)} />
                               <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                               <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                               <Bar dataKey="Umum" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} barSize={16} />
                               <Bar dataKey="Sekolah" stackId="a" fill="#eab308" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                {/* Baris 2: Klaster Usia & Sekolah */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                      {/* Pendaftar Berdasarkan Klaster Usia */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Pendaftar berdasarkan klaster usia</h3>
                         
                         {/* CSS Stacked Bar */}
                         <div className="w-full h-6 rounded-full overflow-hidden flex mb-6 shadow-inner border border-slate-100">
                            <div style={{ width: \`\${(bayi/totalSemua)*100}%\` }} className="bg-pink-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(anakSekolah/totalSemua)*100}%\` }} className="bg-amber-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(dewasa/totalSemua)*100}%\` }} className="bg-sky-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(lansia/totalSemua)*100}%\` }} className="bg-purple-500 h-full transition-all duration-500"></div>
                         </div>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-400"></span>Bayi/Balita</span><span className="font-black text-slate-900">{formatNumber(bayi)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400"></span>Anak/Siswa</span><span className="font-black text-slate-900">{formatNumber(anakSekolah)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-400"></span>Dewasa</span><span className="font-black text-slate-900">{formatNumber(dewasa)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span>Lansia</span><span className="font-black text-slate-900">{formatNumber(lansia)}</span></div>
                         </div>
                      </div>

                      {/* Pendaftar Berdasarkan Klaster Sekolah */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Pendaftar berdasarkan jenjang sekolah</h3>
                         
                         <div className="w-full h-6 rounded-full overflow-hidden flex mb-6 shadow-inner border border-slate-100">
                            <div style={{ width: \`\${(sd/totalSiswa)*100}%\` }} className="bg-rose-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(smp/totalSiswa)*100}%\` }} className="bg-teal-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(sma/totalSiswa)*100}%\` }} className="bg-blue-500 h-full transition-all duration-500"></div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-semibold text-slate-600">
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SD/MI/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(sd)} ({(sd/totalSiswa*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['1','2','3','4','5','6'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-400"></span>SD Kelas {k}</span> <span className="font-bold text-slate-800">{filteredVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SMP/MTs/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(smp)} ({(smp/totalSiswa*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['7','8','9'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-400"></span>SMP Kelas {k}</span> <span className="font-bold text-slate-800">{filteredVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SMA/MA/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(sma)} ({(sma/totalSiswa*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['10','11','12'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>SMA Kelas {k}</span> <span className="font-bold text-slate-800">{filteredVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Total Pemeriksaan Khusus (Panel Kanan) */}
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Total Pemeriksaan Khusus</h3>
                      
                      <div className="mb-8">
                         <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG UMUM</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{formatNumber(totalUmum)} <span className="text-xs font-semibold text-slate-500 tracking-normal">Orang</span></p>
                         <p className="text-[10px] text-slate-400 mb-4">Pendaftar berdasarkan skrining (seluruh periode)</p>
                         
                         <div className="space-y-3">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Hipertensi & Diabetes</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(analytics.risks?.hipertensi + analytics.risks?.hiperglikemia || 0)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Obesitas (IMT)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(analytics.risks?.obesitas || 0)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Kanker Paru / TB / PPOK</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(analytics.risks?.paru || 0)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Fungsi Indera & Keswa</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber((analytics.risks?.indera || 0) + (analytics.risks?.mental || 0))}</span>
                            </div>
                         </div>
                      </div>

                      <div>
                         <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG SEKOLAH</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{formatNumber(totalSekolah)} <span className="text-xs font-semibold text-slate-500 tracking-normal">Orang</span></p>
                         <p className="text-[10px] text-slate-400 mb-4">Pendaftar berdasarkan skrining (seluruh periode)</p>
                         
                         <div className="space-y-3">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Fisik Dasar Siswa</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(totalSekolah)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Skrining Ketajaman Indera Siswa</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah peserta : {formatNumber(filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos3?.mata).length)}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            </section>
        );
    })()}
          `;
    content = content.substring(0, startIdx) + replacement + '\n' + content.substring(endIdx);
    fs.writeFileSync(file, content);
    console.log('Dashboard Pendaftaran fully redesigned successfully!');
} else {
    console.log('Error: Could not find boundaries for pendaftaran menu block.');
}
