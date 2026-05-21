const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add handlePermissionToggle function
const toggleFunction = `
  const handlePermissionToggle = (permKey, action, fallbackValue) => {
    setEditStaff((prev) => {
      const currentPerms = prev.permissions || {};
      const rowPerm = currentPerms[permKey] || {};
      const currentValue = rowPerm[action] !== undefined ? rowPerm[action] : fallbackValue;
      
      return {
        ...prev,
        permissions: {
          ...currentPerms,
          [permKey]: {
            ...rowPerm,
            [action]: !currentValue
          }
        }
      };
    });
  };
`;

content = content.replace(
  `const handleRoleToggle = (roleId) => {`,
  toggleFunction + `\n  const handleRoleToggle = (roleId) => {`
);

// 2. Modify the openStaffForm to include permissions
content = content.replace(
  `? { ...staff, role: Array.isArray(staff.role) ? staff.role : [staff.role].filter(Boolean) }`,
  `? { ...staff, role: Array.isArray(staff.role) ? staff.role : [staff.role].filter(Boolean), permissions: staff.permissions || {} }`
);
content = content.replace(
  `: { nama: '', status: 'ASN', pos: 'BELUM DITUGASKAN', role: ['petugas'], username: '', pin: '123456' }`,
  `: { nama: '', status: 'ASN', pos: 'BELUM DITUGASKAN', role: ['petugas'], permissions: {}, username: '', pin: '123456' }`
);

// 3. Add permKey to the rows array
content = content.replace(
  `{ label: 'Pendaftaran & Antrean (Pos 1)', defaultInput: true },`,
  `{ label: 'Pendaftaran & Antrean (Pos 1)', defaultInput: true, permKey: 'pos1' },`
);
content = content.replace(
  `{ label: 'Pelayanan Dasar (Pos 2 & 3)', defaultInput: true },`,
  `{ label: 'Pelayanan Dasar (Pos 2 & 3)', defaultInput: true, permKey: 'pos2_3' },`
);
content = content.replace(
  `{ label: 'Pelayanan Lanjutan (Pos 4 & 5)', defaultInput: true },`,
  `{ label: 'Pelayanan Lanjutan (Pos 4 & 5)', defaultInput: true, permKey: 'pos4_5' },`
);
content = content.replace(
  `{ label: 'Dashboard Pemantauan & Peta Wilayah', defaultView: true }`,
  `{ label: 'Dashboard Pemantauan & Peta Wilayah', defaultView: true, permKey: 'dash_umum' }`
);
content = content.replace(
  `{ label: 'Skrining Indera (Visus & Pendengaran)', defaultInput: true },`,
  `{ label: 'Skrining Indera (Visus & Pendengaran)', defaultInput: true, permKey: 'indera' },`
);
content = content.replace(
  `{ label: 'Kesehatan Jiwa (SRQ-20, SDQ)', defaultInput: true },`,
  `{ label: 'Kesehatan Jiwa (SRQ-20, SDQ)', defaultInput: true, permKey: 'jiwa' },`
);
content = content.replace(
  `{ label: 'Dashboard KIA & Indera', defaultView: true }`,
  `{ label: 'Dashboard KIA & Indera', defaultView: true, permKey: 'dash_kia' }`
);
content = content.replace(
  `{ label: 'Skrining Hipertensi & Diabetes', defaultInput: true },`,
  `{ label: 'Skrining Hipertensi & Diabetes', defaultInput: true, permKey: 'skrining_ptm' },`
);
content = content.replace(
  `{ label: 'Pemeriksaan Paru & TB', defaultInput: true },`,
  `{ label: 'Pemeriksaan Paru & TB', defaultInput: true, permKey: 'paru_tb' },`
);
content = content.replace(
  `{ label: 'Dashboard Peta Kritis PTM', defaultView: true, defaultManage: true }`,
  `{ label: 'Dashboard Peta Kritis PTM', defaultView: true, defaultManage: true, permKey: 'dash_ptm' }`
);
content = content.replace(
  `{ label: 'Manajemen Hak Akses & Profil Nakes', defaultManage: true },`,
  `{ label: 'Manajemen Hak Akses & Profil Nakes', defaultManage: true, permKey: 'simpeg' },`
);
content = content.replace(
  `{ label: 'Audit Log & Backup Database', defaultManage: true, defaultDownload: true },`,
  `{ label: 'Audit Log & Backup Database', defaultManage: true, defaultDownload: true, permKey: 'audit' },`
);
content = content.replace(
  `{ label: 'Ekspor Laporan Resmi (Excel)', defaultDownload: true }`,
  `{ label: 'Ekspor Laporan Resmi (Excel)', defaultDownload: true, permKey: 'laporan' }`
);

// 4. Update the mapping logic
const oldMappingRegex = /const isAdmin = editStaff\.role\?\.includes\('admin'\);[\s\S]*?<td className="px-5 py-3 font-medium text-slate-700">\{row\.label\}<\/td>[\s\S]*?<\/tr>/;

const newMapping = `const isAdmin = editStaff.role?.includes('admin');
                                  const isDoctor = editStaff.role?.includes('dokter');
                                  
                                  const fallbackView = isAdmin || isDoctor || row.defaultView || row.defaultInput || false;
                                  const fallbackInput = isAdmin || isDoctor || row.defaultInput || false;
                                  const fallbackManage = isAdmin || row.defaultManage || false;
                                  const fallbackDownload = isAdmin || row.defaultDownload || false;

                                  const staffPerms = editStaff.permissions?.[row.permKey] || {};
                                  const canView = staffPerms.view !== undefined ? staffPerms.view : fallbackView;
                                  const canInput = staffPerms.input !== undefined ? staffPerms.input : fallbackInput;
                                  const canManage = staffPerms.manage !== undefined ? staffPerms.manage : fallbackManage;
                                  const canDownload = staffPerms.download !== undefined ? staffPerms.download : fallbackDownload;

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="px-5 py-3 font-medium text-slate-700">{row.label}</td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canView} onChange={() => handlePermissionToggle(row.permKey, 'view', fallbackView)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canInput} onChange={() => handlePermissionToggle(row.permKey, 'input', fallbackInput)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canManage} onChange={() => handlePermissionToggle(row.permKey, 'manage', fallbackManage)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canDownload} onChange={() => handlePermissionToggle(row.permKey, 'download', fallbackDownload)} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                      </td>
                                    </tr>`;

content = content.replace(oldMappingRegex, newMapping);

fs.writeFileSync(file, content);
console.log('Skema Izin Akses Granular berhasil dieksekusi.');
