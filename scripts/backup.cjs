const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const backupDir = path.join(rootDir, '..', 'Backups_Tersanjung');

// Pastikan folder backup utama ada
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Buat nama folder berdasarkan tanggal dan jam
const now = new Date();
const timestamp = now.getFullYear().toString() + 
  (now.getMonth() + 1).toString().padStart(2, '0') + 
  now.getDate().toString().padStart(2, '0') + '_' + 
  now.getHours().toString().padStart(2, '0') + 
  now.getMinutes().toString().padStart(2, '0') + 
  now.getSeconds().toString().padStart(2, '0');

const currentBackupPath = path.join(backupDir, `backup_${timestamp}`);
fs.mkdirSync(currentBackupPath);

console.log(`\n⏳ Sedang membuat backup ke: ${currentBackupPath}...`);

const foldersToBackup = ['src', 'public', 'scripts', 'docs'];
const filesToBackup = ['package.json', 'vite.config.js', 'index.html', 'tailwind.config.js', 'postcss.config.js', '.eslintrc.cjs'];

try {
  // Copy folders
  foldersToBackup.forEach(folder => {
    const srcFolder = path.join(rootDir, folder);
    const destFolder = path.join(currentBackupPath, folder);
    if (fs.existsSync(srcFolder)) {
      // Menggunakan xcopy di Windows karena jauh lebih cepat dan stabil
      execSync(`xcopy "${srcFolder}" "${destFolder}" /E /I /H /C /Q`, { stdio: 'ignore' });
    }
  });

  // Copy files
  filesToBackup.forEach(file => {
    const srcFile = path.join(rootDir, file);
    const destFile = path.join(currentBackupPath, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
    }
  });

  console.log(`✅ BERHASIL! Backup kode Anda telah aman tersimpan.`);
  console.log(`📂 Lokasi Backup: ${currentBackupPath}\n`);
} catch (error) {
  console.error('❌ Gagal membuat backup:', error.message);
}
