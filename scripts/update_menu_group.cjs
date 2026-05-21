const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update MENU array
const oldMenu = `const MENU = [
  { id: 'wilayah', label: 'Peta Kesehatan Warga' },
  { id: 'pendaftaran', label: 'Dashboard Pendaftaran' },
  { id: 'kehadiran', label: 'Dashboard Kehadiran' },
  { id: 'pelayanan', label: 'Dashboard Layanan' },
  { id: 'simpeg', label: 'SIMPEG & Audit' },
  { id: 'laporan', label: 'Laporan CKG' },
  { id: 'sekolah', label: 'Data Sekolah & Anak' },
  { id: 'privasi', label: 'Ketentuan & Privasi' }
];`;

const newMenu = `const MENU = [
  { id: 'wilayah', label: 'Peta Kesehatan Warga' },
  { id: 'pendaftaran', label: 'Dashboard Pendaftaran' },
  { id: 'kehadiran', label: 'Dashboard Kehadiran' },
  { id: 'pelayanan', label: 'Dashboard Layanan' },
  { id: 'laporan', label: 'Laporan CKG' },
  { id: 'simpeg', label: 'SIMPEG & Audit' },
  { id: 'sekolah', label: 'Data Sekolah & Anak' },
  { id: 'privasi', label: 'Ketentuan & Privasi' }
];`;

content = content.replace(oldMenu, newMenu);

// 2. Update sidebar rendering
const oldSidebar = `<div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="border-t border-slate-200 py-4">
            <p className="px-3 pb-2 text-sm font-black text-slate-950">CKG Umum</p>
            {MENU.slice(0, 4).map((item) => (
              <SidebarItem key={item.id} item={item} active={activeMenu === item.id} onClick={setActiveMenu} />
            ))}
          </div>
          <div className="border-t border-slate-200 py-4">
            <p className="px-3 pb-2 text-sm font-black text-slate-950">Manajemen</p>
            {MENU.slice(4).map((item) => (
              <SidebarItem key={item.id} item={item} active={activeMenu === item.id} onClick={setActiveMenu} />
            ))}
          </div>
        </div>`;

const newSidebar = `<div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="border-t border-slate-200 py-4">
            <p className="px-3 pb-2 text-sm font-black text-slate-950">Informasi Umum</p>
            {MENU.slice(0, 5).map((item) => (
              <SidebarItem key={item.id} item={item} active={activeMenu === item.id} onClick={setActiveMenu} />
            ))}
          </div>
          <div className="border-t border-slate-200 py-4">
            <p className="px-3 pb-2 text-sm font-black text-slate-950">Manajemen</p>
            {MENU.slice(5).map((item) => (
              <SidebarItem key={item.id} item={item} active={activeMenu === item.id} onClick={setActiveMenu} />
            ))}
          </div>
        </div>`;

content = content.replace(oldSidebar, newSidebar);

fs.writeFileSync(file, content);
console.log('Perubahan nama kelompok dan urutan menu berhasil dilakukan.');
