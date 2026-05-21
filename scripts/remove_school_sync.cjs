const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove SCHOOL_SEEDS
const schoolsRegex = /const SCHOOL_SEEDS = \[\s*\{ name: "UPT SD NEGERI 258 PINRANG"[\s\S]*?\}\s*\];/;
content = content.replace(schoolsRegex, '');

// 2. Remove handleMigrateSchools function
const funcRegex = /const handleMigrateSchools = async \(\) => \{[\s\S]*?setSchoolMigrating\(false\);\n    \}\n  \};\n/;
content = content.replace(funcRegex, '');

// 3. Remove the sync button from UI
const buttonRegex = /<button type="button" onClick=\{handleMigrateSchools\} disabled=\{schoolMigrating\} className="rounded-lg border border-teal-500 bg-teal-50 px-4 py-2 text-xs font-black text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors shadow-sm">\s*\{schoolMigrating \? 'Menyinkronkan Data\.\.\.' : 'Sinkronisasi Dapodik Nasional'\}\s*<\/button>/;
content = content.replace(buttonRegex, '');

fs.writeFileSync(file, content);
console.log('School sync artifacts removed.');
