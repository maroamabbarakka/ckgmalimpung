import XLSX from 'xlsx';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function validateDate(dateStr) {
  if (!dateStr) return false;
  const reg = /^\d{4}-\d{2}-\d{2}$/;
  if (!reg.test(String(dateStr).trim())) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

async function main() {
  const xlsxPath = path.join(ROOT, 'src', 'docs', 'CKG_Tersanjung_Import_CKGMalimpung_FormSchema.xlsx');
  
  if (!fs.existsSync(xlsxPath)) {
    console.error(`ERROR: Berkas Excel tidak ditemukan di: ${xlsxPath}`);
    process.exit(1);
  }

  console.log(`Membaca file Excel untuk validasi: ${xlsxPath}`);
  const workbook = XLSX.readFile(xlsxPath);
  
  const patientsSheet = workbook.Sheets['PATIENTS_IMPORT'];
  if (!patientsSheet) {
    console.error(`ERROR: Sheet 'PATIENTS_IMPORT' tidak ditemukan dalam file Excel!`);
    process.exit(1);
  }

  const patients = XLSX.utils.sheet_to_json(patientsSheet);
  console.log(`Ditemukan ${patients.length} data pasien di sheet PATIENTS_IMPORT.\n`);

  let validCount = 0;
  let invalidCount = 0;
  const duplicateNiks = new Map(); // NIK -> list of row indices
  const errors = [];

  patients.forEach((p, index) => {
    const rowNum = index + 2; // Baris 1 adalah header
    const nik = String(p.nik || '').trim();
    const name = String(p.name || '').trim();
    const birthDate = String(p.birthDate || '').trim();
    const gender = String(p.gender || '').trim().toLowerCase();

    const rowErrors = [];

    // 1. Cek NIK
    if (!nik) {
      rowErrors.push(`NIK kosong`);
    } else if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      rowErrors.push(`NIK "${nik}" tidak valid (harus berupa 16 digit angka)`);
    } else {
      // Deteksi NIK ganda
      if (duplicateNiks.has(nik)) {
        duplicateNiks.get(nik).push(rowNum);
      } else {
        duplicateNiks.set(nik, [rowNum]);
      }
    }

    // 2. Cek Nama
    if (!name) {
      rowErrors.push('Nama kosong');
    }

    // 3. Cek Tanggal Lahir
    if (!birthDate) {
      rowErrors.push('Tanggal lahir kosong');
    } else if (!validateDate(birthDate)) {
      rowErrors.push(`Tanggal lahir "${birthDate}" tidak valid (wajib format ISO YYYY-MM-DD)`);
    }

    // 4. Cek Jenis Kelamin
    if (!gender) {
      rowErrors.push('Jenis kelamin kosong');
    } else if (gender !== 'laki-laki' && gender !== 'perempuan') {
      rowErrors.push(`Jenis kelamin "${gender}" tidak valid (wajib 'laki-laki' atau 'perempuan')`);
    }

    if (rowErrors.length > 0) {
      invalidCount += 1;
      errors.push({ row: rowNum, name, errors: rowErrors });
    } else {
      validCount += 1;
    }
  });

  // Log NIK Ganda
  let duplicateCount = 0;
  console.log('--- DETEKSI NIK DUPLIKAT ---');
  for (const [nik, rows] of duplicateNiks.entries()) {
    if (rows.length > 1) {
      duplicateCount += 1;
      console.log(`⚠️ NIK "${nik}" ganda pada baris: ${rows.join(', ')}`);
    }
  }
  if (duplicateCount === 0) {
    console.log('✓ Tidak ada NIK ganda yang terdeteksi.');
  }

  // Log Error Validasi
  console.log('\n--- DETEKSI KESALAHAN DATA ---');
  if (errors.length > 0) {
    errors.forEach((err) => {
      console.log(`❌ Baris ${err.row} | Nama: ${err.name || 'Tanpa Nama'} | Kesalahan: ${err.errors.join('; ')}`);
    });
  } else {
    console.log('✓ Tidak ada kesalahan format data.');
  }

  console.log('\n--- RINGKASAN VALIDASI ---');
  console.log(`Total data diperiksa : ${patients.length}`);
  console.log(`Data valid           : ${validCount}`);
  console.log(`Data invalid         : ${invalidCount}`);
  console.log(`Jumlah NIK duplikat  : ${duplicateCount}`);

  if (invalidCount > 0) {
    console.log('\n⚠️ PERINGATAN: Ada data yang tidak valid. Perbaiki sebelum mengimpor.');
    process.exit(1);
  } else {
    console.log('\n✅ SUKSES: Semua data pasien valid dan siap diimpor!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Gagal menjalankan validasi:', error);
  process.exit(1);
});
