const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const endOfPendaftaranStr = `                   </div>
                </div>
            </section>
        );
    })()}`;

const newContent = `                   </div>
                </div>

                {/* Tabel Agregat Umum */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-slate-900">Tabel Agregat Umum</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pendaftaran Cek Kesehatan Gratis Umum</p>
                   </div>
                   <button 
                      onClick={async () => {
                         const XLSX = await import('xlsx');
                         const ws = XLSX.utils.json_to_sheet([{
                            Provinsi: 'Sulawesi Selatan', Kobko: 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'TEPPO',
                            'Total Pendaftar': totalUmum, 'Total Bayi': bayi, 'Total Anak': anakSekolah, 'Total Dewasa': dewasa, 'Total Lansia': lansia
                         }]);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "Agregat Umum");
                         XLSX.writeFile(wb, "Tabel_Agregat_Umum.xlsx");
                      }}
                      className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4 custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                         <thead>
                            <tr className="bg-slate-100/80 text-[10px] font-black text-slate-500 uppercase tracking-wider border-y border-slate-200">
                               <th className="p-3">Provinsi</th>
                               <th className="p-3">Kobko</th>
                               <th className="p-3">Kecamatan</th>
                               <th className="p-3">Puskesmas</th>
                               <th className="p-3 text-center">Total Pendaftar</th>
                               <th className="p-3 text-center">Total Bayi</th>
                               <th className="p-3 text-center">Total Anak</th>
                               <th className="p-3 text-center">Total Dewasa</th>
                               <th className="p-3 text-center">Total Lansia</th>
                            </tr>
                         </thead>
                         <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50">
                               <td className="p-3">Sulawesi Selatan</td>
                               <td className="p-3">Kab. Pinrang</td>
                               <td className="p-3">Patampanua</td>
                               <td className="p-3 uppercase">TEPPO</td>
                               <td className="p-3 text-center">{formatNumber(totalUmum)}</td>
                               <td className="p-3 text-center">{formatNumber(bayi)}</td>
                               <td className="p-3 text-center">{formatNumber(anakSekolah)}</td>
                               <td className="p-3 text-center">{formatNumber(dewasa)}</td>
                               <td className="p-3 text-center">{formatNumber(lansia)}</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Tabel Agregat Sekolah */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-slate-900">Tabel Agregat Sekolah</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pendaftaran Cek Kesehatan Gratis Sekolah</p>
                   </div>
                   <button 
                      onClick={async () => {
                         const XLSX = await import('xlsx');
                         const data = [];
                         ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                            const count = filteredVisits.filter(v => String(v.pos1?.kelas) === k).length;
                            if(count > 0) {
                               let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                               data.push({
                                  Provinsi: 'Sulawesi Selatan', Kobko: 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'TEPPO',
                                  'Jenjang Pendidikan': jenjang,
                                  Kelas: k,
                                  'Total Pendaftar': count,
                                  'Sudah Melengkapi': count,
                                  'Perlu Skrining': 0
                               });
                            }
                         });
                         const ws = XLSX.utils.json_to_sheet(data);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "Agregat Sekolah");
                         XLSX.writeFile(wb, "Tabel_Agregat_Sekolah.xlsx");
                      }}
                      className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4 custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                         <thead>
                            <tr className="bg-slate-100/80 text-[10px] font-black text-slate-500 uppercase tracking-wider border-y border-slate-200">
                               <th className="p-3">Provinsi</th>
                               <th className="p-3">Kobko</th>
                               <th className="p-3">Kecamatan</th>
                               <th className="p-3">Puskesmas</th>
                               <th className="p-3">Jenjang Pendidikan</th>
                               <th className="p-3 text-center">Kelas</th>
                               <th className="p-3 text-center">Total Pendaftar</th>
                               <th className="p-3 text-center">Sudah Melengkapi</th>
                               <th className="p-3 text-center">Perlu Skrining</th>
                            </tr>
                         </thead>
                         <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                            {['1','2','3','4','5','6','7','8','9','10','11','12'].map(k => {
                               const count = filteredVisits.filter(v => String(v.pos1?.kelas) === k).length;
                               if(count === 0) return null;
                               return (
                                 <tr key={k} className="hover:bg-slate-50">
                                    <td className="p-3">Sulawesi Selatan</td>
                                    <td className="p-3">Kab. Pinrang</td>
                                    <td className="p-3">Patampanua</td>
                                    <td className="p-3 uppercase">TEPPO</td>
                                    <td className="p-3">{parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat'}</td>
                                    <td className="p-3 text-center">Kelas {k}</td>
                                    <td className="p-3 text-center">{formatNumber(count)}</td>
                                    <td className="p-3 text-center">{formatNumber(count)}</td>
                                    <td className="p-3 text-center">0</td>
                                 </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>
                </div>
            </section>
        );
    })()}`;

if (content.includes(endOfPendaftaranStr)) {
    content = content.replace(endOfPendaftaranStr, newContent);
    fs.writeFileSync(file, content);
    console.log('Tables appended successfully!');
} else {
    console.log('Error: Could not find anchor to insert tables.');
}
