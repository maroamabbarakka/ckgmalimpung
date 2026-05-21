const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject state
const stateAnchor = `const [isNotifOpen, setIsNotifOpen] = useState(false);`;
const stateInjection = `const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(true);`;
content = content.replace(stateAnchor, stateInjection);

// 2. Update notification red dot condition
const notifDotStart = `<span className="absolute top-2 right-2.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                   </span>`;
const notifDotReplacement = `{hasNewNotif && (
                   <span className="absolute top-2 right-2.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                   </span>
                   )}`;
content = content.replace(notifDotStart, notifDotReplacement);

// 3. Update Lihat Semua Aktivitas button
const lihatSemuaStart = `<div className="p-3 bg-slate-50 text-center border-t border-slate-100 cursor-pointer hover:bg-slate-100 transition">
                         <span className="text-xs font-bold text-teal-600">Lihat Semua Aktivitas</span>
                      </div>`;
const lihatSemuaReplacement = `<div onClick={() => { setHasNewNotif(false); setIsNotifOpen(false); setActiveMenu('log'); }} className="p-3 bg-slate-50 text-center border-t border-slate-100 cursor-pointer hover:bg-slate-100 transition">
                         <span className="text-xs font-bold text-teal-600">Lihat Semua Aktivitas</span>
                      </div>`;
content = content.replace(lihatSemuaStart, lihatSemuaReplacement);

// 4. Add case 'log' to getHeaderTitle
const getHeaderTitleStart = `case 'profil': return { title: 'Profil Akun & Izin Akses', subtitle: 'Manajemen informasi pribadi dan keamanan akun Anda.' };`;
const getHeaderTitleReplacement = `case 'profil': return { title: 'Profil Akun & Izin Akses', subtitle: 'Manajemen informasi pribadi dan keamanan akun Anda.' };
      case 'log': return { title: 'Log Aktivitas Sistem', subtitle: 'Jejak rekam historis dari seluruh aktivitas dan perubahan data sistem.' };`;
content = content.replace(getHeaderTitleStart, getHeaderTitleReplacement);

// 5. Inject the UI for 'log'
const appendAnchor = `</section>
          )}

          {activeMenu === 'sekolah' && (`;
          
const logUI = `</section>
          )}

          {activeMenu === 'log' && (
              <section className="space-y-6 animate-in fade-in duration-500">
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div>
                          <h3 className="text-lg font-black text-slate-900">Rekam Jejak Aktivitas</h3>
                          <p className="text-xs font-semibold text-slate-500">Daftar historis semua event, sinkronisasi, dan intervensi yang terjadi.</p>
                       </div>
                       <div className="flex gap-2">
                          <button className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition">Filter Waktu</button>
                          <button className="px-4 py-2 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-100 hover:bg-teal-100 transition">Ekspor (CSV)</button>
                       </div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                       <div className="p-6 hover:bg-slate-50 transition flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0 text-lg">📝</div>
                          <div>
                             <p className="text-sm font-black text-slate-800">Data kunjungan baru berhasil disinkronisasi.</p>
                             <p className="text-xs text-slate-500 mt-1">Sistem menyinkronkan 12 data pendaftaran dari Pos 1 ke database sentral.</p>
                             <p className="text-[10px] font-bold text-slate-400 mt-2">Hari ini, 08:30 WITA • Oleh: Sistem</p>
                          </div>
                       </div>
                       
                       <div className="p-6 hover:bg-slate-50 transition flex gap-4 bg-rose-50/30">
                          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 text-lg">⚠️</div>
                          <div>
                             <p className="text-sm font-black text-slate-800">Peringatan: 5 Pasien Hipertensi baru terdeteksi.</p>
                             <p className="text-xs text-slate-500 mt-1">Sistem otomatis mendeteksi tekanan darah melebihi ambang batas (>=140 mmHg).</p>
                             <p className="text-[10px] font-bold text-slate-400 mt-2">Hari ini, 08:15 WITA • Oleh: Modul Analitik</p>
                          </div>
                       </div>

                       <div className="p-6 hover:bg-slate-50 transition flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 text-lg">📥</div>
                          <div>
                             <p className="text-sm font-black text-slate-800">Pengunduhan laporan agregat Excel.</p>
                             <p className="text-xs text-slate-500 mt-1">Berkas 'Tabel_Layanan_Umum.xlsx' berhasil dihasilkan dan diunduh.</p>
                             <p className="text-[10px] font-bold text-slate-400 mt-2">Kemarin, 14:20 WITA • Oleh: Administrator</p>
                          </div>
                       </div>
                       
                       <div className="p-6 hover:bg-slate-50 transition flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 text-lg">🔐</div>
                          <div>
                             <p className="text-sm font-black text-slate-800">Login Sistem Berhasil.</p>
                             <p className="text-xs text-slate-500 mt-1">Autentikasi sesi berhasil untuk pengguna administrator.</p>
                             <p className="text-[10px] font-bold text-slate-400 mt-2">Kemarin, 07:55 WITA • Oleh: Administrator</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 text-center">
                       <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition">Muat lebih banyak...</button>
                    </div>
                 </div>
              </section>
          )}

          {activeMenu === 'sekolah' && (`;

if (content.includes(appendAnchor)) {
    content = content.replace(appendAnchor, logUI);
    fs.writeFileSync(file, content);
    console.log('Notif interaction and Log view successfully added!');
} else {
    console.log('Failed to find anchor for Log UI insertion.');
}
