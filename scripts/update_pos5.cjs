const fs = require('fs');

let code = fs.readFileSync('DynamicFormRenderer.jsx', 'utf8');

// 1. Update parseOption
code = code.replace(
  "if (t.includes('tidak pernah')) return \"Tidak Pernah\";",
  `if (t.includes('tidak pernah')) return "Tidak Pernah";
    if (t.includes('lebih dari separuh waktu')) return "> Separuh Wkt";
    if (t.includes('hampir setiap hari')) return "Tiap Hari";
    if (t.includes('beberapa hari')) return "Bbrp Hari";`
);

// 2. Change vertical flex to 2-column grid for options
code = code.replace(
  '<div className="flex flex-col gap-2 mt-2">',
  '<div className="grid grid-cols-2 gap-1.5 mt-1.5">'
);

// 3. Change padding of options to be more compact
code = code.replace(
  /className=\{`flex-1 flex items-center p-3\.5 rounded-xl/g,
  'className={`flex-1 flex items-center justify-center text-center py-3 px-1 rounded-xl'
);

// 4. Change gap-6 to gap-4 in renderCards
code = code.replace(
  'grid grid-cols-1 md:grid-cols-2 gap-6',
  'grid grid-cols-1 md:grid-cols-2 gap-4'
);

// 5. Change another gap-6 in takeRemainingCard if exists
code = code.replace(
  'grid grid-cols-1 md:grid-cols-2 gap-6',
  'grid grid-cols-1 md:grid-cols-2 gap-4'
);

fs.writeFileSync('DynamicFormRenderer.jsx', code);
console.log('UI Overhaul for Pos 5 completed!');
