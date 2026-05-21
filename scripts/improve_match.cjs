const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldMatchRegex = /const match = existingStaff\.find\(s => s\.nama\.toLowerCase\(\)\.trim\(\) === newStaff\.nama_lengkap\.toLowerCase\(\)\.trim\(\)\);/;

const newMatch = `const cleanName = (name) => name.toLowerCase().replace(/drg\\.|dr\\.|bd\\.|s\\.st|s\\.kep|ners|skm|a\\.md\\.keb|amkg|s\\.keb|amd\\.pk|amd\\.kep|amd\\.gz|amd\\. ak|s\\.tr\\.ak|a\\.md\\.rmik|s\\.kes|mm|s\\.kom|a\\.md\\.kes|amd\\.pjk|amg|ns|s\\.tr\\.kes/g, '').replace(/[^a-z0-9]/g, '');
        const newClean = cleanName(newStaff.nama_lengkap);
        const match = existingStaff.find(s => cleanName(s.nama) === newClean || cleanName(s.nama).includes(newClean) || newClean.includes(cleanName(s.nama)));`;

if (content.includes('existingStaff.find(s => s.nama.toLowerCase()')) {
  content = content.replace(oldMatchRegex, newMatch);
  fs.writeFileSync(file, content);
  console.log('Matching logic improved.');
} else {
  console.log('Matching logic not found or already changed.');
}
