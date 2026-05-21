const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldSidebarBlock = `<div className="mx-3 border-t border-slate-200 py-4">
          <p className="px-3 pb-2 text-sm font-black text-slate-950">CKG Umum</p>
          <Link to="/" className="w-full text-left px-4 py-2.5 my-0.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-2">
            Kembali ke Beranda
          </Link>
          {MENU.slice(0, 5).map((item) => (
            <SidebarItem key={item.id} item={item} active={activeMenu === item.id} onClick={setActiveMenu} />
          ))}
        </div>
        <div className="mx-3 border-t border-slate-200 py-4">
          <p className="px-3 pb-2 text-sm font-black text-slate-950">Manajemen</p>
          {MENU.slice(5).map((item) => (
            <SidebarItem key={item.id} item={item} active={activeMenu === item.id} onClick={setActiveMenu} />
          ))}
        </div>`;

const newSidebarBlock = `<div className="flex-1 overflow-y-auto px-3 pb-4">
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

if (content.includes('MENU.slice(0, 5)')) {
  content = content.replace(oldSidebarBlock, newSidebarBlock);
  fs.writeFileSync(file, content);
  console.log('Sidebar menus successfully updated!');
} else {
  console.log('Sidebar menus not found or already updated.');
}
