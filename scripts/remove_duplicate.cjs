const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleMigrateSchools = async \(\) => \{\n    if \(\!window\.confirm\('Impor data awal sekolah dari seed data\?'\)\) return;\n    setSchoolMigrating\(true\);\n    try \{\n      for \(const school of SCHOOL_SEEDS\) \{\n        await addDoc\(collection\(db, 'schools'\), \{ \.\.\.school, lastUpdated: new Date\(\)\.toISOString\(\) \}\);\n      \}\n      alert\('Berhasil impor data sekolah!'\);\n    \} catch \(error\) \{\n      console\.error\(error\);\n      alert\('Gagal impor\.'\);\n    \} finally \{\n      setSchoolMigrating\(false\);\n    \}\n  \};\n/;

content = content.replace(regex, '');

fs.writeFileSync(file, content);
console.log('Duplicate removed.');
