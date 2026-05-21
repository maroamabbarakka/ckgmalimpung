const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 0. Import deleteDoc
content = content.replace("updateDoc, writeBatch", "updateDoc, writeBatch, deleteDoc");

// 1. Fix the dependency array
content = content.replace('}, [filteredVisits, schoolSearch]);', '}, [filteredVisits, schoolSearch, schoolList]);');

// 2. Remove AUTO_SCHOOL_SEEDS and useEffect
const autoInjectRegex = /const AUTO_SCHOOL_SEEDS = \[\s*\{ name: "UPT SD NEGERI 258 PINRANG"[\s\S]*?\}\s*\];\s*useEffect\(\(\) => \{[\s\S]*?\}, \[schoolList\]\);\s*/;
content = content.replace(autoInjectRegex, '');

// 3. Add cleanDuplicates function and button
const resetFilterRegex = /const resetFilter = \(\) => \{\n    setFilters\(\{ year: 'Semua', month: 'Semua', desa: 'Semua', dusun: 'Semua', cluster: 'Semua', status: 'Semua' \}\);\n  \};\n/;

const cleanDuplicatesFunc = `const resetFilter = () => {
    setFilters({ year: 'Semua', month: 'Semua', desa: 'Semua', dusun: 'Semua', cluster: 'Semua', status: 'Semua' });
  };

  const cleanDuplicates = async () => {
    if (!window.confirm('Bersihkan data ganda? (Total db: ' + schoolList.length + ')')) return;
    try {
      const snap = await getDocs(collection(db, 'schools'));
      const unique = new Set();
      let deleted = 0;
      for (const item of snap.docs) {
        const name = item.data().name || '';
        if (unique.has(name)) {
          // It's a duplicate, delete it
          await deleteDoc(item.ref);
          deleted++;
        } else {
          unique.add(name);
        }
      }
      alert(\`Berhasil membersihkan \${deleted} data ganda!\`);
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };
`;
content = content.replace(resetFilterRegex, cleanDuplicatesFunc);

// 4. Inject button next to Tambah Sekolah
const btnRegex = /<button type="button" onClick=\{[\s\S]*?openSchoolForm\(\)\} className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-teal-700">/;
const newBtn = `<button type="button" onClick={cleanDuplicates} className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 mr-2 shadow-sm">
                          Hapus Duplikat
                        </button>
                        <button type="button" onClick={() => openSchoolForm()} className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-teal-700">`;
content = content.replace(btnRegex, newBtn);

fs.writeFileSync(file, content);
console.log('Fixes applied successfully v2.');
