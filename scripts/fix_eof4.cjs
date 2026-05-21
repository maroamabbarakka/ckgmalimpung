const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all instances of literal \n with empty string just to clean it
content = content.replace(/\\n/g, '');

const idx = content.lastIndexOf('    </div>');
if (idx !== -1) {
  content = content.substring(0, idx + 10) + '\n  );\n}\n\nexport default AdminDashboard;\n';
}

fs.writeFileSync(file, content);
console.log('Fixed EOF for real.');
