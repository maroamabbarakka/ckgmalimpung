const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const newStaffData = `const INITIAL_STAFF_DATA = [
  {"id_pegawai":"ASN-001","nama_lengkap":"drg. IFAH NILAWATY RASYID, M. Kes","status_kepegawaian":"PNS","nip":"198605312015032001","tanggal_lahir":"1986-05-31","jenis_kelamin":"Perempuan","pangkat":"Pembina","golongan_ruang":"IV/a","pendidikan_terakhir":"S2 / Spesialis Kedokteran Gigi"},
  {"id_pegawai":"ASN-002","nama_lengkap":"dr. ANDI MUTIA","status_kepegawaian":"PNS","nip":"198704032015032002","tanggal_lahir":"1987-04-03","jenis_kelamin":"Perempuan","pangkat":"Pembina","golongan_ruang":"IV/a","pendidikan_terakhir":"S1 Kedokteran / Profesi"},
  {"id_pegawai":"ASN-003","nama_lengkap":"Bd. HARDINA, S.ST","status_kepegawaian":"PNS","nip":"196912311990022003","tanggal_lahir":"1969-12-31","jenis_kelamin":"Perempuan","pangkat":"Pembina Tk.I","golongan_ruang":"IV/b","pendidikan_terakhir":"D-IV Kebidanan"},
  {"id_pegawai":"ASN-004","nama_lengkap":"RINA HAKIM, S.Kep, Ners","status_kepegawaian":"PNS","nip":"198102032009032002","tanggal_lahir":"1981-02-03","jenis_kelamin":"Perempuan","pangkat":"Pembina","golongan_ruang":"IV/a","pendidikan_terakhir":"Profesi Ners"},
  {"id_pegawai":"ASN-005","nama_lengkap":"IRMAYANI, SKM","status_kepegawaian":"PNS","nip":"198106162012122001","tanggal_lahir":"1981-06-16","jenis_kelamin":"Perempuan","pangkat":"Pembina","golongan_ruang":"IV/a","pendidikan_terakhir":"S1 Kesehatan Masyarakat"},
  {"id_pegawai":"ASN-006","nama_lengkap":"Bd.YULIN ATAN, S.ST","status_kepegawaian":"PNS","nip":"197707102005022003","tanggal_lahir":"1977-07-10","jenis_kelamin":"Perempuan","pangkat":"Penata Tk.I","golongan_ruang":"III/d","pendidikan_terakhir":"D-IV Kebidanan"},
  {"id_pegawai":"ASN-007","nama_lengkap":"MUH. ARAS TAHIR, SKM","status_kepegawaian":"PNS","nip":"198808072011011001","tanggal_lahir":"1988-08-07","jenis_kelamin":"Laki-laki","pangkat":"Penata Tk.I","golongan_ruang":"III/d","pendidikan_terakhir":"S1 Kesehatan Masyarakat"},
  {"id_pegawai":"ASN-008","nama_lengkap":"ROHANI GANI, S.Kep.Ners","status_kepegawaian":"PNS","nip":"198010292012122001","tanggal_lahir":"1980-10-29","jenis_kelamin":"Perempuan","pangkat":"Penata Tk.I","golongan_ruang":"III/d","pendidikan_terakhir":"Profesi Ners"},
  {"id_pegawai":"ASN-009","nama_lengkap":"MARLINA, A.Md.Keb","status_kepegawaian":"PNS","nip":"197806222006042003","tanggal_lahir":"1978-06-22","jenis_kelamin":"Perempuan","pangkat":"Penata Tk.I","golongan_ruang":"III/d","pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"ASN-010","nama_lengkap":"DWI ERMAYANI, AMKG","status_kepegawaian":"PNS","nip":"198801192010012015","tanggal_lahir":"1988-01-19","jenis_kelamin":"Perempuan","pangkat":"Penata Tk.I","golongan_ruang":"III/d","pendidikan_terakhir":"D-III Keperawatan Gigi"},
  {"id_pegawai":"ASN-011","nama_lengkap":"Bd. NURHAYATI, S.ST","status_kepegawaian":"PNS","nip":"198404032017042007","tanggal_lahir":"1984-04-03","jenis_kelamin":"Perempuan","pangkat":"Penata Muda Tk.I","golongan_ruang":"III/b","pendidikan_terakhir":"D-IV Kebidanan"},
  {"id_pegawai":"ASN-012","nama_lengkap":"ERNA EDY, SKM","status_kepegawaian":"PNS","nip":"199203232020122005","tanggal_lahir":"1992-03-23","jenis_kelamin":"Perempuan","pangkat":"Penata Muda Tk.I","golongan_ruang":"III/b","pendidikan_terakhir":"S1 Kesehatan Masyarakat"},
  {"id_pegawai":"ASN-013","nama_lengkap":"SATRIANI ZULKIFLI, Amd.Pk","status_kepegawaian":"PNS","nip":"198711212011012012","tanggal_lahir":"1987-11-21","jenis_kelamin":"Perempuan","pangkat":"Penata Muda Tk.I","golongan_ruang":"III/b","pendidikan_terakhir":"D-III Perekam Medis"},
  {"id_pegawai":"ASN-014","nama_lengkap":"BUNGA DERI, S. Keb","status_kepegawaian":"PNS","nip":"198611172017042009","tanggal_lahir":"1986-11-17","jenis_kelamin":"Perempuan","pangkat":"Penata Muda","golongan_ruang":"III/a","pendidikan_terakhir":"S1 Kebidanan"},
  {"id_pegawai":"ASN-015","nama_lengkap":"RASMA, A.Md.Kep","status_kepegawaian":"PNS","nip":"198207102009092004","tanggal_lahir":"1982-07-10","jenis_kelamin":"Perempuan","pangkat":"Penata Muda","golongan_ruang":"III/a","pendidikan_terakhir":"D-III Keperawatan"},
  {"id_pegawai":"ASN-016","nama_lengkap":"A. ASMAUL HUSNA, Amd.Gz","status_kepegawaian":"PNS","nip":"199903162022032001","tanggal_lahir":"1999-03-16","jenis_kelamin":"Perempuan","pangkat":"Pengatur","golongan_ruang":"II/c","pendidikan_terakhir":"D-III Gizi"},
  {"id_pegawai":"ASN-017","nama_lengkap":"PEBRIANSYAH, Amd. AK","status_kepegawaian":"PNS","nip":"199402182022031007","tanggal_lahir":"1994-02-18","jenis_kelamin":"Laki-laki","pangkat":"Pengatur","golongan_ruang":"II/c","pendidikan_terakhir":"D-III Analis Kesehatan"},
  {"id_pegawai":"ASN-018","nama_lengkap":"SARTIKA, A.MD.Keb","status_kepegawaian":"PPPK","nip":"199006132025212161","tanggal_lahir":"1990-06-13","jenis_kelamin":"Perempuan","pangkat":"PPPK","golongan_ruang":"PW","pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-001","nama_lengkap":"YULIANTI, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-002","nama_lengkap":"HAMSIAH, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-003","nama_lengkap":"NUR AL FITRIAWATI A, A.Md.A.B","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Administrasi Bisnis"},
  {"id_pegawai":"MGN-004","nama_lengkap":"SRI ROHMIATI, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-005","nama_lengkap":"ERMAWATI, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-006","nama_lengkap":"IRMA MUSTAFA, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-007","nama_lengkap":"NIRWANA, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-008","nama_lengkap":"NUR INDAH YASIN, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-009","nama_lengkap":"Bd. LIA ANDRIANI, S.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"Profesi Bidan"},
  {"id_pegawai":"MGN-010","nama_lengkap":"RISMA, Amd.Kep","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Keperawatan"},
  {"id_pegawai":"MGN-011","nama_lengkap":"ANDI FIFI OKTAVIANA SUNINGRAT, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-012","nama_lengkap":"WIDIA, S.Tr.Ak","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"S1 Akuntansi Keuangan"},
  {"id_pegawai":"MGN-013","nama_lengkap":"RISMA BAHARUDDIN, A.Md.RMIK","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Rekam Medik"},
  {"id_pegawai":"MGN-014","nama_lengkap":"JUNITA, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-015","nama_lengkap":"SRI WAHYUNI, S.Kes","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"S1 Administrasi Rumah Sakit"},
  {"id_pegawai":"MGN-016","nama_lengkap":"SRI WAHYUNI, Amd.Kep","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Keperawatan"},
  {"id_pegawai":"MGN-017","nama_lengkap":"ARMIATI, SKM, MM","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"S2 Kesehatan Masyarakat (AKK)"},
  {"id_pegawai":"MGN-018","nama_lengkap":"EMA AINUN, SKM","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"S1 Kesehatan Masyarakat (K3)"},
  {"id_pegawai":"MGN-019","nama_lengkap":"NUR HIDAYAH, S.Kom","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"S1 Teknik Informatika"},
  {"id_pegawai":"MGN-020","nama_lengkap":"SITTI RAHMA, Amd. RMIK","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Rekam Medik"},
  {"id_pegawai":"MGN-021","nama_lengkap":"NUR ALISA, A.Md.Kes","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Teknologi Laboratorium Medis"},
  {"id_pegawai":"MGN-022","nama_lengkap":"SESY LIYANA, Amd.PJK","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Perpajakan"},
  {"id_pegawai":"MGN-023","nama_lengkap":"SEFRIYANTI RAMLI MOHI, AMG","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Gizi"},
  {"id_pegawai":"MGN-024","nama_lengkap":"RAMLAH, SKM","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"S1 Kesehatan Masyarakat (AKK)"},
  {"id_pegawai":"MGN-025","nama_lengkap":"KHUSNUL KHOTIMAH, SKM","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"S1 Kesehatan Masyarakat (Kesling)"},
  {"id_pegawai":"MGN-026","nama_lengkap":"DZAKIYAH H SOUWAKIL, S.Kep, Ns","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"Profesi Ners"},
  {"id_pegawai":"MGN-027","nama_lengkap":"TIARA MUSLIMAH B, S.Kep, Ns","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"Profesi Ners"},
  {"id_pegawai":"MGN-028","nama_lengkap":"DEWI KURNIA RAMADHANI, S.Kep, Ns","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"Profesi Ners"},
  {"id_pegawai":"MGN-029","nama_lengkap":"ASRIANI SAING S.Kep, Ns","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"Profesi Ners"},
  {"id_pegawai":"MGN-030","nama_lengkap":"RISKA AMANDA, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-031","nama_lengkap":"NUR AZIZAH, S.Tr.Kes","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-IV Teknologi Laboratorium Medis"},
  {"id_pegawai":"MGN-032","nama_lengkap":"ORPA EKARIA SARI, A.Md.Keb","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Kebidanan"},
  {"id_pegawai":"MGN-033","nama_lengkap":"ZELYANA PUTRI, A.Md.Kep","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Keperawatan"},
  {"id_pegawai":"MGN-034","nama_lengkap":"SARIFA NABILA, A.Md.Kep","status_kepegawaian":"Non-ASN / Magang","nip":null,"tanggal_lahir":null,"jenis_kelamin":null,"pangkat":null,"golongan_ruang":null,"pendidikan_terakhir":"D-III Keperawatan"}
];`;

const oldInitialDataRegex = /const INITIAL_STAFF_DATA = \[[\s\S]*?\];/;
content = content.replace(oldInitialDataRegex, newStaffData);

const oldMigrateFunctionRegex = /const handleMigrateStaff = async \(\) => \{[\s\S]*?setMigrating\(false\);\n    \}\n  \};/;

const newMigrateFunction = `const handleMigrateStaff = async () => {
    if (!window.confirm('Mulai sinkronisasi data 52 pegawai dengan SIMPEG? (Akses role & izin granular tidak akan diubah)')) return;
    setMigrating(true);
    try {
      const staffRef = collection(db, 'staff');
      const staffSnap = await getDocs(staffRef);
      const existingStaff = staffSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let updatedCount = 0;
      let addedCount = 0;

      for (const newStaff of INITIAL_STAFF_DATA) {
        const match = existingStaff.find(s => s.nama.toLowerCase().trim() === newStaff.nama_lengkap.toLowerCase().trim());

        const staffPayload = {
          nama: newStaff.nama_lengkap,
          nip: newStaff.nip || '-',
          status: newStaff.status_kepegawaian.includes('PNS') || newStaff.status_kepegawaian.includes('PPPK') ? 'ASN' : 'MAGANG',
          status_detail: newStaff.status_kepegawaian,
          tanggal_lahir: newStaff.tanggal_lahir || '-',
          jenis_kelamin: newStaff.jenis_kelamin || '-',
          pangkat: newStaff.pangkat || '-',
          golongan: newStaff.golongan_ruang || '-',
          pendidikan: newStaff.pendidikan_terakhir || '-',
          lastUpdated: new Date().toISOString()
        };

        if (match) {
          await updateDoc(doc(db, 'staff', match.id), staffPayload);
          updatedCount++;
        } else {
          const username = newStaff.nama_lengkap.split(',')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
          await addDoc(collection(db, 'staff'), {
            ...staffPayload,
            pos: 'BELUM DITUGASKAN',
            role: ['petugas'],
            permissions: {},
            username: username,
            pin: '123456',
            isActive: true
          });
          addedCount++;
        }
      }
      alert(\`Sinkronisasi Selesai! \${updatedCount} diperbarui, \${addedCount} baru ditambahkan.\`);
    } catch (error) {
      alert(\`Gagal sinkronisasi: \${error.message}\`);
    } finally {
      setMigrating(false);
    }
  };`;

content = content.replace(oldMigrateFunctionRegex, newMigrateFunction);

fs.writeFileSync(file, content);
console.log('Script inject sukses.');
