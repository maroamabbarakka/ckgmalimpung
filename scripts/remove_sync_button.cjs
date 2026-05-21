const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the button
const buttonRegex = /<button type="button" onClick=\{handleMigrateStaff\} disabled=\{migrating\} className="rounded-lg border border-teal-500 bg-teal-50 px-4 py-2 text-xs font-black text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors shadow-sm">\s*\{migrating \? 'Menyinkronkan Data\.\.\.' : 'Sinkronisasi SIMPEG Nasional'\}\s*<\/button>/;
content = content.replace(buttonRegex, '');

// 2. Remove handleMigrateStaff function
const functionRegex = /const handleMigrateStaff = async \(\) => \{[\s\S]*?setMigrating\(false\);\n    \}\n  \};\n\n\n/;
content = content.replace(functionRegex, '');

// 3. Remove INITIAL_STAFF_DATA
const initialDataRegex = /const INITIAL_STAFF_DATA = \[[\s\S]*?\];\n\n/;
content = content.replace(initialDataRegex, '');

fs.writeFileSync(file, content);
console.log('Sync button and static data removed.');
