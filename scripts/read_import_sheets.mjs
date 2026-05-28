import XLSX from 'xlsx';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

async function main() {
  const xlsxPath = path.join(ROOT, 'src', 'docs', 'CKG_Tersanjung_Import_CKGMalimpung_FormSchema.xlsx');
  const workbook = XLSX.readFile(xlsxPath);

  const sheetsToInspect = ['PATIENTS_IMPORT', 'VISITS_IMPORT', 'README_IMPORT', 'FORM_RESPONSES_LONG'];

  sheetsToInspect.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.log(`\nSheet ${sheetName} tidak ditemukan.`);
      return;
    }
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n========================================`);
    console.log(`SHEET: ${sheetName} | Total Baris: ${rows.length}`);
    console.log(`========================================`);
    
    if (rows.length > 0) {
      console.log('Header Columns:', rows[0]);
    }
    console.log('Preview 3 baris data pertama:');
    for (let r = 1; r < Math.min(4, rows.length); r++) {
      console.log(`Baris ${r + 1}:`, rows[r]);
    }
  });

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
