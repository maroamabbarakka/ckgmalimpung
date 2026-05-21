const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// The file currently ends with:
//       )}
//     </div>

// We need to add:
//   );
// }
//
// export default AdminDashboard;

content += "\\n  );\\n}\\n\\nexport default AdminDashboard;\\n";

fs.writeFileSync(file, content);
console.log('Fixed EOF syntax error.');
