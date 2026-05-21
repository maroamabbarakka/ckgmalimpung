const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the literal \n with actual newlines
content = content.replace(/\\n/g, '\\n');

// Also remove the `\n  );\n}\n\nexport default AdminDashboard;\n` at the end
content = content.replace(/\\\\n  \\);\\\\n\\}\\\\n\\\\nexport default AdminDashboard;\\\\n$/, '');
// Wait, regex might be tricky. Let's just find the last `</div>` and rewrite the end cleanly.

const idx = content.lastIndexOf('    </div>');
if (idx !== -1) {
  content = content.substring(0, idx + 10) + '\\n  );\\n}\\n\\nexport default AdminDashboard;\\n';
}

fs.writeFileSync(file, content);
console.log('Fixed EOF cleanly.');
