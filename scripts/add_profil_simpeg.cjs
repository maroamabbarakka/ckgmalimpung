const fs = require('fs');

const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlockRegex = /\{\/\* Izin Akses Matrix \*\/\}/;

const newBlock = `{/* Profil SIMPEG */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-slate-900">Profil SIMPEG</h3>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">Data Kepegawaian Nasional</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">NIP / ID Pegawai</span>
                      <input value={editStaff.nip || ''} onChange={(e) => setEditStaff({...editStaff, nip: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="1980... / -" />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Kategori Detail SIMPEG</span>
                      <input value={editStaff.status_detail || ''} onChange={(e) => setEditStaff({...editStaff, status_detail: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="PNS / PPPK / Non-ASN Magang" />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Tanggal Lahir</span>
                      <input type="date" value={editStaff.tanggal_lahir || ''} onChange={(e) => setEditStaff({...editStaff, tanggal_lahir: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Jenis Kelamin</span>
                      <select value={editStaff.jenis_kelamin || ''} onChange={(e) => setEditStaff({...editStaff, jenis_kelamin: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow">
                        <option value="">-- Belum Diatur --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Pangkat</span>
                      <input value={editStaff.pangkat || ''} onChange={(e) => setEditStaff({...editStaff, pangkat: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="Pembina / Penata / -" />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Golongan Ruang</span>
                      <input value={editStaff.golongan || ''} onChange={(e) => setEditStaff({...editStaff, golongan: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="III/b / IV/a / -" />
                    </label>

                    <label className="block lg:col-span-3">
                      <span className="mb-1 block text-xs font-bold text-slate-500">Pendidikan Terakhir</span>
                      <input value={editStaff.pendidikan || ''} onChange={(e) => setEditStaff({...editStaff, pendidikan: e.target.value})} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-shadow" placeholder="Misal: S1 Kedokteran, D-III Kebidanan" />
                    </label>
                  </div>
                </div>

                {/* Izin Akses Matrix */}`;

content = content.replace(oldBlockRegex, newBlock);

fs.writeFileSync(file, content);
console.log('Profil SIMPEG section added successfully.');
