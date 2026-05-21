import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const Dashboard = lazy(() => import('./Dashboard'));
const KunjunganRumah = lazy(() => import('./KunjunganRumah'));
const Login = lazy(() => import('./Login'));
const Loket = lazy(() => import('./Loket'));
const Pos1 = lazy(() => import('./Pos1'));
const Pos2 = lazy(() => import('./Pos2'));
const Pos3 = lazy(() => import('./Pos3'));
const Pos4 = lazy(() => import('./Pos4'));
const Pos5 = lazy(() => import('./Pos5'));
const Pos6 = lazy(() => import('./Pos6'));
const Pos7 = lazy(() => import('./Pos7'));
const RaporDigital = lazy(() => import('./RaporDigital'));
const TvDisplay = lazy(() => import('./TvDisplay'));

const LOGO_PINRANG = '/logo_pinrang.png';
const LOGO_MALIMPUNG = '/logo_malimpung.png';

const roleGroups = {
  pos1: ['petugas'],
  pos2: ['ttlm', 'perawat', 'perawat_bidan'],
  pos3: ['dokter', 'perawat', 'perawat_bidan'],
  pos4: ['dokter', 'perawat', 'apoteker'],
  pos5: ['dokter', 'perawat', 'perawat_bidan', 'apoteker'],
  pos6: ['dokter'],
  pos7: ['dokter', 'perawat', 'perawat_bidan', 'apoteker'],
  field: ['dokter', 'perawat', 'perawat_bidan'],
  staff: ['petugas', 'ttlm', 'perawat', 'perawat_bidan', 'dokter', 'apoteker'],
  dashboard: ['dokter']
};

const posCards = [
  { to: '/pos1', label: 'Pos 1', subtitle: 'Registrasi', icon: '🪪', roles: roleGroups.pos1, bg: 'hover:bg-blue-600', iconBg: 'bg-blue-100 group-hover:bg-blue-500' },
  { to: '/pos2', label: 'Pos 2', subtitle: 'TTV & Lab', icon: '🔬', roles: roleGroups.pos2, bg: 'hover:bg-indigo-500', iconBg: 'bg-indigo-100 group-hover:bg-indigo-400' },
  { to: '/pos3', label: 'Pos 3', subtitle: 'Fisik', icon: '🩺', roles: roleGroups.pos3, bg: 'hover:bg-rose-500', iconBg: 'bg-rose-100 group-hover:bg-rose-400' },
  { to: '/pos4', label: 'Pos 4', subtitle: 'PTM', icon: '🫁', roles: roleGroups.pos4, bg: 'hover:bg-purple-500', iconBg: 'bg-purple-100 group-hover:bg-purple-400' },
  { to: '/pos5', label: 'Pos 5', subtitle: 'Khusus', icon: '📋', roles: roleGroups.pos5, bg: 'hover:bg-fuchsia-500', iconBg: 'bg-fuchsia-100 group-hover:bg-fuchsia-400' },
  { to: '/pos6', label: 'Pos 6', subtitle: 'Diagnosis', icon: '⚕️', roles: roleGroups.pos6, bg: 'hover:bg-cyan-500', iconBg: 'bg-cyan-100 group-hover:bg-cyan-400' },
  { to: '/pos7', label: 'Pos 7', subtitle: 'Rapor', icon: '📄', roles: roleGroups.pos7, bg: 'hover:bg-emerald-500', iconBg: 'bg-emerald-100 group-hover:bg-emerald-400' },
  { to: '/kunjungan-rumah', label: 'Door to Door', subtitle: 'Layanan Lapangan', icon: '🏘️', roles: roleGroups.field, bg: 'hover:bg-emerald-600', iconBg: 'bg-emerald-100 group-hover:bg-emerald-400' }
];

const posNavItems = posCards.filter((item) => item.to.startsWith('/pos'));

const mobileNavItems = [
  { to: '/', label: 'Beranda', icon: '🏠' },
  { to: '/loket', label: 'Loket', icon: '🎟️', roles: roleGroups.staff },
  ...posNavItems.map((item) => ({ to: item.to, label: item.label.toUpperCase(), icon: item.icon, roles: item.roles })),
  { to: '/dashboard', label: 'Data', icon: '📊', roles: roleGroups.dashboard }
];

const checkIsAuthenticated = () => sessionStorage.getItem('isAuthenticated') === 'true';

const getUserRoles = () => {
  const rawRole = sessionStorage.getItem('rolePegawai');
  if (!rawRole) return [];
  try {
    const parsed = JSON.parse(rawRole);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return rawRole.split(',').map((role) => role.trim()).filter(Boolean);
  }
};

const checkIsAdmin = () => getUserRoles().includes('admin');

const checkAccess = (allowedRoles) => {
  const userRoles = getUserRoles();
  if (userRoles.includes('admin')) return true;
  return allowedRoles.some((role) => userRoles.includes(role));
};

const RoleRoute = ({ children, allowedRoles }) => {
  if (!checkIsAuthenticated()) return <Navigate to="/login" replace />;
  if (!checkAccess(allowedRoles)) {
    alert('AKSES DITOLAK: Hak akses Anda tidak mencukupi untuk modul ini.');
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  if (!checkIsAuthenticated()) return <Navigate to="/login" replace />;
  if (!checkIsAdmin()) {
    alert('AKSES DITOLAK: Modul ini khusus administrator.');
    return <Navigate to="/" replace />;
  }
  return children;
};

const CardMenu = ({ to, title, subtitle, icon, isAllowed, activeBgClass, activeIconClass, target }) => {
  if (!isAllowed) {
    return (
      <button
        type="button"
        onClick={() => alert('AKSES DITOLAK: Anda tidak memiliki akses ke modul ini.')}
        className="flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-[1.75rem] border border-slate-200/80 bg-slate-100/60 p-5 text-center opacity-60 grayscale"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-3xl text-slate-500">{icon}</span>
        <span className="text-base font-black text-slate-500">{title}</span>
        <span className="text-[10px] font-bold uppercase text-slate-400">{subtitle}</span>
      </button>
    );
  }

  return (
    <Link
      to={to}
      target={target}
      className={`group flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-[1.75rem] border border-slate-200/70 bg-white/75 p-5 text-center shadow-sm shadow-slate-200/70 backdrop-blur-lg transition-all duration-200 hover:-translate-y-1 hover:border-white hover:shadow-xl hover:shadow-slate-300/50 ${activeBgClass}`}
    >
      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-colors group-hover:text-white ${activeIconClass}`}>
        {icon}
      </span>
      <span className="mt-1 text-base font-black text-slate-800 group-hover:text-white">{title}</span>
      <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-white/90">{subtitle}</span>
    </Link>
  );
};

const NavDesktopItem = ({ to, label, isActive, isAllowed, activeColor }) => {
  if (!isAllowed) {
    return (
      <span title="Akses ditolak" className="rounded-lg px-3 py-2 font-bold text-slate-300">
        {label}
      </span>
    );
  }
  return (
    <Link to={to} className={`rounded-lg px-3 py-2 font-bold transition-colors ${isActive ? activeColor : 'text-slate-500 hover:bg-slate-100'}`}>
      {label}
    </Link>
  );
};

const NavMobileItem = ({ to, icon, label, isActive, isAllowed, itemRef }) => {
  const baseClass =
    'relative flex h-full min-w-[82px] flex-col items-center justify-center gap-1.5 border-r border-slate-200 px-2 pb-2 pt-2 transition-all duration-200';

  if (!isAllowed) {
    return (
      <button type="button" ref={itemRef} onClick={() => alert('AKSES DITOLAK')} className={`${baseClass} text-slate-300 grayscale`}>
        <span className="text-2xl leading-none">{icon}</span>
        <span className="max-w-full truncate text-[9px] font-black uppercase tracking-wide">{label}</span>
      </button>
    );
  }

  return (
    <Link ref={itemRef} to={to} className={`${baseClass} group ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-2xl text-2xl leading-none transition-all duration-200 group-active:scale-95 ${isActive ? '-translate-y-1 scale-110 bg-white shadow-lg shadow-teal-200/80 ring-1 ring-teal-100' : 'group-hover:-translate-y-0.5 group-hover:scale-105'}`}>
        {icon}
      </span>
      <span className={`max-w-full truncate text-[9px] font-black uppercase tracking-wide ${isActive ? 'text-teal-700' : ''}`}>{label}</span>
      {isActive && (
        <>
          <span className="absolute bottom-0 left-3 right-3 h-1 rounded-t-full bg-teal-500" />
          <span className="absolute inset-x-4 bottom-1 h-6 rounded-full bg-teal-300/20 blur-md" />
        </>
      )}
    </Link>
  );
};

function MobileBottomNav({ pathname }) {
  const itemRefs = useRef({});

  useEffect(() => {
    const activeItem = mobileNavItems.find((item) => item.to === pathname) || mobileNavItems.find((item) => pathname.startsWith(item.to) && item.to !== '/');
    const activeNode = activeItem ? itemRefs.current[activeItem.to] : null;
    activeNode?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-[78px] border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_28px_-18px_rgba(15,23,42,0.55)] backdrop-blur-md print:hidden md:hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-7 items-center justify-start bg-gradient-to-r from-white via-white/90 to-transparent text-xl font-black text-teal-500">
        ‹
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-7 items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent text-xl font-black text-teal-500">
        ›
      </div>
      <div className="flex h-full overflow-x-auto overscroll-x-contain scroll-smooth px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mobileNavItems.map((item) => (
          <NavMobileItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            isActive={pathname === item.to}
            isAllowed={!item.roles || checkAccess(item.roles)}
            itemRef={(node) => {
              itemRefs.current[item.to] = node;
            }}
          />
        ))}
      </div>
    </nav>
  );
}

function Beranda() {
  const isAdmin = checkIsAdmin();

  return (
    <div className="relative z-10 flex min-h-[85vh] flex-col items-center justify-center px-4 py-10 md:py-16">
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }`}</style>

      <div className="animate-fade-in-up mb-8 flex items-center gap-6 md:gap-8">
        <img src={LOGO_PINRANG} alt="Logo Pinrang" className="h-20 w-auto object-contain drop-shadow-md md:h-28" />
        <div className="h-16 w-px rounded-full bg-slate-300/60" />
        <img src={LOGO_MALIMPUNG} alt="Logo Malimpung" className="h-20 w-auto object-contain drop-shadow-md md:h-28" />
      </div>

      <div className="animate-fade-in-up mb-12 max-w-4xl text-center" style={{ animationDelay: '0.1s' }}>
        <h1 className="mb-2 bg-gradient-to-r from-teal-800 to-emerald-500 bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-sm md:text-6xl">
          TERSANJUNG
        </h1>
        <p className="text-balance text-xs font-bold uppercase leading-relaxed tracking-[0.15em] text-slate-500 md:text-sm md:leading-normal">
          Sistem Informasi Layanan Kesehatan Berbasis Jaringan Terpadu Puskesmas Malimpung
        </p>
      </div>

      <div className="animate-fade-in-up mx-auto flex w-full max-w-6xl flex-col gap-6" style={{ animationDelay: '0.2s' }}>
        <section className="rounded-[2rem] border border-white/80 bg-white/65 p-5 shadow-xl shadow-slate-200/80 ring-1 ring-slate-100/80 backdrop-blur-xl">
          <h2 className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400">Alur Skrining Pasien</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
            {posCards.map((item) => (
              <CardMenu
                key={item.to}
                to={item.to}
                title={item.label}
                subtitle={item.subtitle}
                icon={item.icon}
                isAllowed={checkAccess(item.roles)}
                activeBgClass={item.bg}
                activeIconClass={item.iconBg}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400">Modul Layanan & Manajemen</h2>
          <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <CardMenu to="/loket" title="Loket Tiket" subtitle="Antrean" icon="🎟️" isAllowed={checkAccess(roleGroups.staff)} activeBgClass="hover:bg-amber-500" activeIconClass="bg-amber-100 group-hover:bg-amber-400" />
            <CardMenu to="/dashboard" title="Dashboard" subtitle="Analitik Data" icon="📊" isAllowed={checkAccess(roleGroups.dashboard)} activeBgClass="hover:bg-slate-800" activeIconClass="bg-slate-100 group-hover:bg-slate-700" />
            <CardMenu to="/admin" title="Admin" subtitle="Admin Dashboard" icon="🛡️" isAllowed={isAdmin} activeBgClass="hover:bg-teal-700" activeIconClass="bg-teal-100 group-hover:bg-teal-600" />
            <CardMenu to="/tentang" title="Tentang" subtitle="Info Aplikasi" icon="💡" isAllowed activeBgClass="hover:bg-sky-500" activeIconClass="bg-sky-100 group-hover:bg-sky-400" />
            <CardMenu to="/tv" target="_blank" title="Layar Antrean" subtitle="Akses Publik" icon="📺" isAllowed activeBgClass="hover:bg-blue-600" activeIconClass="bg-blue-100 group-hover:bg-blue-500" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Tentang() {
  return (
    <div className="mx-auto max-w-4xl py-10">
      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600">Tentang</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">TERSANJUNG CKG Malimpung</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
          Portal layanan Cek Kesehatan Gratis terpadu untuk alur antrean, pemeriksaan pos, rapor digital, dashboard,
          kunjungan rumah, SIMPEG, audit, dan laporan Puskesmas Malimpung.
        </p>
        <a href="/Laporan_Tersanjung_Final.html" className="mt-5 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700">
          Buka Laporan
        </a>
      </section>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;
  const isAuthenticated = checkIsAuthenticated();
  const isAdmin = checkIsAdmin();

  const isRaporMode = location.pathname.startsWith('/rapor/');
  const isTvMode = location.pathname === '/tv' || location.pathname === '/display';
  const isLoginMode = location.pathname === '/login';
  const isAdminMode = ['/admin', '/admin-dashboard', '/simpeg'].includes(location.pathname);
  const isBlankLayout = isTvMode || isLoginMode || isRaporMode || isAdminMode;

  const bgClass = isBlankLayout ? 'bg-slate-100' : 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-sky-50/30';

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${bgClass} text-slate-800 ${isBlankLayout ? '' : 'pb-28 md:pb-0'}`}>
      {!isBlankLayout && (
        <>
          <nav className="sticky top-0 z-50 hidden items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 shadow-sm backdrop-blur-md print:hidden md:flex">
            <Link to="/" className="flex items-center gap-3">
              <img src={LOGO_MALIMPUNG} alt="PKM" className="h-8 w-auto" />
              <span className="text-lg font-black leading-none text-blue-900">TERSANJUNG</span>
            </Link>

            <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className={`rounded-lg px-3 py-2 font-bold ${isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Beranda</Link>
              <NavDesktopItem to="/loket" label="Loket" isActive={isActive('/loket')} isAllowed={checkAccess(roleGroups.staff)} activeColor="bg-amber-500 text-white shadow-sm" />
              {posNavItems.map((item) => (
                <NavDesktopItem key={item.to} to={item.to} label={item.label} isActive={isActive(item.to)} isAllowed={checkAccess(item.roles)} activeColor="bg-slate-800 text-white shadow-sm" />
              ))}
              <NavDesktopItem to="/dashboard" label="Data" isActive={isActive('/dashboard')} isAllowed={checkAccess(roleGroups.dashboard)} activeColor="bg-slate-800 text-white shadow-sm" />
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && isAdmin && (
                <Link to="/admin" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200">
                  Admin
                </Link>
              )}
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-100">
                  Keluar
                </button>
              ) : (
                <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-sm hover:bg-blue-700">
                  Masuk
                </Link>
              )}
            </div>
          </nav>

          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md print:hidden md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <img src={LOGO_MALIMPUNG} alt="PKM" className="h-8 w-auto" />
              <span className="text-lg font-black leading-none text-blue-900">TERSANJUNG</span>
            </Link>
            <div className="flex items-center gap-2">
              {isAuthenticated && isAdmin && (
                <Link to="/admin" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">Admin</Link>
              )}
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600">Keluar</button>
              ) : (
                <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-sm">Masuk</Link>
              )}
            </div>
          </div>
        </>
      )}

      <main className={isBlankLayout ? 'w-full' : 'relative z-10 mx-auto max-w-7xl p-4 md:p-8'}>
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm font-bold text-teal-700">Memuat modul...</div>}>
          <Routes>
            <Route path="/" element={<Beranda />} />
            <Route path="/login" element={<Login />} />
            <Route path="/loket" element={<RoleRoute allowedRoles={roleGroups.staff}><Loket /></RoleRoute>} />
            <Route path="/tv" element={<TvDisplay />} />
            <Route path="/display" element={<TvDisplay />} />
            <Route path="/tentang" element={<Tentang />} />
            <Route path="/rapor" element={<RaporDigital />} />
            <Route path="/rapor/:id" element={<RaporDigital />} />
            <Route path="/pos1" element={<RoleRoute allowedRoles={roleGroups.pos1}><Pos1 /></RoleRoute>} />
            <Route path="/pos2" element={<RoleRoute allowedRoles={roleGroups.pos2}><Pos2 /></RoleRoute>} />
            <Route path="/pos3" element={<RoleRoute allowedRoles={roleGroups.pos3}><Pos3 /></RoleRoute>} />
            <Route path="/pos4" element={<RoleRoute allowedRoles={roleGroups.pos4}><Pos4 /></RoleRoute>} />
            <Route path="/pos5" element={<RoleRoute allowedRoles={roleGroups.pos5}><Pos5 /></RoleRoute>} />
            <Route path="/pos6" element={<RoleRoute allowedRoles={roleGroups.pos6}><Pos6 /></RoleRoute>} />
            <Route path="/pos7" element={<RoleRoute allowedRoles={roleGroups.pos7}><Pos7 /></RoleRoute>} />
            <Route path="/dashboard" element={<RoleRoute allowedRoles={roleGroups.dashboard}><Dashboard /></RoleRoute>} />
            <Route path="/kunjungan-rumah" element={<RoleRoute allowedRoles={roleGroups.field}><KunjunganRumah /></RoleRoute>} />
            <Route path="/kunjungan" element={<Navigate to="/kunjungan-rumah" replace />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/simpeg" element={<AdminRoute><AdminDashboard initialMenu="simpeg" /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {!isBlankLayout && <MobileBottomNav pathname={location.pathname} />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}

export default App;
