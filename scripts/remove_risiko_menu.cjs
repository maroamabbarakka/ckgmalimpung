const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update MENU array
content = content.replace(
  `const MENU = [
  { id: 'risiko', label: 'Peta Kritis' },
  { id: 'wilayah', label: 'Peta Wilayah' },`,
  `const MENU = [
  { id: 'wilayah', label: 'Peta Kesehatan Warga' },`
);

// 2. Update getHeaderTitle function
content = content.replace(
  `case 'wilayah': return { title: 'Peta Kondisi Kesehatan Wilayah Kerja', subtitle: 'Memetakan sebaran pemeriksaan CKG dan risiko PTM.' };
      case 'risiko': return { title: 'Master Control Peta Kritis', subtitle: 'Pemantauan strategis indikator kesehatan.' };`,
  `case 'wilayah': return { title: 'Peta Kesehatan Warga', subtitle: 'Master control pemantauan indikator strategis dan risiko PTM wilayah kerja.' };`
);

// 3. Update initialMenu
content = content.replace(
  `function AdminDashboard({ initialMenu = 'risiko' }) {`,
  `function AdminDashboard({ initialMenu = 'wilayah' }) {`
);
content = content.replace(
  `const [activeMenu, setActiveMenu] = useState(initialMenu);`,
  `const [activeMenu, setActiveMenu] = useState(initialMenu);`
); // no change needed here if it uses initialMenu

// 4. Update global filter condition (hide for wilayah instead of risiko)
content = content.replace(
  `{activeMenu !== 'privasi' && activeMenu !== 'simpeg' && activeMenu !== 'risiko' && (`,
  `{activeMenu !== 'privasi' && activeMenu !== 'simpeg' && activeMenu !== 'wilayah' && (`
);

// 5. Update shared Data Agregat condition (remove risiko, wilayah is already there)
content = content.replace(
  `{activeMenu !== 'laporan' && activeMenu !== 'privasi' && activeMenu !== 'wilayah' && activeMenu !== 'simpeg' && activeMenu !== 'risiko' && (`,
  `{activeMenu !== 'laporan' && activeMenu !== 'privasi' && activeMenu !== 'wilayah' && activeMenu !== 'simpeg' && (`
);

// 6. Rename the risiko section condition to wilayah
content = content.replace(
  `{activeMenu === 'risiko' && (`,
  `{activeMenu === 'wilayah' && (`
);

fs.writeFileSync(file, content);
console.log('Merge Peta Kritis ke Peta Wilayah selesai.');
