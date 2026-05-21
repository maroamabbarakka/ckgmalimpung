const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update getHeaderTitle function
const getHeaderTitleStart = `  const getHeaderTitle = () => {`;
const getHeaderTitleEnd = `  const headerInfo = getHeaderTitle();`;
const ghtIdx = content.indexOf(getHeaderTitleStart);
if (ghtIdx !== -1) {
    const ghtEndIdx = content.indexOf(getHeaderTitleEnd, ghtIdx) + getHeaderTitleEnd.length;
    const newGht = `  const getHeaderTitle = () => {
    switch(activeMenu) {
      case 'pendaftaran': return { title: 'Rangkuman Pendaftaran Cek Kesehatan Gratis', subtitle: 'Jumlah Pendaftar Cek Kesehatan Gratis' };
      case 'kehadiran': return { title: 'Rangkuman Kehadiran Cek Kesehatan Gratis', subtitle: 'Pemantauan Kehadiran Peserta Cek Kesehatan Gratis' };
      case 'pelayanan': return { title: 'Rangkuman Layanan Cek Kesehatan Gratis', subtitle: 'Distribusi Beban Antrean Layanan Cek Kesehatan Gratis' };
      case 'wilayah': return { title: 'Pemetaan Wilayah & Analitik Demografi CKG', subtitle: 'Pusat pemantauan strategis sebaran indikator kesehatan masyarakat.' };
      case 'laporan': return { title: 'Laporan & Ekspor Data CKG', subtitle: 'Unduh laporan format Excel terpadu.' };
      default: return null;
    }
  };
  const headerInfo = getHeaderTitle();`;
    content = content.substring(0, ghtIdx) + newGht + content.substring(ghtEndIdx);
}

// 2. Remove internal title blocks from activeMenu
// We will replace specific title blocks with empty fragments.

const removeBlocks = [
    // Laporan
    `<div className="mb-6 flex flex-col gap-1 border-b border-slate-200 pb-4">
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Laporan & Ekspor Data</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Unduh laporan format Excel untuk kebutuhan PKG.</p>
                  </div>`,
    
    // Pendaftaran
    `<div className="mb-2 flex flex-col border-b border-slate-200 pb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pemantauan Pendaftaran CKG</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Rangkuman distribusi pendaftar berdasarkan rentang usia dan sekolah.</p>
                </div>`,
                
    // Kehadiran
    `<div className="mb-2 flex flex-col border-b border-slate-200 pb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pemantauan Kehadiran CKG</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Rangkuman partisipasi dan tingkat penyelesaian layanan.</p>
                </div>`,
                
    // Layanan
    `<div className="mb-2 flex flex-col border-b border-slate-200 pb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Pemantauan Layanan CKG</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-1">Rangkuman distribusi beban antrean dan penyelesaian pos.</p>
                </div>`,
                
    // Wilayah
    `<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-950 tracking-tight">Pemetaan Wilayah & Analitik Demografi CKG</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Pusat pemantauan strategis sebaran indikator kesehatan masyarakat.</p>
                  </div>
                  <button type="button" onClick={() => setShowFilters(!showFilters)} className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition">
                    {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                  </button>
                </div>`
];

removeBlocks.forEach(block => {
    content = content.replace(block, '');
});

// 3. Inject Dynamic Title above the Global Filter Bar
const filterBarStart = `{/* Global Filter Bar */}`;
const fbIdx = content.indexOf(filterBarStart);
if (fbIdx !== -1) {
    const dynamicTitleUI = `
          {headerInfo && (
             <div className="mb-6 flex flex-col gap-1 border-b border-slate-200 pb-4 animate-in fade-in duration-500">
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">{headerInfo.title}</h2>
                <p className="text-sm font-semibold text-slate-500 mt-1">{headerInfo.subtitle}</p>
             </div>
          )}
          
          `;
    content = content.substring(0, fbIdx) + dynamicTitleUI + content.substring(fbIdx);
}

fs.writeFileSync(file, content);
console.log('Successfully moved filter data below the dynamic title!');
