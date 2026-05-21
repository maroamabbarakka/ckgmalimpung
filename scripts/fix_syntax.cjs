const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `)}} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal-500" required />`;
const indexStart = content.indexOf(searchStr);

if (indexStart !== -1) {
  // Find the end of the bad section. The old modal ends with:
  //       )}
  //     </div>
  //   );
  // }
  
  const endStr = `        </div>\n      )}\n    </div>`;
  const indexEnd = content.indexOf(endStr, indexStart);
  
  if (indexEnd !== -1) {
    // Remove the bad section
    content = content.substring(0, indexStart) + "      )}\n    </div>";
    fs.writeFileSync(file, content);
    console.log('Fixed syntax error.');
  } else {
    console.log('Could not find end of bad section.');
  }
} else {
  console.log('Could not find start of bad section.');
}
