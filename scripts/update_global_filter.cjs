const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Filters State
const stateStart = `  const [filters, setFilters] = useState({`;
const stateEnd = `  });`;
const stateIdx = content.indexOf(stateStart);
const stateEndIdx = content.indexOf(stateEnd, stateIdx) + stateEnd.length;

const newState = `  const [filters, setFilters] = useState({
    tahun: 'Semua',
    bulan: 'Semua',
    jenjang: 'Semua',
    sekolah: 'Semua',
    kelas: 'Semua',
    usia: 'Semua'
  });`;

content = content.substring(0, stateIdx) + newState + content.substring(stateEndIdx);

// Replace filteredVisits Logic
const fvStart = `  const filteredVisits = useMemo(() => {`;
const fvEnd = `  }, [enrichedVisits, filters]);`;
const fvIdx = content.indexOf(fvStart);
const fvEndIdx = content.indexOf(fvEnd, fvIdx) + fvEnd.length;

const newFv = `  const filteredVisits = useMemo(() => {
    return enrichedVisits.filter((visit) => {
      const visitDate = visit._date;
      const matchTahun = filters.tahun === 'Semua' || String(visitDate?.getFullYear()) === filters.tahun;
      const matchBulan = filters.bulan === 'Semua' || visitDate?.getMonth() === MONTHS.indexOf(filters.bulan);
      
      let matchJenjang = true;
      if (filters.jenjang !== 'Semua') {
          const k = String(visit.pos1?.kelas || '');
          let j = '';
          if (k) {
              const ki = parseInt(k);
              if (ki <= 6) j = 'SD/MI/Sederajat';
              else if (ki <= 9) j = 'SMP/MTs/Sederajat';
              else if (ki <= 12) j = 'SMA/MA/Sederajat';
          }
          matchJenjang = (j === filters.jenjang);
      }

      const matchSekolah = filters.sekolah === 'Semua' || visit.pos1?.sekolah === filters.sekolah;
      const matchKelas = filters.kelas === 'Semua' || String(visit.pos1?.kelas) === filters.kelas.replace('Kelas ', '');
      
      let matchUsia = true;
      if (filters.usia !== 'Semua') {
          const ageNum = visit._age !== undefined ? visit._age : -1;
          const u = filters.usia;
          if(u.includes('Tahun')) {
              const target = parseInt(u);
              matchUsia = (ageNum === target);
          } else if(u.includes('Bulan') || u.includes('Hari')) {
              matchUsia = (ageNum === 0);
          }
      }

      return matchTahun && matchBulan && matchJenjang && matchSekolah && matchKelas && matchUsia;
    });
  }, [enrichedVisits, filters]);`;

content = content.substring(0, fvIdx) + newFv + content.substring(fvEndIdx);

// Replace the old showFilters component in activeMenu === 'wilayah'
const oldFilterUIStart = `{showFilters && (`;
const oldFilterUIEnd = `)}

                {/* Bagian PTM */}`;
const oldFilterIdx = content.indexOf(oldFilterUIStart);
if (oldFilterIdx !== -1) {
    const oldFilterEndIdx = content.indexOf(oldFilterUIEnd, oldFilterIdx) + oldFilterUIEnd.length;
    content = content.substring(0, oldFilterIdx) + `{/* Bagian PTM */}` + content.substring(oldFilterEndIdx);
}

// Inject New Global Filter Bar
const uiAnchor = `<div className="flex-1 p-4 lg:p-8">`;
const uiIdx = content.indexOf(uiAnchor);

const globalFilterUI = `<div className="flex-1 p-4 lg:p-8">
          {/* Global Filter Bar */}
          <div className="mb-8 border-b border-slate-200 pb-6 animate-in slide-in-from-top-4">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Tahun</label>
                   <select value={filters.tahun} onChange={e => setFilters({...filters, tahun: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      {['2026', '2025', '2024'].map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Bulan</label>
                   <select value={filters.bulan} onChange={e => setFilters({...filters, bulan: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Provinsi</label>
                   <select disabled className="border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <option>Sulawesi Selatan</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Kabupaten/Kota</label>
                   <select disabled className="border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <option>Kab. Pinrang</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Kecamatan</label>
                   <select disabled className="border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <option>Patampanua</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Puskesmas</label>
                   <select disabled className="border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 text-slate-400 cursor-not-allowed">
                      <option>MALIMPUNG</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Jenjang Pendidikan</label>
                   <select value={filters.jenjang} onChange={e => setFilters({...filters, jenjang: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      <option value="SD/MI/Sederajat">SD/MI/Sederajat</option>
                      <option value="SMP/MTs/Sederajat">SMP/MTs/Sederajat</option>
                      <option value="SMA/MA/Sederajat">SMA/MA/Sederajat</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Sekolah</label>
                   <select value={filters.sekolah} onChange={e => setFilters({...filters, sekolah: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      {/* Dynamic schools will be populated, for now statically show option to select */}
                      {[...new Set(enrichedVisits.map(v => v.pos1?.sekolah).filter(Boolean))].map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                   </select>
                </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Kelas</label>
                   <select value={filters.kelas} onChange={e => setFilters({...filters, kelas: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      {['1','2','3','4','5','6','7','8','9','10','11','12'].map(k => <option key={k} value={\`Kelas \${k}\`}>Kelas {k}</option>)}
                   </select>
                </div>
                <div className="flex flex-col">
                   <label className="text-[10px] font-bold text-slate-500 mb-1">Usia</label>
                   <select value={filters.usia} onChange={e => setFilters({...filters, usia: e.target.value})} className="border border-slate-300 rounded-lg text-xs p-2.5 outline-none focus:border-teal-500 bg-white">
                      <option value="Semua">Semua</option>
                      <option value="0 - 28 Hari">0 - 28 Hari</option>
                      <option value="1 - 4 Bulan">1 - 4 Bulan</option>
                      <option value="5 - 11 Bulan">5 - 11 Bulan</option>
                      {[...Array(20).keys()].map(i => <option key={i+1} value={\`\${i+1} Tahun\`}>{i+1} Tahun</option>)}
                      <option value="Lansia">Lebih dari 20 Tahun</option>
                   </select>
                </div>
                <div className="flex flex-col">
                   <button onClick={() => setFilters({tahun:'Semua',bulan:'Semua',jenjang:'Semua',sekolah:'Semua',kelas:'Semua',usia:'Semua'})} className="bg-[#00b8ac] hover:bg-[#009c91] text-white text-xs font-bold py-2.5 rounded-lg border-none shadow-sm transition h-[38px]">
                      Reset Filter
                   </button>
                </div>
             </div>
          </div>`;

content = content.substring(0, uiIdx) + globalFilterUI + content.substring(uiIdx + uiAnchor.length);

fs.writeFileSync(file, content);
console.log('Global Filter applied across all dashboards!');
