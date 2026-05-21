const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace SCHOOL_SEEDS
const oldSchoolsRegex = /const SCHOOL_SEEDS = \[[\s\S]*?\];/;
const newSchools = `const SCHOOL_SEEDS = [
  { name: "UPT SD NEGERI 258 PINRANG", npsn: "40305052", level: "SD", status: "NEGERI", address: "Takkalalla Timur", desa: "Kelurahan Maccirinna" },
  { name: "MIS DDI TAKKALALLA TIMUR", npsn: "60723874", level: "MI", status: "SWASTA", address: "Takkalalla Timur", desa: "Kelurahan Maccirinna" },
  { name: "RA/BA/TA DDI TAKKALALLA TIMUR", npsn: "69751520", level: "RA", status: "SWASTA", address: "Takkalalla Timur", desa: "Kelurahan Maccirinna" },
  { name: "LKP RAHMA", npsn: "K9990293", level: "Kursus", status: "SWASTA", address: "Jl. Poros Benteng", desa: "Kelurahan Maccirinna" },
  { name: "UPT SD NEGERI INPRES PADANG LOANG", npsn: "40305178", level: "SD", status: "NEGERI", address: "Dusun Padang", desa: "Desa Padang Loang" },
  { name: "RA DDI AL-MUNAWARAH PALITA", npsn: "69886044", level: "RA", status: "SWASTA", address: "Dusun Palita", desa: "Desa Padang Loang" },
  { name: "RA DDI ASH-SHIDDIQ", npsn: "69886045", level: "RA", status: "SWASTA", address: "Padang Loang", desa: "Desa Padang Loang" },
  { name: "UPT SD NEGERI 121 PINRANG", npsn: "40304322", level: "SD", status: "NEGERI", address: "Malimpung", desa: "Desa Malimpung" },
  { name: "UPT SD NEGERI 123 PINRANG", npsn: "40305338", level: "SD", status: "NEGERI", address: "Malimpung", desa: "Desa Malimpung" },
  { name: "UPT SD NEGERI 195 PINRANG", npsn: "40305274", level: "SD", status: "NEGERI", address: "Malimpung", desa: "Desa Malimpung" },
  { name: "UPT SMP NEGERI 5 PATAMPANUA", npsn: "69761928", level: "SMP", status: "NEGERI", address: "Malimpung", desa: "Desa Malimpung" },
  { name: "UPT SD NEGERI 218 PINRANG", npsn: "40305298", level: "SD", status: "NEGERI", address: "Jln. Poros Malimpung", desa: "Koridor Poros (Benteng)" },
  { name: "TK IT WAHDAH QURROTA AYUN", npsn: "70057285", level: "TK", status: "SWASTA", address: "Jl. Poros Malimpung", desa: "Koridor Poros (Sipatuo)" },
  { name: "RA DDI DARABATU", npsn: "69886048", level: "RA", status: "SWASTA", address: "Jl. Poros Malimpung", desa: "Koridor Poros (Sipatuo)" },
  { name: "RA KARTINI URUNG", npsn: "69886046", level: "RA", status: "SWASTA", address: "Jl. Poros Malimpung Urung", desa: "Koridor Poros (Sipatuo)" }
];`;
content = content.replace(oldSchoolsRegex, newSchools);

// 2. Inject handleMigrateSchools back
const resetFilterRegex = /const resetFilter = \(\) => \{\n    setFilters\(\{ year: 'Semua', month: 'Semua', desa: 'Semua', dusun: 'Semua', cluster: 'Semua', status: 'Semua' \}\);\n  \};\n/;
const migrateSchoolsFunction = `const resetFilter = () => {
    setFilters({ year: 'Semua', month: 'Semua', desa: 'Semua', dusun: 'Semua', cluster: 'Semua', status: 'Semua' });
  };

  const handleMigrateSchools = async () => {
    if (!window.confirm('Mulai sinkronisasi data 15 sekolah dari Dapodik?')) return;
    setSchoolMigrating(true);
    try {
      const schoolRef = collection(db, 'schools');
      const schoolSnap = await getDocs(schoolRef);
      const existingSchools = schoolSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let updatedCount = 0;
      let addedCount = 0;

      for (const school of SCHOOL_SEEDS) {
        const match = existingSchools.find(s => s.npsn === school.npsn || s.name.toLowerCase() === school.name.toLowerCase());
        const payload = { ...school, lastUpdated: new Date().toISOString() };
        
        if (match) {
          await updateDoc(doc(db, 'schools', match.id), payload);
          updatedCount++;
        } else {
          await addDoc(collection(db, 'schools'), payload);
          addedCount++;
        }
      }
      alert(\`Sinkronisasi Selesai! \${updatedCount} diperbarui, \${addedCount} sekolah baru ditambahkan.\`);
    } catch (error) {
      alert(\`Gagal sinkronisasi: \${error.message}\`);
    } finally {
      setSchoolMigrating(false);
    }
  };
`;
content = content.replace(resetFilterRegex, migrateSchoolsFunction);

// 3. Make the sync button visible unconditionally for now
const buttonRegex = /\{schoolList\.length === 0 && \([\s\S]*?<button type="button" onClick=\{handleMigrateSchools\} disabled=\{schoolMigrating\}[\s\S]*?>[\s\S]*?\{schoolMigrating \? 'Sinkronisasi\.\.\.' : 'Impor Data Awal \(Seed\)'\}[\s\S]*?<\/button>\s*\)\}/;
const newButton = `<button type="button" onClick={handleMigrateSchools} disabled={schoolMigrating} className="rounded-lg border border-teal-500 bg-teal-50 px-4 py-2 text-xs font-black text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors shadow-sm">
                          {schoolMigrating ? 'Menyinkronkan Data...' : 'Sinkronisasi Dapodik Nasional'}
                        </button>`;
content = content.replace(buttonRegex, newButton);

fs.writeFileSync(file, content);
console.log('Schools sync logic successfully injected.');
