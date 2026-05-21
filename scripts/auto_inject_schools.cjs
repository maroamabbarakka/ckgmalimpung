const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const schoolSeeds = `
const AUTO_SCHOOL_SEEDS = [
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
];

  useEffect(() => {
    if (schoolList && schoolList.length === 0 && !window.hasInjectedSchools) {
      window.hasInjectedSchools = true;
      const injectData = async () => {
        try {
          console.log("Auto-injecting 15 schools...");
          for (const school of AUTO_SCHOOL_SEEDS) {
            await addDoc(collection(db, 'schools'), { ...school, source: 'Auto Inject', lastUpdated: new Date().toISOString() });
          }
          alert("15 data sekolah berhasil diinjeksi secara otomatis!");
        } catch (e) {
          console.error("Failed to inject schools:", e);
        }
      };
      injectData();
    }
  }, [schoolList]);
`;

const insertPointRegex = /const updateFilter = \(key, value\) => \{/;
content = content.replace(insertPointRegex, schoolSeeds + '\n  const updateFilter = (key, value) => {');

const emptyStateRegex = /Belum ada data sekolah atau pencarian tidak ditemukan\./;
content = content.replace(emptyStateRegex, 'Belum ada data sekolah atau pencarian tidak ditemukan. (Total Database: {schoolList.length})');

fs.writeFileSync(file, content);
console.log('Auto inject script added.');
