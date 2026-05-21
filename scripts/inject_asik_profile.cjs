const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. We need an icon for the back button and user avatar placeholder.
// The user avatar can just be a styled div.

// 2. We replace the current modal content (lines 1600-1689).
// Let's find the exact string of the modal.
const modalRegex = /\{isStaffModalOpen && editStaff && \([\s\S]*?\}\)/;

const newModalUI = `{isStaffModalOpen && editStaff && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl">
            
            {/* Header Profil */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition">
                  <span className="text-xl font-black text-slate-700">←</span>
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Profil</h2>
                  <p className="text-xs font-semibold text-slate-500">Lengkapi profil dengan mengisi data berikut</p>
                </div>
              </div>
              <button type="button" onClick={() => handleSaveStaff(new Event('submit'))} className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-black text-white hover:bg-teal-700 shadow-sm transition">
                Simpan
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="mx-auto max-w-4xl space-y-6">
                
                {/* Informasi Akun */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-slate-900">Informasi akun</h3>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700">Wajib Diisi</span>
                  </div>
                  
                  <div className="flex flex-col gap-8 md:flex-row md:items-start">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl font-black text-slate-500">
                        {editStaff.nama ? editStaff.nama.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <input value={editStaff.nama} onChange={(e) => setEditStaff({...editStaff, nama: e.target.value})} placeholder="Nama Lengkap" className="block border-b border-transparent text-lg font-black text-slate-900 focus:border-teal-500 focus:outline-none" required />
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <span>@{editStaff.username || 'username'}</span>
                          <span>•</span>
                          <input value={editStaff.username} onChange={(e) => setEditStaff({...editStaff, username: e.target.value.toLowerCase().replace(/\\s/g, '')})} placeholder="Ubah Username" className="w-24 border-b border-dashed border-slate-300 text-teal-600 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-500">Status Kepegawaian</span>
                          <select value={editStaff.status} onChange={(e) => setEditStaff({...editStaff, status: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none">
                            <option value="ASN">ASN</option>
                            <option value="MAGANG">Sukarela/Magang</option>
                            <option value="KONSULTAN IT">Mitra IT</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-500">Penugasan Pos CKG</span>
                          <select value={editStaff.pos} onChange={(e) => setEditStaff({...editStaff, pos: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none">
                            <option value="BELUM DITUGASKAN">Belum Ditugaskan</option>
                            <option value="POS 1">POS 1</option>
                            <option value="POS 2">POS 2</option>
                            <option value="POS 3">POS 3</option>
                            <option value="POS 4">POS 4</option>
                            <option value="ALL ACCESS">All Access</option>
                          </select>
                        </label>
                      </div>
                      
                      {!editStaff.id && (
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-500">PIN Awal</span>
                          <input value={editStaff.pin} onChange={(e) => setEditStaff({...editStaff, pin: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-teal-500 focus:outline-none" placeholder="Masukkan PIN 6 angka" required />
                        </label>
                      )}
                      
                      {editStaff.id && (
                        <div className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                          <div>
                            <span className="block text-xs font-bold text-slate-900">Kata Sandi / PIN</span>
                            <span className="block text-[10px] font-medium text-slate-500">Reset PIN menjadi 123456 jika lupa.</span>
                          </div>
                          <button type="button" onClick={() => handleResetPIN(editStaff)} className="rounded text-xs font-black text-rose-600 hover:text-rose-700 hover:underline">
                            Reset PIN
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Izin Akses Matrix */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900">Izin akses</h3>
                    <p className="text-xs font-medium text-slate-500">Atur kapabilitas pegawai untuk setiap modul di Puskesmas Malimpung.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        title: 'CKG Umum & Antrean',
                        key: 'ckg_umum',
                        rows: [
                          { label: 'Pendaftaran & Antrean (Pos 1)', defaultInput: true },
                          { label: 'Pelayanan Dasar (Pos 2 & 3)', defaultInput: true },
                          { label: 'Pelayanan Lanjutan (Pos 4 & 5)', defaultInput: true },
                          { label: 'Dashboard Pemantauan & Peta Wilayah', defaultView: true }
                        ]
                      },
                      {
                        title: 'Modul Klaster 2 (KIA & Indera)',
                        key: 'klaster2',
                        rows: [
                          { label: 'Skrining Indera (Visus & Pendengaran)', defaultInput: true },
                          { label: 'Kesehatan Jiwa (SRQ-20, SDQ)', defaultInput: true },
                          { label: 'Dashboard KIA & Indera', defaultView: true }
                        ]
                      },
                      {
                        title: 'Penyakit Tidak Menular (PTM)',
                        key: 'ptm',
                        rows: [
                          { label: 'Skrining Hipertensi & Diabetes', defaultInput: true },
                          { label: 'Pemeriksaan Paru & TB', defaultInput: true },
                          { label: 'Dashboard Peta Kritis PTM', defaultView: true, defaultManage: true }
                        ]
                      },
                      {
                        title: 'SIMPEG & Pengaturan Sistem',
                        key: 'admin',
                        rows: [
                          { label: 'Manajemen Hak Akses & Profil Nakes', defaultManage: true },
                          { label: 'Audit Log & Backup Database', defaultManage: true, defaultDownload: true },
                          { label: 'Ekspor Laporan Resmi (Excel)', defaultDownload: true }
                        ]
                      }
                    ].map((module) => {
                      const isModuleActive = editStaff.role?.some(r => r === 'admin' || (module.key === 'ckg_umum' && ['petugas','dokter','perawat'].includes(r)));
                      
                      return (
                        <div key={module.key} className="overflow-hidden rounded-lg border border-slate-200">
                          <div className="flex cursor-pointer items-center justify-between bg-slate-50 px-5 py-3 hover:bg-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">^</span>
                              <h4 className="font-black text-slate-800">{module.title}</h4>
                            </div>
                          </div>
                          <div className="border-t border-slate-200 bg-white p-0">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                  <th className="px-5 py-3 font-semibold">Layanan</th>
                                  <th className="px-3 py-3 text-center font-semibold">Lihat</th>
                                  <th className="px-3 py-3 text-center font-semibold">Input</th>
                                  <th className="px-3 py-3 text-center font-semibold">Kelola</th>
                                  <th className="px-3 py-3 text-center font-semibold">Unduh</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {module.rows.map((row, idx) => {
                                  const isAdmin = editStaff.role?.includes('admin');
                                  const isDoctor = editStaff.role?.includes('dokter');
                                  
                                  // Simulating logic based on generic roles for UI purpose
                                  const canView = isAdmin || isDoctor || row.defaultView || row.defaultInput;
                                  const canInput = isAdmin || isDoctor || row.defaultInput;
                                  const canManage = isAdmin || row.defaultManage;
                                  const canDownload = isAdmin || row.defaultDownload;

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="px-5 py-3 font-medium text-slate-700">{row.label}</td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canView} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" disabled={!isAdmin} />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canInput} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" disabled={!isAdmin} />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canManage} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" disabled={!isAdmin} />
                                      </td>
                                      <td className="px-3 py-3 text-center">
                                        <input type="checkbox" checked={canDownload} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" disabled={!isAdmin} />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fallback Legacy Role Mapping (Hidden from UI but manages backend roles) */}
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Penyelarasan Role Sistem Inti</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ROLES.map((role) => (
                        <label key={role.id} className={\`cursor-pointer rounded-full border px-3 py-1 text-[11px] font-black uppercase transition-colors \${editStaff.role?.includes(role.id) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}\`}>
                          <input type="checkbox" className="hidden" checked={editStaff.role?.includes(role.id)} onChange={() => handleRoleToggle(role.id)} />
                          {role.id.replace('_', ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Hidden Submit Button to allow handleSaveStaff to be called properly without changing its logic */}
            <form onSubmit={handleSaveStaff} className="hidden"><button id="hidden-submit-btn" type="submit">Submit</button></form>

          </div>
        </div>
      )}`;

content = content.replace(modalRegex, newModalUI);

fs.writeFileSync(file, content);
console.log('UI Profil dan Izin Akses ala ASIK berhasil diinjeksi.');
