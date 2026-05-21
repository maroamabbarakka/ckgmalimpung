const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update MENU array
const oldMenu = `const MENU = [
  { id: 'sekolah', label: 'Data Sekolah & Anak' },
  { id: 'wilayah', label: 'Peta Kesehatan Warga' },
  { id: 'pendaftaran', label: 'Dashboard Pendaftaran' },
  { id: 'kehadiran', label: 'Dashboard Kehadiran' },
  { id: 'pelayanan', label: 'Dashboard Layanan' },
  { id: 'simpeg', label: 'SIMPEG & Audit' },
  { id: 'laporan', label: 'Laporan CKG' },
  { id: 'privasi', label: 'Ketentuan & Privasi' }
];`;

const newMenu = `const MENU = [
  { id: 'wilayah', label: 'Peta Kesehatan Warga' },
  { id: 'pendaftaran', label: 'Dashboard Pendaftaran' },
  { id: 'kehadiran', label: 'Dashboard Kehadiran' },
  { id: 'pelayanan', label: 'Dashboard Layanan' },
  { id: 'simpeg', label: 'SIMPEG & Audit' },
  { id: 'laporan', label: 'Laporan CKG' },
  { id: 'sekolah', label: 'Data Sekolah & Anak' },
  { id: 'privasi', label: 'Ketentuan & Privasi' }
];`;

content = content.replace(oldMenu, newMenu);

// 2. Update the sidebar layout
// First, replace the aside tag to flex
content = content.replace(
  `<aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white shadow-[8px_0_24px_rgba(15,23,42,0.07)] lg:block">`,
  `<aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white shadow-[8px_0_24px_rgba(15,23,42,0.07)] lg:flex">`
);

// Second, wrap the menu sections in flex-1 overflow-y-auto
const menuBlockStartRegex = /<div className="mx-3 border-t border-slate-200 py-4">[\s\S]*?<p className="px-3 pb-2 text-sm font-black text-slate-950">CKG Umum<\/p>[\s\S]*?<Link to="\/" className="w-full text-left px-4 py-2\.5 my-0\.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-2">[\s\S]*?Kembali ke Beranda[\s\S]*?<\/Link>[\s\S]*?\{MENU\.slice\(0, 5\)\.map\(\(item\) => \([\s\S]*?<SidebarItem key=\{item\.id\} item=\{item\} active=\{activeMenu === item\.id\} onClick=\{setActiveMenu\} \/>[\s\S]*?\}\)[\s\S]*?<\/div>[\s\S]*?<div className="mx-3 border-t border-slate-200 py-4">[\s\S]*?<p className="px-3 pb-2 text-sm font-black text-slate-950">Manajemen<\/p>[\s\S]*?\{MENU\.slice\(5\)\.map\(\(item\) => \([\s\S]*?<SidebarItem key=\{item\.id\} item=\{item\} active=\{activeMenu === item\.id\} onClick=\{setActiveMenu\} \/>[\s\S]*?\}\)[\s\S]*?<\/div>/;

const newMenuBlock = `<div className="flex-1 overflow-y-auto px-3 pb-4">
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

content = content.replace(menuBlockStartRegex, newMenuBlock);

// Third, replace the logout button and add the Beranda button
const logoutRegex = /<button type="button" onClick=\{handleLogout\} className="absolute bottom-6 left-6 text-sm font-semibold text-rose-600">[\s\S]*?Keluar[\s\S]*?<\/button>/;

const newBottomButtons = `<div className="border-t border-slate-200 p-4 space-y-2 bg-slate-50">
          <Link to="/" className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-slate-800">
            Kembali ke Beranda
          </Link>
          <button type="button" onClick={handleLogout} className="w-full rounded-xl border-2 border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700">
            Keluar Sistem
          </button>
        </div>`;

content = content.replace(logoutRegex, newBottomButtons);

fs.writeFileSync(file, content);
console.log('Menu berhasil diatur ulang.');
