const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add sidebar state
const stateTarget = `const [selectedSchoolPatients, setSelectedSchoolPatients] = useState(null);`;
if (!content.includes('const [sidebarOpen, setSidebarOpen] = useState(false);')) {
    content = content.replace(stateTarget, stateTarget + '\n  const [sidebarOpen, setSidebarOpen] = useState(false);');
}

// 2. Fix sidebar classes
const asideOld = `<aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white shadow-[8px_0_24px_rgba(15,23,42,0.07)] lg:flex">`;
const asideNew = `      {sidebarOpen && (
        <div className="fixed inset-0 z-[15] bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={\`fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-slate-200 bg-white shadow-[8px_0_24px_rgba(15,23,42,0.07)] transition-transform duration-300 \${sidebarOpen ? 'translate-x-0 flex' : '-translate-x-full hidden lg:flex'} lg:translate-x-0\`}>`;
content = content.replace(asideOld, asideNew);

// 3. Make sidebar items close sidebar on mobile
const onClickReplacement = `onClick={(id) => { setActiveMenu(id); setSidebarOpen(false); }}`;
content = content.replace(/onClick=\{setActiveMenu\}/g, onClickReplacement);

fs.writeFileSync(file, content);
console.log('Fixed sidebar state and mobile overlay.');
