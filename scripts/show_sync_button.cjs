const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldButtonRegex = /\{staffList\.length === 0 && \([\s\S]*?<button type="button" onClick=\{handleMigrateStaff\} disabled=\{migrating\}[\s\S]*?>[\s\S]*?\{migrating \? 'Sinkronisasi\.\.\.' : 'Impor Data Awal'\}[\s\S]*?<\/button>[\s\S]*?\)\}/;

const newButton = `<button type="button" onClick={handleMigrateStaff} disabled={migrating} className="rounded-lg border border-teal-500 bg-teal-50 px-4 py-2 text-xs font-black text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors shadow-sm">
                            {migrating ? 'Menyinkronkan Data...' : 'Sinkronisasi SIMPEG Nasional'}
                          </button>`;

content = content.replace(oldButtonRegex, newButton);

fs.writeFileSync(file, content);
console.log('Button made visible.');
