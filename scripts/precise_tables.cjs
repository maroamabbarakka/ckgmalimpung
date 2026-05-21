const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `{/* Tabel Agregat Umum */}`;
const endStr = `            </section>
        );
    })()}`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{/* Tabel Agregat Umum */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Umum</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pendaftaran Cek Kesehatan Gratis Umum</p>
                   </div>
                   <button 
                      onClick={async () => {
                         const XLSX = await import('xlsx');
                         
                         const getL = (cond) => filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Laki-Laki' && cond(v)).length;
                         const getP = (cond) => filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Perempuan' && cond(v)).length;
                         
                         const cBayi = v => getCluster(v) === 'Bayi/Balita';
                         const cAnak = v => v.pos1?.kategoriUmur === 'Usia sekolah 7-12 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 13-15 tahun' || v.pos1?.kategoriUmur === 'Usia sekolah 16 s.d <18 tahun';
                         const cDewasa = v => getCluster(v) === 'Dewasa';
                         const cLansia = v => getCluster(v) === 'Lansia';

                         const ws = XLSX.utils.json_to_sheet([{
                            Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                            'Total Pendaftar': totalUmum, 
                            'Total Bayi': bayi, 'Bayi Perempuan': getP(cBayi), 'Bayi Laki-Laki': getL(cBayi),
                            'Total Anak': getP(cAnak) + getL(cAnak), 'Anak Perempuan': getP(cAnak), 'Anak Laki-Laki': getL(cAnak),
                            'Total Dewasa': dewasa, 'Dewasa Perempuan': getP(cDewasa), 'Dewasa Laki-Laki': getL(cDewasa),
                            'Total Lansia': lansia, 'Lansia Perempuan': getP(cLansia), 'Lansia Laki-Laki': getL(cLansia)
                         }]);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "Agregat Umum");
                         XLSX.writeFile(wb, "Tabel_Agregat_Umum.xlsx");
                      }}
                      className="bg-[#16b3ac] hover:bg-[#11928c] text-white text-[13px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 mb-4 transition border-none"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Unduh tabel
                   </button>
                   
                   <div className="overflow-x-auto pb-4">
                      {(() => {
                         const getL = (cond) => filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Laki-Laki' && cond(v)).length;
                         const getP = (cond) => filteredVisits.filter(v => getCluster(v) !== 'Anak/Siswa' && v.pos1?.jenisKelamin === 'Perempuan' && cond(v)).length;
                         
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
                                  <th className="px-4 py-3 font-semibold text-center">Total Pendaftar</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Bayi</th>
                                  <th className="px-4 py-3 font-semibold text-center">Bayi Perempuan</th>
                                  <th className="px-4 py-3 font-semibold text-center">Bayi Laki - Laki</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Anak</th>
                                  <th className="px-4 py-3 font-semibold text-center">Anak Perempuan</th>
                                  <th className="px-4 py-3 font-semibold text-center">Anak Laki - Laki</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Dewasa</th>
                                  <th className="px-4 py-3 font-semibold text-center">Total Lansia</th>
                               </tr>
                            </thead>
                            <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                               <tr className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3">Sulawesi Selatan</td>
                                  <td className="px-4 py-3">Kab. Pinrang</td>
                                  <td className="px-4 py-3">Patampanua</td>
                                  <td className="px-4 py-3 uppercase">MALIMPUNG</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(totalUmum)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(bayi)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getP(cBayi))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getL(cBayi))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getP(cAnak) + getL(cAnak))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getP(cAnak))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(getL(cAnak))}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(dewasa)}</td>
                                  <td className="px-4 py-3 text-center">{formatNumber(lansia)}</td>
                               </tr>
                            </tbody>
                         </table>
                         );
                      })()}
                   </div>
                </div>

                {/* Tabel Agregat Sekolah */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 overflow-hidden">
                   <div className="flex flex-col mb-4">
                      <h3 className="text-lg font-black text-[#343434]">Tabel Agregat Sekolah</h3>
                      <p className="text-xs font-semibold text-slate-500">Detail agregasi dari pendaftaran Cek Kesehatan Gratis Sekolah</p>
                   </div>
                   <button 
                      onClick={async () => {
                         const XLSX = await import('xlsx');
                         const data = [];
                         const allSekolah = [...new Set(filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa').map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                         
                         allSekolah.forEach(namaSekolah => {
                            ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                               const visits = filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
                               const count = visits.length;
                               if(count > 0) {
                                  let jenjang = parseInt(k) <= 6 ? 'SD/MI/Sederajat' : parseInt(k) <= 9 ? 'SMP/MTs/Sederajat' : 'SMA/MA/Sederajat';
                                  const selesaiCount = visits.filter(v => v.pos6).length;
                                  data.push({
                                     Provinsi: 'Sulawesi Selatan', 'Kab/Kota': 'Kab. Pinrang', Kecamatan: 'Patampanua', Puskesmas: 'MALIMPUNG',
                                     'Jenjang Pendidikan': jenjang,
                                     'Nama Sekolah': namaSekolah,
                                     Kelas: 'Kelas ' + k,
                                     'Total Pendaftar': count,
                                     'Sudah Melengkapi Skrining Mandiri': selesaiCount,
                                     'Perlu Skrining Mandiri': count - selesaiCount,
                                     'Jumlah Peserta': count
                                  });
                               }
                            });
                         });
                         
                         const ws = XLSX.utils.json_to_sheet(data);
                         const wb = XLSX.utils.book_new();
                         XLSX.utils.book_append_sheet(wb, ws, "Agregat Sekolah");
                         XLSX.writeFile(wb, "Tabel_Agregat_Sekolah.xlsx");
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
                               <th className="px-4 py-3 font-semibold text-center">Total Pendaftar</th>
                               <th className="px-4 py-3 font-semibold text-center">Sudah Melengkapi Skrining Mandiri</th>
                               <th className="px-4 py-3 font-semibold text-center">Perlu Skrining Mandiri</th>
                               <th className="px-4 py-3 font-semibold text-center">Jumlah Peserta</th>
                            </tr>
                         </thead>
                         <tbody className="text-[13px] font-medium text-[#374151] divide-y divide-[#f3f4f6]">
                            {(() => {
                               const rows = [];
                               const allSekolah = [...new Set(filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa').map(v => v.pos1?.sekolah || 'Tidak Diketahui'))];
                               
                               allSekolah.forEach(namaSekolah => {
                                  ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(k => {
                                     const visits = filteredVisits.filter(v => getCluster(v) === 'Anak/Siswa' && v.pos1?.sekolah === namaSekolah && String(v.pos1?.kelas) === k);
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
                                              <td className="px-4 py-3 text-center">{formatNumber(count)}</td>
                                           </tr>
                                        );
                                     }
                                  });
                               });
                               
                               if(rows.length === 0) {
                                   return <tr><td colSpan="11" className="px-4 py-8 text-center text-slate-400">Belum ada data pendaftar sekolah.</td></tr>;
                               }
                               return rows;
                            })()}
                         </tbody>
                      </table>
                   </div>
                </div>`;
    
    content = content.substring(0, startIdx) + replacement + '\n' + content.substring(endIdx);
    fs.writeFileSync(file, content);
    console.log('Tables updated with precise real data logic and exact styling!');
} else {
    console.log('Could not find start/end anchor.');
}
