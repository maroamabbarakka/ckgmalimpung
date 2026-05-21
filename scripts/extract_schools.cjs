const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add menu
content = content.replace(
  `{ id: 'wilayah', label: 'Peta Kesehatan Warga' },`,
  `{ id: 'sekolah', label: 'Data Sekolah & Anak' },\n  { id: 'wilayah', label: 'Peta Kesehatan Warga' },`
);

// 2. Add header title
content = content.replace(
  `case 'wilayah': return { title: 'Peta Kesehatan Warga', subtitle: 'Master control pemantauan indikator strategis dan risiko PTM wilayah kerja.' };`,
  `case 'sekolah': return { title: 'Data Sekolah & Anak', subtitle: 'Manajemen basis data sekolah dan sinkronisasi cakupan skrining CKG anak.' };\n      case 'wilayah': return { title: 'Peta Kesehatan Warga', subtitle: 'Master control pemantauan indikator strategis dan risiko PTM wilayah kerja.' };`
);

// 3. States & Handlers
// Find a good spot to insert states. Around `schoolSearch`.
content = content.replace(
  `const [schoolSearch, setSchoolSearch] = useState('');`,
  `const [schoolSearch, setSchoolSearch] = useState('');\n  const [schoolList, setSchoolList] = useState([]);\n  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);\n  const [editSchool, setEditSchool] = useState(null);\n  const [schoolMigrating, setSchoolMigrating] = useState(false);`
);

// Add useEffect listener
content = content.replace(
  `const unsubscribeStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {`,
  `const unsubscribeSchools = onSnapshot(collection(db, 'schools'), (snapshot) => {\n      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));\n      data.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));\n      setSchoolList(data);\n    });\n\n    const unsubscribeStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {`
);

// Cleanup listener
content = content.replace(
  `unsubscribeStaff();\n      unsubscribeLogs();`,
  `unsubscribeStaff();\n      unsubscribeLogs();\n      unsubscribeSchools();`
);

// Add handlers after handleMigrateStaff
const migrateStaffBlock = `alert('Berhasil impor data awal!');
    } catch (error) {
      console.error(error);
      alert('Gagal impor.');
    } finally {
      setMigrating(false);
    }
  };`;

const schoolHandlers = `

  const handleMigrateSchools = async () => {
    if (!window.confirm('Impor data awal sekolah dari seed data?')) return;
    setSchoolMigrating(true);
    try {
      for (const school of SCHOOL_SEEDS) {
        await addDoc(collection(db, 'schools'), { ...school, lastUpdated: new Date().toISOString() });
      }
      alert('Berhasil impor data sekolah!');
    } catch (error) {
      console.error(error);
      alert('Gagal impor.');
    } finally {
      setSchoolMigrating(false);
    }
  };

  const openSchoolForm = (school = null) => {
    setEditSchool(
      school || { name: '', level: 'SD', desa: 'Desa Malimpung', address: '', npsn: '-', source: 'Admin Input' }
    );
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (e) => {
    e.preventDefault();
    try {
      if (editSchool.id) {
        await updateDoc(doc(db, 'schools', editSchool.id), { ...editSchool, lastUpdated: new Date().toISOString() });
        logActivity('Edit Sekolah', \`Mengubah data \${editSchool.name}\`);
      } else {
        await addDoc(collection(db, 'schools'), { ...editSchool, lastUpdated: new Date().toISOString() });
        logActivity('Tambah Sekolah', \`Menambah data \${editSchool.name}\`);
      }
      setIsSchoolModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data sekolah.');
    }
  };`;

content = content.replace(migrateStaffBlock, migrateStaffBlock + schoolHandlers);

// 4. Change SCHOOL_SEEDS to schoolList in wilayahAnalytics
content = content.replace(
  `const schools = SCHOOL_SEEDS.filter((school) => {`,
  `const schools = schoolList.filter((school) => {`
);

// 5. Exclude from generic filters
content = content.replace(
  `{activeMenu !== 'privasi' && activeMenu !== 'simpeg' && activeMenu !== 'wilayah' && (`,
  `{activeMenu !== 'privasi' && activeMenu !== 'simpeg' && activeMenu !== 'wilayah' && activeMenu !== 'sekolah' && (`
);
content = content.replace(
  `{activeMenu !== 'laporan' && activeMenu !== 'privasi' && activeMenu !== 'wilayah' && activeMenu !== 'simpeg' && (`,
  `{activeMenu !== 'laporan' && activeMenu !== 'privasi' && activeMenu !== 'wilayah' && activeMenu !== 'simpeg' && activeMenu !== 'sekolah' && (`
);

// 6. Move section from wilayah to sekolah
// First, extract the section. The section in wilayah starts with `<section className="rounded-lg border border-slate-200 bg-white p-5">\n                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">\n                    <div>\n                      <h3 className="text-xl font-black text-slate-950">Sekolah Wilayah Kerja PKM Malimpung</h3>`
// Let's replace the whole section string with nothing, and then insert it above SIMPEG.
const oldSchoolSectionRegex = /<section className="rounded-lg border border-slate-200 bg-white p-5">\s*<div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">[\s\S]*?<\/section>/;

content = content.replace(oldSchoolSectionRegex, '');

// Now we insert the modified section for `sekolah`
const newSchoolSection = `
            {activeMenu === 'sekolah' && (
              <section className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">Basis Data Sekolah & Sinkronisasi</h3>
                      <p className="text-sm font-medium text-slate-500">
                        Cari, perbarui, dan validasi data sekolah. Data akan disinkronkan otomatis dengan kunjungan pasien (Klaster Anak/Siswa).
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {schoolList.length === 0 && (
                        <button type="button" onClick={handleMigrateSchools} disabled={schoolMigrating} className="rounded-lg border border-teal-200 px-4 py-2 text-xs font-black text-teal-700 hover:bg-teal-50 disabled:opacity-50">
                          {schoolMigrating ? 'Sinkronisasi...' : 'Impor Data Awal (Seed)'}
                        </button>
                      )}
                      <button type="button" onClick={() => openSchoolForm()} className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-teal-700">
                        + Tambah Sekolah
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-5 mb-5 flex">
                    <input
                      type="search"
                      value={schoolSearch}
                      onChange={(event) => setSchoolSearch(event.target.value)}
                      placeholder="Pencarian spesifik: nama sekolah, jenjang, desa, NPSN..."
                      className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 shadow-sm"
                    />
                  </div>

                  {wilayahAnalytics.schools.length === 0 ? (
                     <div className="py-12 text-center text-slate-500 font-semibold bg-slate-50 rounded-lg border border-dashed border-slate-300">Belum ada data sekolah atau pencarian tidak ditemukan.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {wilayahAnalytics.schools.map((school) => (
                        <div key={\`\${school.id}-\${school.name}\`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-slate-950 leading-tight">{school.name}</p>
                              <p className="mt-1 text-xs font-bold text-slate-500">
                                {school.level} - {school.desa}
                              </p>
                            </div>
                            <button type="button" onClick={() => openSchoolForm(school)} className="rounded-md bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-200">
                              Edit
                            </button>
                          </div>
                          
                          <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-600 border-l-2 border-slate-200 pl-3">{school.address || 'Alamat belum diatur'}</p>
                          <p className="mt-2 text-[10px] font-black text-slate-400">NPSN: <span className="text-slate-600">{school.npsn}</span></p>

                          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg bg-teal-50 p-3">
                              <p className="font-black text-teal-700 text-lg">{formatNumber(school.screened)}</p>
                              <p className="font-bold text-teal-700/80 mt-0.5">Siswa CKG terdeteksi</p>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-3">
                              <p className="font-black text-amber-700 text-lg">{formatNumber(school.desaStudentScreened)}</p>
                              <p className="font-bold text-amber-700/80 mt-0.5">Total CKG Anak Sedesa</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                            <span className={\`rounded-full px-3 py-1 text-[10px] font-black \${school.status === 'Terdeteksi di data' ? 'bg-emerald-50 text-emerald-700' : school.status === 'Perlu verifikasi sekolah' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}\`}>
                              {school.status}
                            </span>
                            <span className="text-[9px] font-black uppercase text-slate-400">{school.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
`;

content = content.replace(`{activeMenu === 'simpeg' && (`, newSchoolSection + `\n            {activeMenu === 'simpeg' && (`);

// 7. Add School Modal UI at the end
const schoolModalUI = `
      {isSchoolModalOpen && editSchool && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">{editSchool.id ? 'Edit Data Sekolah' : 'Tambah Sekolah Baru'}</h2>
                <p className="text-xs font-semibold text-slate-500">Pastikan penulisan nama spesifik agar deteksi data pasien akurat.</p>
              </div>
              <button type="button" onClick={() => setIsSchoolModalOpen(false)} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm hover:text-rose-600">
                Batal
              </button>
            </div>
            <form onSubmit={handleSaveSchool} className="overflow-y-auto p-6 space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Nama Sekolah Lengkap</span>
                <input value={editSchool.name} onChange={(e) => setEditSchool({ ...editSchool, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500" placeholder="Contoh: UPT SD Negeri 123 Pinrang" required />
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Jenjang</span>
                  <select value={editSchool.level} onChange={(e) => setEditSchool({ ...editSchool, level: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500">
                    <option value="TK/PAUD">TK/PAUD</option>
                    <option value="SD">SD</option>
                    <option value="MI">MI</option>
                    <option value="SMP">SMP</option>
                    <option value="MTs">MTs</option>
                    <option value="SMA">SMA</option>
                    <option value="MA">MA</option>
                    <option value="SMK">SMK</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">NPSN (Opsional)</span>
                  <input value={editSchool.npsn} onChange={(e) => setEditSchool({ ...editSchool, npsn: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500" placeholder="-" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block col-span-2">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Desa/Kelurahan</span>
                  <select value={editSchool.desa} onChange={(e) => setEditSchool({ ...editSchool, desa: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500">
                    <option value="Desa Malimpung">Desa Malimpung</option>
                    <option value="Desa Padang Loang">Desa Padang Loang</option>
                    <option value="Kelurahan Maccirinna">Kelurahan Maccirinna</option>
                  </select>
                </label>
                <label className="block col-span-2">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wider text-slate-500">Alamat Spesifik</span>
                  <input value={editSchool.address} onChange={(e) => setEditSchool({ ...editSchool, address: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500" placeholder="Alamat dusun/lingkungan" required />
                </label>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <button type="submit" className="w-full rounded-lg bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 shadow-md">
                  Simpan Data Sekolah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

const idx = content.lastIndexOf('    </div>');
if (idx !== -1) {
  content = content.substring(0, idx) + schoolModalUI + content.substring(idx);
}

fs.writeFileSync(file, content);
console.log('Ekstraksi data sekolah berhasil.');
