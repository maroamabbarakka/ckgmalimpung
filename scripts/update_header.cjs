const fs = require('fs');
const file = 'd:/PKM_MALIMPUNG/ckg-malimpung/src/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject state
const stateAnchor = `const [showFilters, setShowFilters] = useState(false);`;
const stateInjection = `const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);`;
content = content.replace(stateAnchor, stateInjection);

// 2. Replace Header and remove redundant title block
const headerStartAnchor = `<header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-8">`;
const oldTitleEndAnchor = `</p>
             </div>
          )}`;
          
const headerIdx = content.indexOf(headerStartAnchor);
const oldTitleEndIdx = content.indexOf(oldTitleEndAnchor, headerIdx);

if (headerIdx !== -1 && oldTitleEndIdx !== -1) {
    const newHeader = `<header className="sticky top-0 z-50 flex min-h-[5rem] items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm lg:px-8 transition-all">
          <div className="flex items-center gap-4 py-2">
            <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            
            {/* Dynamic Title Moved to Header */}
            <div className="flex flex-col justify-center animate-in fade-in slide-in-from-left-4 duration-500">
               <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                  {headerInfo?.title || 'Master Command Center'}
               </h1>
               <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-0.5">
                  {headerInfo?.subtitle || 'Dashboard Eksekutif TERSANJUNG'}
               </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 relative">
             {/* Notification Bell */}
             <div className="relative">
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all relative group">
                   <svg className="w-5 h-5 group-hover:animate-swing" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                   <span className="absolute top-2 right-2.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                   </span>
                </button>
                
                {isNotifOpen && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                   <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                         <h3 className="font-black text-slate-800 text-sm">Log Aktivitas Sistem</h3>
                         <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Live</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                         <div className="p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer flex gap-3 border-b border-slate-50">
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">📝</div>
                            <div>
                               <p className="text-xs font-bold text-slate-700">Data kunjungan baru sinkronisasi</p>
                               <p className="text-[10px] text-slate-400 mt-0.5">2 menit yang lalu</p>
                            </div>
                         </div>
                         <div className="p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer flex gap-3 border-b border-slate-50">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">⚠️</div>
                            <div>
                               <p className="text-xs font-bold text-slate-700">Peringatan: 5 Pasien Hipertensi baru terdeteksi</p>
                               <p className="text-[10px] text-slate-400 mt-0.5">15 menit yang lalu</p>
                            </div>
                         </div>
                      </div>
                      <div className="p-3 bg-slate-50 text-center border-t border-slate-100 cursor-pointer hover:bg-slate-100 transition">
                         <span className="text-xs font-bold text-teal-600">Lihat Semua Aktivitas</span>
                      </div>
                   </div>
                   </>
                )}
             </div>

             {/* User Profile */}
             <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all focus:outline-none">
                   <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-black shadow-sm text-sm border-2 border-white">
                      {userName.charAt(0).toUpperCase()}
                   </div>
                   <div className="hidden md:flex flex-col items-start text-left">
                      <span className="text-sm font-black text-slate-800 leading-none max-w-[150px] truncate">{userName}</span>
                      <span className="text-[10px] font-bold text-slate-500 mt-1">Puskesmas Malimpung</span>
                   </div>
                   <svg className="w-4 h-4 text-slate-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {isProfileOpen && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                   <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2">
                      <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center text-center">
                         <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-black shadow-md text-xl border-2 border-white mb-2">
                            {userName.charAt(0).toUpperCase()}
                         </div>
                         <span className="text-sm font-black text-slate-800">{userName}</span>
                         <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full mt-1">Administrator CKG</span>
                      </div>
                      <div className="p-2">
                         <button className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            Profil dan izin akses
                         </button>
                         <button className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Pengaturan Sistem
                         </button>
                      </div>
                      <div className="p-2 border-t border-slate-100">
                         <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            Keluar Sistem
                         </button>
                      </div>
                   </div>
                   </>
                )}
             </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8">`;
    
    content = content.substring(0, headerIdx) + newHeader + content.substring(oldTitleEndIdx + oldTitleEndAnchor.length);
    fs.writeFileSync(file, content);
    console.log('Header successfully updated!');
} else {
    console.log('Failed to find header anchor.');
}
