const fs = require('fs');
const path = require('path');

const dir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
let found = [];

function walk(d) {
  try {
    const files = fs.readdirSync(d);
    for (const f of files) {
      const p = path.join(d, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        walk(p);
      } else {
        if (stat.mtime > new Date('2026-05-10')) {
          const content = fs.readFileSync(p, 'utf8');
          if (content.includes("activeMenu === 'sekolah'") && content.includes("openSchoolForm")) {
            found.push({ path: p, time: stat.mtime });
          }
        }
      }
    }
  } catch (e) {}
}

walk(dir);

found.sort((a, b) => b.time - a.time); // newest first
if (found.length > 0) {
  console.log('FOUND BACKUPS:');
  found.forEach(f => console.log(f.path, f.time));
} else {
  console.log('NOT FOUND');
}
