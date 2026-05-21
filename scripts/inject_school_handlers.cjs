const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `  const openStaffForm = (staff = null) => {`;

const schoolHandlers = `
  const handleMigrateSchools = async () => {
    if (!window.confirm('Impor data awal sekolah dari seed data?')) return;
    setSchoolMigrating(true);
    try {
      for (const school of SCHOOL_SEEDS) {
        await addDoc(collection(db, 'schools'), { ...school, lastUpdated: new Date().toISOString() });
      }
      alert('Berhasil impor data sekolah!');
    } catch (error) {
      console.error(error);
      alert('Gagal impor.');
    } finally {
      setSchoolMigrating(false);
    }
  };

  const openSchoolForm = (school = null) => {
    setEditSchool(
      school || { name: '', level: 'SD', desa: 'Desa Malimpung', address: '', npsn: '-', source: 'Admin Input' }
    );
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (e) => {
    e.preventDefault();
    try {
      if (editSchool.id) {
        await updateDoc(doc(db, 'schools', editSchool.id), { ...editSchool, lastUpdated: new Date().toISOString() });
        await logActivity('Edit Sekolah', \`Mengubah data \${editSchool.name}\`, 'Admin Dashboard');
      } else {
        await addDoc(collection(db, 'schools'), { ...editSchool, lastUpdated: new Date().toISOString() });
        await logActivity('Tambah Sekolah', \`Menambah data \${editSchool.name}\`, 'Admin Dashboard');
      }
      setIsSchoolModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data sekolah.');
    }
  };

`;

if (!content.includes('const handleMigrateSchools = async () => {')) {
  content = content.replace(anchor, schoolHandlers + anchor);
  fs.writeFileSync(file, content);
  console.log('Handlers benar-benar diinjeksi dengan sukses!');
} else {
  console.log('Handlers function sudah ada.');
}
