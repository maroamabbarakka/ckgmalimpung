const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert headerInfo logic
const headerLogic = `  const userName = sessionStorage.getItem('namaPegawai') || 'Administrator';
  
  const getHeaderTitle = () => {
    switch(activeMenu) {
      case 'pendaftaran': return { title: 'Dashboard Pemantauan Pendaftaran', subtitle: 'Data agregat pendaftar berdasarkan filter aktif.' };
      case 'kehadiran': return { title: 'Dashboard Pemantauan Kehadiran', subtitle: 'Rangkuman kehadiran peserta CKG.' };
      case 'pelayanan': return { title: 'Dashboard Pelayanan Pemeriksaan', subtitle: 'Pantauan beban antrean pos layanan.' };
      case 'wilayah': return { title: 'Peta Kondisi Kesehatan Wilayah Kerja', subtitle: 'Memetakan sebaran pemeriksaan CKG dan risiko PTM.' };
      case 'risiko': return { title: 'Master Control Peta Kritis', subtitle: 'Pemantauan strategis indikator kesehatan.' };
      case 'simpeg': return { title: 'Manajemen SIMPEG & Audit', subtitle: 'Manajemen SDM dan keamanan sistem.' };
      case 'laporan': return { title: 'Laporan CKG TERSANJUNG', subtitle: 'Unduh data pemeriksaan format excel.' };
      case 'privasi': return { title: 'Pemberitahuan Privasi', subtitle: 'Ketentuan penggunaan internal.' };
      default: return { title: 'Dashboard Admin', subtitle: 'Puskesmas Malimpung' };
    }
  };
  const headerInfo = getHeaderTitle();`;

content = content.replace(
  `  const userName = sessionStorage.getItem('namaPegawai') || 'Administrator';`,
  headerLogic
);

// 2. Sidebar Top: Move Logos here
content = content.replace(
  `<div className="px-7 py-7">
          <p className="text-lg font-black leading-none tracking-tight text-teal-700">TERSANJUNG</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Admin CKG Malimpung</p>
        </div>`,
  `<div className="px-6 py-6 flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <img src={LOGO_PINRANG} alt="Pinrang" className="h-8 w-auto drop-shadow-sm" />
              <img src={LOGO_MALIMPUNG} alt="Malimpung" className="h-8 w-auto drop-shadow-sm" />
            </div>
            <div className="mt-2">
              <p className="text-lg font-black leading-none tracking-tight text-teal-700">TERSANJUNG</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Admin CKG Malimpung</p>
            </div>
          </div>
        </div>`
);

// 3. Top Header: Use dynamic titles
content = content.replace(
  `<div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_PINRANG} alt="Kabupaten Pinrang" className="h-9 w-auto drop-shadow-sm" />
            <img src={LOGO_MALIMPUNG} alt="Puskesmas Malimpung" className="h-9 w-auto drop-shadow-sm" />
          </div>
          <div className="hidden sm:block border-l border-slate-200 pl-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600">
              {MENU.find(m => m.id === activeMenu)?.label || 'DASHBOARD ADMIN'}
            </p>
            <p className="text-xs font-semibold text-slate-500">Puskesmas Malimpung</p>
          </div>
        </div>`,
  `<div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tight text-slate-900 capitalize">{headerInfo.title}</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{headerInfo.subtitle}</p>
          </div>
        </div>`
);

// 4. Clean up redundant inner titles
// 4a. Data Agregat
content = content.replace(
  `<section>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Data Agregat</h2>`,
  `<section>`
);

// 4b. Master Control Peta Kritis
content = content.replace(
  `<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Master Control Peta Kritis</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Pemantauan strategis dan visualisasi komprehensif wilayah kerja Malimpung.</p>
                  </div>
                  <button type="button" onClick={() => setShowFilters(!showFilters)} className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition">
                    {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                  </button>
                </div>`,
  `<div className="flex justify-end">
                  <button type="button" onClick={() => setShowFilters(!showFilters)} className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 transition">
                    {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                  </button>
                </div>`
);

// 4c. Peta Kondisi Kesehatan Wilayah Kerja
content = content.replace(
  `<div>
                  <h2 className="text-2xl font-black text-slate-950">Peta Kondisi Kesehatan Wilayah Kerja</h2>
                  <p className="text-sm font-semibold text-slate-500">
                    Memetakan sebaran pemeriksaan CKG, risiko PTM, dan area yang perlu follow-up di Desa Malimpung, Desa Padang Loang, dan Kelurahan Maccirinna.
                  </p>
                </div>`,
  ``
);

// 4d. SIMPEG & Audit (Manajemen Nakes)
content = content.replace(
  `<div>
                        <h3 className="text-xl font-black text-slate-950">Manajemen Nakes</h3>
                        <p className="text-sm font-medium text-slate-500">Tambah, edit, aktif/nonaktifkan akun, dan reset PIN pegawai.</p>
                      </div>`,
  `<div className="text-sm font-semibold text-slate-600">Atur hak akses staf puskesmas</div>`
);

// 4e. Laporan 
content = content.replace(
  `<h2 className="text-lg font-black text-slate-950">Tentang laporan CKG TERSANJUNG</h2>`,
  ``
);

content = content.replace(
  `<h2 className="text-xl font-black text-slate-950">Daftar Laporan</h2>`,
  ``
);

fs.writeFileSync(file, content);
console.log('Update judul selesai.');
