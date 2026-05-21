const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for staffStatusFilter
const oldStateRegex = /const \[staffPosFilter, setStaffPosFilter\] = useState\('Semua'\);/;
const newState = `const [staffPosFilter, setStaffPosFilter] = useState('Semua');
  const [staffStatusFilter, setStaffStatusFilter] = useState('Semua');`;
content = content.replace(oldStateRegex, newState);

// 2. Update filteredStaff useMemo
const oldFilteredStaffRegex = /const filteredStaff = useMemo\(\(\) => \{[\s\S]*?\}, \[staffList, staffPosFilter, staffSearch\]\);/;
const newFilteredStaff = `const filteredStaff = useMemo(() => {
    const search = normalizeText(staffSearch);
    return staffList.filter((staff) => {
      const matchPos = staffPosFilter === 'Semua' || staff.pos === staffPosFilter;
      const matchStatus = staffStatusFilter === 'Semua' || staff.status === staffStatusFilter || (staffStatusFilter === 'MAGANG' && staff.status === 'KONSULTAN IT');
      const matchSearch =
        !search ||
        normalizeText(staff.nama).includes(search) ||
        normalizeText(staff.username).includes(search) ||
        normalizeText(Array.isArray(staff.role) ? staff.role.join(' ') : staff.role).includes(search) ||
        normalizeText(staff.status_detail || '').includes(search);
      return matchPos && matchStatus && matchSearch;
    });
  }, [staffList, staffPosFilter, staffStatusFilter, staffSearch]);`;
content = content.replace(oldFilteredStaffRegex, newFilteredStaff);

// 3. Add the select box in the UI
const oldGridRegex = /<div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-\[220px_1fr\]">/;
const newGrid = `<div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-[180px_180px_1fr]">`;
content = content.replace(oldGridRegex, newGrid);

const oldSelectRegex = /<select value=\{staffPosFilter\}[\s\S]*?<\/select>/;
const newSelects = `<select value={staffStatusFilter} onChange={(event) => setStaffStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-teal-500">
                        <option value="Semua">Semua Status</option>
                        <option value="ASN">ASN (PNS/PPPK)</option>
                        <option value="MAGANG">Non-ASN (Magang)</option>
                      </select>
                      <select value={staffPosFilter} onChange={(event) => setStaffPosFilter(event.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-teal-500">
                        {['Semua', 'POS 1', 'POS 2', 'POS 3', 'POS 4', 'ALL ACCESS', 'BELUM DITUGASKAN'].map((item) => (
                          <option key={item} value={item}>{item === 'Semua' ? 'Seluruh Pos' : item}</option>
                        ))}
                      </select>`;
content = content.replace(oldSelectRegex, newSelects);

fs.writeFileSync(file, content);
console.log('Filter status pegawai berhasil ditambahkan.');
