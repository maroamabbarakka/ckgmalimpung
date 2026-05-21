const xlsx = require('xlsx');
const fs = require('fs');

const wb = xlsx.readFile('Form Manual PKG.xlsx');
let output = '';

wb.SheetNames.forEach(sheetName => {
    if (sheetName === 'Dashboard' || sheetName.toLowerCase().includes('rekap')) return;
    
    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
    let headerRow = [];
    for (let i = 0; i < Math.min(10, data.length); i++) {
        if (data[i] && data[i].some(c => typeof c === 'string' && (c.includes('Nama Lengkap') || c.includes('NIK ')))) {
            headerRow = data[i];
            break;
        }
    }
    
    if (headerRow.length > 0) {
        output += '// ' + sheetName + '\n';
        output += 'const headers' + sheetName.replace(/[^a-zA-Z0-9]/g, '') + ' = [\n';
        output += headerRow.map(h => '  "' + String(h||'').replace(/"/g, '\\"') + '"').join(',\n');
        output += '\n];\n\n';
    }
});

fs.writeFileSync('pkg_headers.js', output);
console.log('Headers extracted to pkg_headers.js');
