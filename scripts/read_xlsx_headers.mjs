import XLSX from 'xlsx';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

async function main() {
  const xlsxPath = path.join(ROOT, 'src', 'docs', 'CKG_Tersanjung_Import_CKGMalimpung_FormSchema.xlsx');
  console.log(`Membaca file Excel menggunakan xlsx (SheetJS): ${xlsxPath}`);
  
  const workbook = XLSX.readFile(xlsxPath);
  console.log(`Daftar Sheet Names:`, workbook.SheetNames);

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    // Konversi ke format JSON untuk melihat data baris
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\nSheet Name: ${sheetName} | Total Baris: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('Headers (Baris 1):', rows[0].slice(0, 15));
      if (rows[0].length > 15) console.log(`...dan ${rows[0].length - 15} kolom lainnya.`);
    }

    console.log('Preview 3 baris data:');
    for (let r = 1; r < Math.min(4, rows.length); r++) {
      console.log(`Baris ${r + 1}:`, rows[r].slice(0, 8));
    }
  });

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
