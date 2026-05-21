const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
const stateTarget = `const [selectedRiskPatient, setSelectedRiskPatient] = useState(null);`;
if (!content.includes('const [selectedSchoolPatients, setSelectedSchoolPatients] = useState(null);')) {
    content = content.replace(stateTarget, stateTarget + '\n  const [selectedSchoolPatients, setSelectedSchoolPatients] = useState(null);');
}

// 2. Add patients to wilayahAnalytics
const mapTarget = `status: matchedVisits.length > 0 ? 'Terdeteksi di data' : desaVisits.length > 0 ? 'Perlu verifikasi sekolah' : 'Perlu follow-up'\n      };`;
const mapReplacement = `status: matchedVisits.length > 0 ? 'Terdeteksi di data' : desaVisits.length > 0 ? 'Perlu verifikasi sekolah' : 'Perlu follow-up',\n        patients: matchedVisits\n      };`;
content = content.replace(mapTarget, mapReplacement);

// 3. Update the UI layout
const newUI = `{wilayahAnalytics.schools.length === 0 ? (
                     <div className="py-12 text-center text-slate-500 font-semibold bg-slate-50 rounded-lg border border-dashed border-slate-300">Belum ada data sekolah atau pencarian tidak ditemukan. (Total Database: {schoolList.length})</div>
                  ) : (
                    <div className="space-y-8">
                      {['SD/MI', 'SMP/MTs', 'SMA/SMK/MA', 'TK/PAUD/Lainnya'].map(group => {
                         const groupSchools = wilayahAnalytics.schools.filter(s => {
                           if (group === 'SD/MI') return ['SD', 'MI'].includes(s.level);
                           if (group === 'SMP/MTs') return ['SMP', 'MTs'].includes(s.level);
                           if (group === 'SMA/SMK/MA') return ['SMA', 'SMK', 'MA'].includes(s.level);
                           return !['SD','MI','SMP','MTs','SMA','SMK','MA'].includes(s.level);
                         });
                         
                         if (groupSchools.length === 0) return null;
                         
                         return (
                           <div key={group} className="animate-in fade-in duration-500">
                             <h4 className="text-xl font-black text-slate-800 mb-4 pb-2 border-b border-slate-200">{group}</h4>
                             <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                               {groupSchools.map(school => (
                                 <div key={\`\${school.id}-\${school.name}\`} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-teal-300">
                                   <div className="flex items-start justify-between gap-3">
                                     <div>
                                       <p className="font-black text-slate-950 leading-tight">{school.name}</p>
                                       <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                         {school.level} - {school.desa}
                                       </p>
                                     </div>
                                     <button type="button" onClick={() => openSchoolForm(school)} className="rounded-md bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-200">
                                       Edit
                                     </button>
                                   </div>
                                   
                                   <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-600 border-l-2 border-slate-200 pl-3">{school.address || 'Alamat belum diatur'}</p>
                                   <p className="mt-2 text-[10px] font-black text-slate-400">NPSN: <span className="text-slate-600">{school.npsn}</span></p>

                                   <div className="mt-5 grid grid-cols-2 gap-3 text-xs flex-1">
                                     <div className="rounded-lg bg-teal-50 p-3 flex flex-col justify-center">
                                       <p className="font-black text-teal-700 text-lg">{formatNumber(school.screened)}</p>
                                       <p className="font-bold text-teal-700/80 mt-0.5">Siswa Terdeteksi</p>
                                     </div>
                                     <div className="rounded-lg bg-amber-50 p-3 flex flex-col justify-center">
                                       <p className="font-black text-amber-700 text-lg">{formatNumber(school.desaStudentScreened)}</p>
                                       <p className="font-bold text-amber-700/80 mt-0.5">Siswa Sedesa</p>
                                     </div>
                                   </div>
                                   
                                   <div className="mt-4 pt-4 border-t border-slate-100">
                                      <button 
                                        type="button" 
                                        onClick={() => setSelectedSchoolPatients(school)}
                                        disabled={!school.patients || school.patients.length === 0}
                                        className={\`w-full rounded-lg py-2.5 text-xs font-black transition-colors \${school.patients && school.patients.length > 0 ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}\`}
                                      >
                                        {school.patients && school.patients.length > 0 ? \`Lihat \${school.patients.length} Pasien Terhubung\` : 'Belum Ada Pasien Terhubung'}
                                      </button>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         );
                      })}
                    </div>
                  )}`;

if (content.includes('Belum ada data sekolah atau pencarian tidak ditemukan')) {
    const startIdx = content.indexOf('{wilayahAnalytics.schools.length === 0 ? (');
    const endStr = '</div>\n                  )}';
    let endIdx = content.indexOf(endStr, startIdx);
    if(endIdx !== -1) {
       endIdx += endStr.length;
       content = content.substring(0, startIdx) + newUI + content.substring(endIdx);
    }
}

// 4. Add the School Patients Modal
const modalJSX = `
      {selectedSchoolPatients && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">Koneksi Pasien: {selectedSchoolPatients.name}</h2>
                <p className="text-xs font-semibold text-slate-500">Daftar siswa CKG yang terhubung dengan sekolah ini.</p>
              </div>
              <button type="button" onClick={() => setSelectedSchoolPatients(null)} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm hover:text-rose-600">
                Tutup
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-slate-50">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSchoolPatients.patients.map(visit => (
                     <div key={visit.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-300 transition">
                        <p className="font-black text-slate-900 text-sm truncate">{visit.pasien_snapshot?.nama || visit.patientNIK || 'Tanpa Nama'}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{visit.pasien_snapshot?.nik || visit.patientNIK}</p>
                        
                        <div className="mt-3 space-y-1 text-xs">
                           <p><span className="font-semibold text-slate-400">Kelas:</span> <span className="font-bold text-slate-700">{visit.pos1?.kelas || '-'}</span></p>
                           <p><span className="font-semibold text-slate-400">TTL:</span> <span className="font-bold text-slate-700">{visit.pasien_snapshot?.tgl_lahir || '-'}</span></p>
                           <p><span className="font-semibold text-slate-400">Desa:</span> <span className="font-bold text-slate-700">{getDesa(visit)}</span></p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                           <span className={\`text-[10px] font-black px-2 py-1 rounded-md \${isCompleted(visit) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}\`}>
                              {isCompleted(visit) ? 'Pemeriksaan Selesai' : 'Sedang Berjalan'}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400">{formatWaktu(getVisitDate(visit))}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('selectedSchoolPatients &&')) {
    content = content.replace('{isStaffModalOpen && editStaff && (', modalJSX + '\n      {isStaffModalOpen && editStaff && (');
}

fs.writeFileSync(file, content);
console.log('Successfully enhanced school connection UI!');
