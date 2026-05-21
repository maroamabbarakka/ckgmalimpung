const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const appendAnchor = `{activeMenu === 'sekolah' && (`;
          
const profilUI = `{activeMenu === 'profil' && (
              <section className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto mb-12">
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
                    <div className="px-6 sm:px-10 pb-8 relative">
                       <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-12 mb-8">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white p-2 shadow-lg z-10">
                             <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-black text-4xl border-2 border-white">
                                {(sessionStorage.getItem('namaPegawai') || 'Administrator').charAt(0).toUpperCase()}
                             </div>
                          </div>
                          <div className="text-center sm:text-left mb-2">
                             <h3 className="text-2xl font-black text-slate-900">{sessionStorage.getItem('namaPegawai') || 'Administrator'}</h3>
                             <p className="text-sm font-bold text-teal-600">Administrator CKG</p>
                          </div>
                          <div className="sm:ml-auto flex gap-3 mb-2">
                             <button className="px-4 py-2 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl hover:bg-teal-100 transition border border-teal-100">Ganti Kata Sandi</button>
                             <button className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition shadow-md">Edit Profil</button>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Informasi Pribadi</h4>
                                <div className="space-y-4">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Nama Lengkap</span>
                                      <span className="text-sm font-semibold text-slate-800">{sessionStorage.getItem('namaPegawai') || 'Administrator'}</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Nomor Induk Pegawai (NIP) / NIK</span>
                                      <span className="text-sm font-semibold text-slate-800">19850101 201001 2 001</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Email</span>
                                      <span className="text-sm font-semibold text-slate-800">admin.malimpung@kemkes.go.id</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">No. WhatsApp</span>
                                      <span className="text-sm font-semibold text-slate-800">+62 812-3456-7890</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="space-y-6">
                             <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Izin & Akses Sistem</h4>
                                <div className="space-y-4">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Fasilitas Kesehatan Terdaftar</span>
                                      <span className="text-sm font-semibold text-slate-800 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Puskesmas Malimpung</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Peran Aktif</span>
                                      <span className="text-sm font-semibold text-slate-800">Administrator Tingkat 1</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400">Terakhir Login</span>
                                      <span className="text-sm font-semibold text-slate-800">Hari ini, pukul 08:15 WITA</span>
                                   </div>
                                </div>
                             </div>
                             
                             <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Sesi Perangkat Aktif</h4>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">💻</div>
                                   <div>
                                      <p className="text-xs font-bold text-slate-800">Windows 11 • Chrome</p>
                                      <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Sedang Digunakan</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>
          )}

          {activeMenu === 'sekolah' && (`;
          
if(content.includes(appendAnchor)) {
    content = content.replace(appendAnchor, profilUI);
    fs.writeFileSync(file, content);
    console.log('Profil view successfully added!');
} else {
    console.log('Failed to find anchor for Profil UI insertion.');
}
