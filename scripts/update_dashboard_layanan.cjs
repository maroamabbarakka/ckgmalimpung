const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `{activeMenu === 'pelayanan' && (`;
const endStr = `{activeMenu === 'wilayah' && (`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{activeMenu === 'pelayanan' && (() => {
        // Data calculations specific to Dashboard Layanan
        const layananUmum = filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa');
        const layananSekolah = filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa');
        
        const countPos = (arr, posKey) => arr.filter(v => v[posKey]).length;
        
        const totalPos1 = countPos(filteredVisits, 'pos1');
        const totalPos2 = countPos(filteredVisits, 'pos2');
        const totalPos3 = countPos(filteredVisits, 'pos3');
        const totalPos4 = countPos(filteredVisits, 'pos4');
        const totalPos5 = countPos(filteredVisits, 'pos5');
        const totalPos6 = countPos(filteredVisits, 'pos6');
        
        // Tren Harian (Beban Pelayanan)
        const trendMap = new Map();
        filteredVisits.forEach(v => {
            const date = dateKey(v._date);
            if (!trendMap.has(date)) trendMap.set(date, { tanggal: date, Layanan: 0 });
            // Count any active service on that day
            if (v.pos2 || v.pos3 || v.pos4 || v.pos5 || v.pos6) trendMap.get(date).Layanan++;
        });
        const trenLayanan = Array.from(trendMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(-30);

        return (
            <section className="space-y-8 animate-in fade-in duration-500 bg-slate-50 p-2 sm:p-6 rounded-2xl">
                <div className="mb-2 flex flex-col border-b border-slate-200 pb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pemantauan Layanan CKG</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Rangkuman distribusi beban antrean dan penyelesaian pos.</p>
                </div>

                {/* Baris 1: Total & Tren */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                      <div>
                         <h3 className="text-sm font-bold text-slate-800">Total Transaksi Layanan</h3>
                         <p className="text-4xl font-black text-slate-950 mt-1">{formatNumber(totalPos2 + totalPos3 + totalPos4 + totalPos5 + totalPos6)} <span className="text-sm font-semibold text-slate-500">Tindakan</span></p>
                         <p className="text-[10px] text-slate-400 mt-1">Akumulasi seluruh intervensi klinis.</p>
                      </div>
                      <div className="h-64 mt-4 relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={[{ name: 'CKG Umum', value: totalPos2+totalPos3+totalPos4+totalPos5 }, { name: 'CKG Sekolah', value: countPos(layananSekolah, 'pos3')+countPos(layananSekolah, 'pos6') }]} cx="50%" cy="50%" innerRadius={0} outerRadius={90} dataKey="value">
                                  <Cell fill="#0ea5e9" />
                                  <Cell fill="#8b5cf6" />
                               </Pie>
                               <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Tren Beban Layanan Harian</h3>
                      <div className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trenLayanan}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(5)} />
                               <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                               <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                               <Bar dataKey="Layanan" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                {/* Baris 2: Pos Layanan Detail */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Distribusi Pasien Per Pos Layanan (CKG Umum)</h3>
                         <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={[
                                  { name: 'Pendaftaran', value: countPos(layananUmum, 'pos1') },
                                  { name: 'Wawancara', value: countPos(layananUmum, 'pos2') },
                                  { name: 'Fisik', value: countPos(layananUmum, 'pos3') },
                                  { name: 'Lab', value: countPos(layananUmum, 'pos4') },
                                  { name: 'Edukasi', value: countPos(layananUmum, 'pos5') }
                               ]}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                  <Bar dataKey="value" name="Jumlah Pasien" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Distribusi Siswa Per Pos Layanan (CKG Sekolah)</h3>
                         <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={[
                                  { name: 'Skrining Mandiri', value: countPos(layananSekolah, 'pos6') },
                                  { name: 'Pemeriksaan Fisik', value: countPos(layananSekolah, 'pos3') }
                               ]}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                  <Bar dataKey="value" name="Jumlah Siswa" fill="#eab308" radius={[4, 4, 0, 0]} barSize={32} />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-6">Efektivitas Layanan</h3>
                      
                      <div className="mb-8">
                         <span className="px-2 py-1 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG UMUM</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{((countPos(layananUmum, 'pos5') / Math.max(countPos(layananUmum, 'pos1'), 1)) * 100).toFixed(1)}%</p>
                         <p className="text-[10px] text-slate-400 mb-4">Tingkat kelulusan skrining dari pendaftaran hingga edukasi.</p>
                         
                         <div className="space-y-3">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Drop-off (Antrean Terputus)</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(countPos(layananUmum, 'pos1') - countPos(layananUmum, 'pos5'))} Pasien</span>
                            </div>
                         </div>
                      </div>

                      <div>
                         <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md uppercase tracking-wider">CKG SEKOLAH</span>
                         <p className="text-3xl font-black text-slate-950 mt-3">{((countPos(layananSekolah, 'pos3') / Math.max(countPos(layananSekolah, 'pos1'), 1)) * 100).toFixed(1)}%</p>
                         <p className="text-[10px] text-slate-400 mb-4">Tingkat kelulusan skrining siswa di UKS.</p>
                         
                         <div className="space-y-3">
                            <div className="flex flex-col pb-2 border-b border-slate-50">
                               <span className="text-xs font-bold text-slate-700">Siswa Tertunda Skrining Fisik</span>
                               <span className="text-[10px] font-semibold text-slate-400">Jumlah: {formatNumber(countPos(layananSekolah, 'pos6') - countPos(layananSekolah, 'pos3'))} Siswa</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Tabel Agregat Layanan Umum */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Layanan Umum</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi beban antrean layanan Cek Kesehatan Gratis Umum</p>
                   </div>
                   <button 
                      onClick={async () => {
                         const XLSX = await import('xlsx');
                         
                         const ws = XLSX.utils.json_to_sheet([{
                            Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                            'Total Terdaftar': countPos(layananUmum, 'pos1'), 
                            'Pos 2 (Wawancara)': countPos(layananUmum, 'pos2'),
                            'Pos 3 (Fisik)': countPos(layananUmum, 'pos3'),
                            'Pos 4 (Laboratorium)': countPos(layananUmum, 'pos4'),
                            'Pos 5 (Edukasi)': countPos(layananUmum, 'pos5'),
                            'Selesai 100%': countPos(layananUmum, 'pos5')
                         }]);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "Layanan Umum");
                         XLSX.writeFile(wb, "Tabel_Layanan_Umum.xlsx");
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
                                  <th className="px-4 py-3 font-semibold">Kabko</th>
                                  <th className="px-4 py-3 font-semibold">Kecamatan</th>
                                  <th className="px-4 py-3 font-semibold">Puskesmas</th>
                                  <th className="px-4 py-3 font-semibold text-center">Terdaftar</th>
                                  <th className="px-4 py-3 font-semibold text-center">Pos 2 (Wawancara)</th>
                                  <th className="px-4 py-3 font-semibold text-center">Pos 3 (Fisik)</th>
                                  <th className="px-4 py-3 font-semibold text-center">Pos 4 (Lab)</th>
                                  <th className="px-4 py-3 font-semibold text-center">Pos 5 (Edukasi)</th>
                               </tr>
                            </thead>
                            <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                               <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3">Sulawesi Selatan</td>
                                  <td className="px-4 py-3">Kab. Pinrang</td>
                                  <td className="px-4 py-3">Patampanua</td>
                                  <td className="px-4 py-3 uppercase">MALIMPUNG</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(countPos(layananUmum, 'pos1'))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(countPos(layananUmum, 'pos2'))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(countPos(layananUmum, 'pos3'))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(countPos(layananUmum, 'pos4'))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(countPos(layananUmum, 'pos5'))}</td>
                               </tr>
                            </tbody>
                         </table>
                   </div>
                </div>

                {/* Tabel Agregat Layanan Sekolah */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Layanan Sekolah</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi beban antrean layanan Cek Kesehatan Gratis Sekolah</p>
                   </div>
                   <button 
                      onClick={async () => {
                         const XLSX = await import('xlsx');
                         const data = [];
                         const allSekolah = [...new Set(layananSekolah.map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                         
                         allSekolah.forEach(namaSekolah => {
                            ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                               const visits = layananSekolah.filter(v => v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                               const count = visits.length;
                               if(count > 0) {
                                  let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                                  data.push({
                                     Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                                     'Jenjang Pendidikan': jenjang,
                                     'Nama Sekolah': namaSekolah,
                                     Kelas: 'Kelas ' + k,
                                     'Total Siswa': count,
                                     'Skrining Mandiri': countPos(visits, 'pos6'),
                                     'Skrining Fisik': countPos(visits, 'pos3')
                                  });
                               }
                            });
                         });
                         
                         const ws = XLSX.utils.json_to_sheet(data);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "Layanan Sekolah");
                         XLSX.writeFile(wb, "Tabel_Layanan_Sekolah.xlsx");
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
                               <th className="px-4 py-3 font-semibold text-center">Total Siswa</th>
                               <th className="px-4 py-3 font-semibold text-center">Skrining Mandiri</th>
                               <th className="px-4 py-3 font-semibold text-center">Skrining Fisik</th>
                            </tr>
                         </thead>
                         <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                            {(() => {
                               const rows = [];
                               const allSekolah = [...new Set(layananSekolah.map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                               
                               allSekolah.forEach(namaSekolah => {
                                  ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                                     const visits = layananSekolah.filter(v => v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                                     const count = visits.length;
                                     if(count > 0) {
                                        let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
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
                                              <td className="px-4 py-3 text-center">{formatNumber(countPos(visits, 'pos6'))}</td>
                                              <td className="px-4 py-3 text-center">{formatNumber(countPos(visits, 'pos3'))}</td>
                                           </tr>
                                        );
                                     }
                                  });
                               });
                               
                               if(rows.length === 0) {
                                   return <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-400">Belum ada data layanan sekolah.</td></tr>;
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
    console.log('Dashboard Layanan updated successfully!');
} else {
    console.log('Error: Could not find anchor for pelayanan menu block.');
}
