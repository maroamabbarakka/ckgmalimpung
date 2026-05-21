const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `{activeMenu === 'kehadiran' && (`;
const endStr = `{activeMenu === 'pelayanan' && (`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{activeMenu === 'kehadiran' && (() => {
        // Data calculations specific to Dashboard Kehadiran
        const hadirVisits = filteredVisits.filter(v => isAttended(v));
        const totalHadir = hadirVisits.length;
        const totalSelesai = hadirVisits.filter(v => isCompleted(v)).length;
        const totalBelumSelesai = totalHadir - totalSelesai;
        
        const hadirUmum = hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa').length;
        const hadirSekolah = hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa').length;
        
        // Tren Harian (Hadir vs Selesai)
        const trendMap = new Map();
        filteredVisits.forEach(v => {
            const date = dateKey(v._date);
            if (!trendMap.has(date)) trendMap.set(date, { tanggal: date, Hadir: 0, Selesai: 0 });
            if (isAttended(v)) trendMap.get(date).Hadir++;
            if (isCompleted(v)) trendMap.get(date).Selesai++;
        });
        const trenKehadiran = Array.from(trendMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-30);
        
        // Klaster Usia
        const bayiHadir = hadirVisits.filter(v => getCluster(v) === 'Bayi/Balita').length;
        const anakSekolahHadir = hadirSekolah;
        const dewasaHadir = hadirVisits.filter(v => getCluster(v) === 'Dewasa').length;
        const lansiaHadir = hadirVisits.filter(v => getCluster(v) === 'Lansia').length;
        const totalSemuaHadir = totalHadir || 1; 

        // Klaster Pendidikan
        const sdHadir = hadirVisits.filter(v => ['1','2','3','4','5','6'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const smpHadir = hadirVisits.filter(v => ['7','8','9'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const smaHadir = hadirVisits.filter(v => ['10','11','12'].some(k => String(v.pos1?.kelas).includes(k))).length;
        const totalSiswaHadir = Math.max(sdHadir + smpHadir + smaHadir, 1);

        return (
            <section className="space-y-8 animate-in fade-in duration-500 bg-slate-50 p-2 sm:p-6 rounded-2xl">
                <div className="mb-2 flex flex-col border-b border-slate-200 pb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pemantauan Kehadiran CKG</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Rangkuman partisipasi dan tingkat penyelesaian layanan.</p>
                </div>

                {/* Baris 1: Total & Tren */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                      <div>
                         <h3 className="text-sm font-bold text-slate-800">Total Kehadiran</h3>
                         <p className="text-4xl font-black text-slate-950 mt-1">{formatNumber(totalHadir)} <span className="text-sm font-semibold text-slate-500">Orang</span></p>
                         <p className="text-[10px] text-slate-400 mt-1">Dari {formatNumber(analytics.total)} Total Pendaftar</p>
                      </div>
                      <div className="h-64 mt-4 relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={[{ name: 'Selesai Layanan', value: totalSelesai }, { name: 'Belum Selesai', value: totalBelumSelesai }]} cx="50%" cy="50%" innerRadius={0} outerRadius={90} dataKey="value">
                                  <Cell fill="#10b981" />
                                  <Cell fill="#f59e0b" />
                               </Pie>
                               <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-black text-xs pointer-events-none drop-shadow-md flex justify-between w-32 px-4">
                            <span className={totalSelesai === 0 ? 'hidden' : ''}>{((totalSelesai/totalSemuaHadir)*100).toFixed(1)}%</span>
                            <span className={totalBelumSelesai === 0 ? 'hidden' : ''}>{((totalBelumSelesai/totalSemuaHadir)*100).toFixed(1)}%</span>
                         </div>
                      </div>
                   </div>

                   <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Tren Kehadiran & Penyelesaian Harian</h3>
                      <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trenKehadiran}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(5)} />
                               <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                               <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                               <Bar dataKey="Hadir" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                               <Bar dataKey="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                {/* Baris 2: Klaster Usia & Sekolah */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Kehadiran berdasarkan klaster usia</h3>
                         <div className="w-full h-6 rounded-full overflow-hidden flex mb-6 shadow-inner border border-slate-100">
                            <div style={{ width: \`\${(bayiHadir/totalSemuaHadir)*100}%\` }} className="bg-pink-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(anakSekolahHadir/totalSemuaHadir)*100}%\` }} className="bg-amber-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(dewasaHadir/totalSemuaHadir)*100}%\` }} className="bg-sky-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(lansiaHadir/totalSemuaHadir)*100}%\` }} className="bg-purple-500 h-full transition-all duration-500"></div>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-400"></span>Bayi/Balita</span><span className="font-black text-slate-900">{formatNumber(bayiHadir)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400"></span>Anak/Siswa</span><span className="font-black text-slate-900">{formatNumber(anakSekolahHadir)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-400"></span>Dewasa</span><span className="font-black text-slate-900">{formatNumber(dewasaHadir)}</span></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span>Lansia</span><span className="font-black text-slate-900">{formatNumber(lansiaHadir)}</span></div>
                         </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Kehadiran berdasarkan jenjang sekolah</h3>
                         <div className="w-full h-6 rounded-full overflow-hidden flex mb-6 shadow-inner border border-slate-100">
                            <div style={{ width: \`\${(sdHadir/totalSiswaHadir)*100}%\` }} className="bg-rose-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(smpHadir/totalSiswaHadir)*100}%\` }} className="bg-teal-400 h-full transition-all duration-500"></div>
                            <div style={{ width: \`\${(smaHadir/totalSiswaHadir)*100}%\` }} className="bg-blue-500 h-full transition-all duration-500"></div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-semibold text-slate-600">
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SD/MI/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(sdHadir)} ({(sdHadir/totalSiswaHadir*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['1','2','3','4','5','6'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-400"></span>SD Kelas {k}</span> <span className="font-bold text-slate-800">{hadirVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SMP/MTs/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(smpHadir)} ({(smpHadir/totalSiswaHadir*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['7','8','9'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-400"></span>SMP Kelas {k}</span> <span className="font-bold text-slate-800">{hadirVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <div className="flex flex-col mb-4">
                                  <span className="font-black text-slate-900">SMA/MA/Sederajat</span>
                                  <span className="text-xs text-slate-400">{formatNumber(smaHadir)} ({(smaHadir/totalSiswaHadir*100).toFixed(1)}%)</span>
                               </div>
                               <div className="space-y-2 text-xs">
                                  {['10','11','12'].map(k => (
                                     <div key={k} className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>SMA Kelas {k}</span> <span className="font-bold text-slate-800">{hadirVisits.filter(v => String(v.pos1?.kelas) === k).length}</span></div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Tingkat Penyelesaian Layanan</h3>
                      
                      <div className="mb-8">
                         <span className="px-2 py-1 bg-teal-100 text-teal-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG UMUM (HADIR)</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{formatNumber(hadirUmum)} <span className="text-xs font-semibold text-slate-500 tracking-normal">Orang</span></p>
                         
                         <div className="space-y-3 mt-4">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Pos 2 (Antropometri)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos2).length)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Pos 3 (Fisik Dasar)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos3).length)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Pos 4 (Laboratorium)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos4).length)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Pos 5 (Diagnosa Klinis)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos5).length)}</span>
                            </div>
                         </div>
                      </div>

                      <div>
                         <span className="px-2 py-1 bg-teal-100 text-teal-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG SEKOLAH (HADIR)</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{formatNumber(hadirSekolah)} <span className="text-xs font-semibold text-slate-500 tracking-normal">Orang</span></p>
                         
                         <div className="space-y-3 mt-4">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Skrining Mandiri</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos6).length)}</span>
                            </div>
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Penyelesaian Skrining Fisik UKS</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos3).length)}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Tabel Agregat Kehadiran Umum */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Kehadiran Umum</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pemantauan kehadiran Cek Kesehatan Gratis Umum</p>
                   </div>
                   <button 
                      onClick={async () => {
                         const XLSX = await import('xlsx');
                         const getL = (cond) => hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Laki-Laki' && cond(v)).length;
                         const getP = (cond) => hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Perempuan' && cond(v)).length;
                         const cBayi = v => getCluster(v) === 'Bayi/Balita';
                         const cAnak = v => v.pos1?.kategoriUmur === 'Usia sekolah 7-12 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 13-15 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 16 s.d <18 tahun';
                         const cDewasa = v => getCluster(v) === 'Dewasa';
                         const cLansia = v => getCluster(v) === 'Lansia';

                         const ws = XLSX.utils.json_to_sheet([{
                            Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                            'Total Hadir': hadirUmum, 
                            'Total Bayi Hadir': bayiHadir, 'Bayi P Hadir': getP(cBayi), 'Bayi L Hadir': getL(cBayi),
                            'Total Anak Hadir': getP(cAnak) + getL(cAnak), 'Anak P Hadir': getP(cAnak), 'Anak L Hadir': getL(cAnak),
                            'Total Dewasa Hadir': dewasaHadir, 'Dewasa P Hadir': getP(cDewasa), 'Dewasa L Hadir': getL(cDewasa),
                            'Total Lansia Hadir': lansiaHadir, 'Lansia P Hadir': getP(cLansia), 'Lansia L Hadir': getL(cLansia)
                         }]);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "Kehadiran Umum");
                         XLSX.writeFile(wb, "Tabel_Kehadiran_Umum.xlsx");
                      }}
                      className="bg-[#16b3ac] hover:bg-[#11928c] text-white text-[13px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition border-none"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4">
                      {(() => {
                         const getL = (cond) => hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Laki-Laki' && cond(v)).length;
                         const getP = (cond) => hadirVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Perempuan' && cond(v)).length;
                         const cBayi = v => getCluster(v) === 'Bayi/Balita';
                         const cAnak = v => v.pos1?.kategoriUmur === 'Usia sekolah 7-12 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 13-15 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 16 s.d <18 tahun';
                         const cDewasa = v => getCluster(v) === 'Dewasa';
                         const cLansia = v => getCluster(v) === 'Lansia';

                         return (
                         <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                               <tr className="bg-[#f3f4f6] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-y border-[#e5e7eb]">
                                  <th className="px-4 py-3 font-semibold">Provinsi</th>
                                  <th className="px-4 py-3 font-semibold">Kabko</th>
                                  <th className="px-4 py-3 font-semibold">Kecamatan</th>
                                  <th className="px-4 py-3 font-semibold">Puskesmas</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Hadir</th>
                                  <th className="px-4 py-3 font-semibold text-center">Bayi Hadir</th>
                                  <th className="px-4 py-3 font-semibold text-center">Anak Hadir</th>
                                  <th className="px-4 py-3 font-semibold text-center">Dewasa Hadir</th>
                                  <th className="px-4 py-3 font-semibold text-center">Lansia Hadir</th>
                               </tr>
                            </thead>
                            <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                               <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3">Sulawesi Selatan</td>
                                  <td className="px-4 py-3">Kab. Pinrang</td>
                                  <td className="px-4 py-3">Patampanua</td>
                                  <td className="px-4 py-3 uppercase">MALIMPUNG</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(hadirUmum)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(bayiHadir)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getP(cAnak) + getL(cAnak))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(dewasaHadir)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(lansiaHadir)}</td>
                               </tr>
                            </tbody>
                         </table>
                         );
                      })()}
                   </div>
                </div>

                {/* Tabel Agregat Kehadiran Sekolah */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Kehadiran Sekolah</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pemantauan kehadiran Cek Kesehatan Gratis Sekolah</p>
                   </div>
                   <button 
                      onClick={async () => {
                         const XLSX = await import('xlsx');
                         const data = [];
                         const allSekolah = [...new Set(hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa').map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                         
                         allSekolah.forEach(namaSekolah => {
                            ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                               const visits = hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                               const count = visits.length;
                               if(count > 0) {
                                  let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                                  const selesaiCount = visits.filter(v => v.pos6).length;
                                  data.push({
                                     Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                                     'Jenjang Pendidikan': jenjang,
                                     'Nama Sekolah': namaSekolah,
                                     Kelas: 'Kelas ' + k,
                                     'Siswa Hadir': count,
                                     'Selesai Skrining': selesaiCount,
                                     'Menunggu Skrining': count - selesaiCount
                                  });
                               }
                            });
                         });
                         
                         const ws = XLSX.utils.json_to_sheet(data);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "Kehadiran Sekolah");
                         XLSX.writeFile(wb, "Tabel_Kehadiran_Sekolah.xlsx");
                      }}
                      className="bg-[#16b3ac] hover:bg-[#11928c] text-white text-[13px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition border-none"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                         <thead>
                            <tr className="bg-[#f3f4f6] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider border-y border-[#e5e7eb]">
                               <th className="px-4 py-3 font-semibold">Provinsi</th>
                               <th className="px-4 py-3 font-semibold">Kobko</th>
                               <th className="px-4 py-3 font-semibold">Kecamatan</th>
                               <th className="px-4 py-3 font-semibold">Puskesmas</th>
                               <th className="px-4 py-3 font-semibold">Jenjang Pendidikan</th>
                               <th className="px-4 py-3 font-semibold">Nama Sekolah</th>
                               <th className="px-4 py-3 font-semibold text-center">Kelas</th>
                               <th className="px-4 py-3 font-semibold text-center">Siswa Hadir</th>
                               <th className="px-4 py-3 font-semibold text-center">Selesai Skrining</th>
                               <th className="px-4 py-3 font-semibold text-center">Menunggu Skrining</th>
                            </tr>
                         </thead>
                         <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                            {(() => {
                               const rows = [];
                               const allSekolah = [...new Set(hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa').map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                               
                               allSekolah.forEach(namaSekolah => {
                                  ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                                     const visits = hadirVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                                     const count = visits.length;
                                     if(count > 0) {
                                        let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                                        const selesaiCount = visits.filter(v => v.pos6).length;
                                        rows.push(
                                           <tr key={\`\${namaSekolah}-\${k}\`} className="hover:bg-slate-50 transition-colors">
                                              <td className="px-4 py-3">Sulawesi Selatan</td>
                                              <td className="px-4 py-3">Kab. Pinrang</td>
                                              <td className="px-4 py-3">Patampanua</td>
                                              <td className="px-4 py-3 uppercase">MALIMPUNG</td>
                                              <td className="px-4 py-3">{jenjang}</td>
                                              <td className="px-4 py-3">{namaSekolah}</td>
                                              <td className="px-4 py-3 text-center">Kelas {k}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(count)}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(selesaiCount)}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(count - selesaiCount)}</td>
                                           </tr>
                                        );
                                     }
                                  });
                               });
                               
                               if(rows.length === 0) {
                                   return <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-400">Belum ada data kehadiran sekolah.</td></tr>;
                               }
                               return rows;
                            })()}
                         </tbody>
                      </table>
                   </div>
                </div>
            </section>
        );
    })()}`;

    content = content.substring(0, startIdx) + replacement + '\n' + content.substring(endIdx);
    fs.writeFileSync(file, content);
    console.log('Dashboard Kehadiran updated successfully!');
} else {
    console.log('Error: Could not find anchor for kehadiran menu block.');
}
