const fs = require('fs');
const code = fs.readFileSync('src/Dashboard.jsx', 'utf8');
let s = [];
for (let i = 0; i < code.length; i++) {
  if (code[i] === "'") {
    i++;
    while (code[i] !== "'" && i < code.length) {
      if (code[i] === '\\') i++;
      i++;
    }
  } else if (code[i] === '"') {
    i++;
    while (code[i] !== '"' && i < code.length) {
      if (code[i] === '\\') i++;
      i++;
    }
  } else if (code[i] === '`') {
    i++;
    while (code[i] !== '`' && i < code.length) {
      if (code[i] === '\\') i++;
      if (code[i] === '$' && code[i+1] === '{') {
         // wait, template literals evaluate inside `${`
         // so we shouldn't skip everything!
         // This is getting too complex for a simple string parser.
      }
      i++;
    }
  } else if (code[i] === '{') {
    s.push(i);
  } else if (code[i] === '}') {
    s.pop();
  }
}
console.log(s);
