const fs = require('fs');
let code = fs.readFileSync('DynamicFormRenderer.jsx', 'utf8');
let lines = code.split(/\r?\n/);

// Remove lines from index 381 to 510 (which are lines 382 to 511 in 1-based indexing)
lines.splice(381, 130);

fs.writeFileSync('DynamicFormRenderer.jsx', lines.join('\n'));
console.log('Cleaned duplicate block successfully!');
