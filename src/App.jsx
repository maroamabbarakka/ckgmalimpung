import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { AuthProvider, useAuth } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import RequireRole from './auth/RequireRole';
import InstallAppBanner from './components/system/InstallAppBanner';
import DraftRecoveryBanner from './components/system/DraftRecoveryBanner';
import SyncStatusBanner from './components/system/SyncStatusBanner';
import { MODULE_ACCESS } from './features/auth/roles';
import { MOBILE_NAV_ITEMS, POS_CARDS, POS_NAV_ITEMS } from './app/navigation';
import { APP_VERSION, BUILD_DATE } from './version';
import useIdleTimeout from './hooks/useIdleTimeout';
import { safeBack } from './utils/navigation';
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
const RecoveryPage = lazy(() => import('./features/recovery/RecoveryPage'));
const TvDisplay = lazy(() => import('./TvDisplay'));

const LOGO_PINRANG = '/logo_pinrang.png';
const LOGO_MALIMPUNG = '/logo_malimpung.png';

const roleGroups = MODULE_ACCESS;

const posCards = POS_CARDS;
const posNavItems = POS_NAV_ITEMS;
const mobileNavItems = MOBILE_NAV_ITEMS;

const CardMenu = ({ to, title, subtitle, icon, isAllowed, activeBgClass, activeIconClass, target }) => {
  if (!isAllowed) {
    return null;
  }

  return (
    <Link
      to={to}
      target={target}
      className={`group flex min-h-[134px] flex-col items-center justify-center gap-2 rounded-[1.75rem] border border-slate-200/70 bg-white/75 p-4 text-center shadow-sm shadow-slate-200/70 backdrop-blur-lg transition-all duration-200 hover:-translate-y-1 hover:border-white hover:shadow-xl hover:shadow-slate-300/50 md:min-h-[148px] md:p-5 ${activeBgClass}`}
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
    return null;
  }
  return (
    <Link to={to} className={`rounded-lg px-3 py-2 font-bold transition-colors ${isActive ? activeColor : 'text-slate-500 hover:bg-slate-100'}`}>
      {label}
    </Link>
  );
};

const NavMobileItem = ({ to, icon, label, isActive, isAllowed }) => {
  const baseClass =
    'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 border-r border-slate-200 px-1.5 pb-2 pt-2 transition-all duration-200 last:border-r-0';

  if (!isAllowed) {
    return null;
  }

  return (
    <Link to={to} className={`${baseClass} group ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xl font-semibold leading-none transition-all duration-200 group-active:scale-95 ${isActive ? '-translate-y-1 scale-110 bg-white shadow-lg shadow-teal-200/80 ring-1 ring-teal-100' : 'group-hover:-translate-y-0.5 group-hover:scale-105'}`}>
        {icon}
      </span>
      <span className={`max-w-full truncate text-[8px] font-black uppercase tracking-wide min-[390px]:text-[9px] ${isActive ? 'text-teal-700' : ''}`}>{label}</span>
      {isActive && (
        <>
          <span className="absolute bottom-0 left-3 right-3 h-1 rounded-t-full bg-teal-500" />
          <span className="absolute inset-x-4 bottom-1 h-6 rounded-full bg-teal-300/20 blur-md" />
        </>
      )}
    </Link>
  );
};

function MobileBottomNav({ pathname, hasAccess }) {
  const isMobileActive = (item) => {
    if (item.match === 'home') return pathname === '/';
    if (item.match === 'pos') return pathname.startsWith('/pos');
    if (item.match === 'dashboard') return pathname === '/dashboard';
    if (item.match === 'menu') return pathname === '/tentang' || pathname.startsWith('/admin');
    return pathname === item.to;
  };

  const resolveMobileTo = (item) => {
    if (item.match !== 'pos') return item.to;
    const firstAllowedPos = posNavItems.find((posItem) => hasAccess(posItem.roles));
    return firstAllowedPos?.to || item.to;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-[76px] border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_28px_-18px_rgba(15,23,42,0.55)] backdrop-blur-md print:hidden lg:hidden">
      <div className="flex h-full">
        {mobileNavItems.map((item) => (
          <NavMobileItem
            key={item.to}
            to={resolveMobileTo(item)}
            label={item.label}
            icon={item.icon}
            isActive={isMobileActive(item)}
            isAllowed={!item.roles || hasAccess(item.roles)}
          />
        ))}
      </div>
    </nav>
  );
}

function Beranda() {
  const { isAuthenticated, hasAnyRole } = useAuth();
  const isAdmin = hasAnyRole(['admin']);
  const allowedPosCards = posCards.filter((item) => hasAnyRole(item.roles));
  const moduleCards = [
    { to: '/loket', title: 'Loket Tiket', subtitle: 'Antrean', icon: 'LK', isAllowed: hasAnyRole(roleGroups.staff), activeBgClass: 'hover:bg-amber-500', activeIconClass: 'bg-amber-100 group-hover:bg-amber-400' },
    { to: '/dashboard', title: 'Dashboard', subtitle: 'Analitik Data', icon: 'DB', isAllowed: hasAnyRole(roleGroups.dashboard), activeBgClass: 'hover:bg-slate-800', activeIconClass: 'bg-slate-100 group-hover:bg-slate-700' },
    { to: '/admin', title: 'Admin', subtitle: 'Admin Dashboard', icon: 'AD', isAllowed: isAdmin, activeBgClass: 'hover:bg-teal-700', activeIconClass: 'bg-teal-100 group-hover:bg-teal-600' },
    { to: '/tentang', title: 'Tentang', subtitle: 'Info Aplikasi', icon: 'IN', isAllowed: true, activeBgClass: 'hover:bg-sky-500', activeIconClass: 'bg-sky-100 group-hover:bg-sky-400' },
    { to: '/tv', target: '_blank', title: 'Layar Antrean', subtitle: 'Mode Display', icon: 'TV', isAllowed: hasAnyRole(roleGroups.staff), activeBgClass: 'hover:bg-blue-600', activeIconClass: 'bg-blue-100 group-hover:bg-blue-500' },
  ].filter((item) => item.isAllowed);

  return (
    <div className="relative z-10 flex min-h-[85vh] flex-col items-center px-4 py-6 md:justify-center md:py-16">
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }`}</style>

      <div className="animate-fade-in-up mb-6 flex items-center gap-5 md:mb-8 md:gap-8">
        <img src={LOGO_PINRANG} alt="Logo Pinrang" className="h-16 w-auto object-contain drop-shadow-md md:h-28" />
        <div className="h-12 w-px rounded-full bg-slate-300/60 md:h-16" />
        <img src={LOGO_MALIMPUNG} alt="Logo Malimpung" className="h-16 w-auto object-contain drop-shadow-md md:h-28" />
      </div>

      <div className="animate-fade-in-up mb-8 max-w-4xl text-center md:mb-12" style={{ animationDelay: '0.1s' }}>
        <h1 className="mb-2 bg-gradient-to-r from-teal-800 to-emerald-500 bg-clip-text text-3xl font-black tracking-tight text-transparent drop-shadow-sm md:text-6xl">
          TERSANJUNG
        </h1>
        <p className="text-balance text-xs font-bold uppercase leading-relaxed tracking-[0.15em] text-slate-500 md:text-sm md:leading-normal">
          Sistem Informasi Layanan Kesehatan Berbasis Jaringan Terpadu Puskesmas Malimpung
        </p>
      </div>

      <div className="animate-fade-in-up mx-auto flex w-full max-w-6xl flex-col gap-6" style={{ animationDelay: '0.2s' }}>
        {allowedPosCards.length > 0 && (
          <section className="rounded-[2rem] border border-white/80 bg-white/65 p-4 shadow-xl shadow-slate-200/80 ring-1 ring-slate-100/80 backdrop-blur-xl md:p-5">
            <h2 className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400">Alur Skrining Pasien</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
              {allowedPosCards.map((item) => (
                <CardMenu
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  isAllowed
                  activeBgClass={item.bg}
                  activeIconClass={item.iconBg}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400">Modul Layanan & Manajemen</h2>
          <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {moduleCards.map((item) => (
              <CardMenu key={item.to} {...item} isAllowed />
            ))}
          </div>
        </section>

        {!isAuthenticated && (
          <Link
            to="/login"
            className="mx-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-black text-white shadow-lg shadow-teal-900/10 hover:bg-teal-800"
          >
            Masuk untuk mulai pelayanan
          </Link>
        )}
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
        <p className="mt-4 text-xs font-bold text-slate-500">
          Versi {APP_VERSION} | Build {BUILD_DATE}
        </p>
        <a href="/Laporan_Tersanjung_Final.html" className="mt-5 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-black text-white hover:bg-teal-700">
          Buka Laporan
        </a>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600">404</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">
        Alamat yang dibuka tidak tersedia di aplikasi CKG TERSANJUNG.
      </p>
      <Link to="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-black text-white shadow-sm hover:bg-teal-700">
        Kembali ke Beranda
      </Link>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut, hasAnyRole } = useAuth();
  const isActive = (path) => location.pathname === path;
  const isAdmin = user?.roles?.includes('admin');
  const hasAccess = (allowedRoles) => !allowedRoles || hasAnyRole(allowedRoles);

  const isRaporMode = location.pathname.startsWith('/rapor/');
  const isTvMode = location.pathname === '/tv' || location.pathname === '/display';
  const isLoginMode = location.pathname === '/login';
  const isAdminMode = ['/admin', '/admin-dashboard', '/simpeg'].includes(location.pathname);
  const isBlankLayout = isTvMode || isLoginMode || isRaporMode || isAdminMode;
  const showMobileBack = !['/', '/dashboard'].includes(location.pathname);

  const bgClass = isBlankLayout ? 'bg-slate-100' : 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-sky-50/30';
  const idle = useIdleTimeout({
    enabled: isAuthenticated && !isBlankLayout,
    onTimeout: () => {
      signOut();
      navigate('/login', { replace: true });
    }
  });

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`min-h-screen ${bgClass} text-slate-800 ${isBlankLayout ? '' : 'pb-[calc(136px+env(safe-area-inset-bottom))] lg:pb-0'}`}>
      {!isBlankLayout && (
        <div className="fixed right-3 top-[72px] z-[60] hidden flex-col items-end gap-2 lg:flex">
          <SyncStatusBanner />
          <DraftRecoveryBanner />
        </div>
      )}
      {!isBlankLayout && idle.isWarning && (
        <div className="fixed inset-x-3 top-[72px] z-[70] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 shadow-xl shadow-amber-900/10 md:left-auto md:right-5 md:w-96">
          Sesi akan berakhir demi keamanan data pasien. Sentuh atau tekan tombol apa pun untuk melanjutkan.
        </div>
      )}
      {!isBlankLayout && (
        <>
          <nav className="sticky top-0 z-50 hidden items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 shadow-sm backdrop-blur-md print:hidden lg:flex">
            <Link to="/" className="flex items-center gap-3">
              <img src={LOGO_MALIMPUNG} alt="PKM" className="h-8 w-auto" />
              <span className="text-lg font-black leading-none text-blue-900">TERSANJUNG</span>
            </Link>

            <div className="flex items-center space-x-2 text-sm">
              <Link to="/" className={`rounded-lg px-3 py-2 font-bold ${isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Beranda</Link>
              <NavDesktopItem to="/loket" label="Loket" isActive={isActive('/loket')} isAllowed={hasAccess(roleGroups.staff)} activeColor="bg-amber-500 text-white shadow-sm" />
              {posNavItems.map((item) => (
                <NavDesktopItem key={item.to} to={item.to} label={item.label} isActive={isActive(item.to)} isAllowed={hasAccess(item.roles)} activeColor="bg-slate-800 text-white shadow-sm" />
              ))}
              <NavDesktopItem to="/dashboard" label="Data" isActive={isActive('/dashboard')} isAllowed={hasAccess(roleGroups.dashboard)} activeColor="bg-slate-800 text-white shadow-sm" />
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

          <div className="sticky top-0 z-40 flex min-h-[64px] items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md print:hidden lg:hidden">
            <div className="flex min-w-0 items-center gap-1.5">
              {showMobileBack && (
                <button
                  type="button"
                  onClick={() => safeBack(navigate, '/dashboard')}
                  className="inline-flex min-h-9 shrink-0 items-center rounded-xl border border-slate-200 bg-white px-2.5 text-[11px] font-black text-slate-600 shadow-sm"
                >
                  <span className="text-base leading-none">&lt;</span>
                  <span className="ml-1 hidden min-[390px]:inline">Kembali</span>
                </button>
              )}
              <Link to="/" className="flex min-w-0 items-center gap-1.5">
                <img src={LOGO_MALIMPUNG} alt="PKM" className="h-8 w-auto shrink-0" />
                <span className="truncate text-sm font-black leading-none text-blue-900 min-[390px]:text-base">CKG</span>
              </Link>
            </div>
            <div className="flex min-w-0 shrink-0 items-center gap-1.5">
              {isAuthenticated && <DraftRecoveryBanner compact />}
              {isAuthenticated && isAdmin && (
                <Link to="/admin" className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">Admin</Link>
              )}
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="min-h-9 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-600">Keluar</button>
              ) : (
                <Link to="/login" className="inline-flex min-h-9 items-center rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-black text-white shadow-sm">Masuk</Link>
              )}
            </div>
          </div>
        </>
      )}

      <main className={isBlankLayout ? 'w-full' : 'relative z-10 mx-auto max-w-7xl p-4 pb-[calc(136px+env(safe-area-inset-bottom))] md:p-8 md:pb-8'}>
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm font-bold text-teal-700">Memuat modul...</div>}>
          <Routes>
            <Route path="/" element={<Beranda />} />
            <Route path="/login" element={<Login />} />
            <Route path="/loket" element={<RequireRole allowedRoles={roleGroups.staff}><Loket /></RequireRole>} />
            <Route path="/tv" element={<TvDisplay />} />
            <Route path="/display" element={<TvDisplay />} />
            <Route path="/tentang" element={<Tentang />} />
            <Route path="/rapor" element={<RequireAuth><RaporDigital /></RequireAuth>} />
            <Route path="/rapor/:id" element={<RequireAuth><RaporDigital /></RequireAuth>} />
            <Route path="/pos1" element={<RequireRole allowedRoles={roleGroups.pos1}><Pos1 /></RequireRole>} />
            <Route path="/pos2" element={<RequireRole allowedRoles={roleGroups.pos2}><Pos2 /></RequireRole>} />
            <Route path="/pos3" element={<RequireRole allowedRoles={roleGroups.pos3}><Pos3 /></RequireRole>} />
            <Route path="/pos4" element={<RequireRole allowedRoles={roleGroups.pos4}><Pos4 /></RequireRole>} />
            <Route path="/pos5" element={<RequireRole allowedRoles={roleGroups.pos5}><Pos5 /></RequireRole>} />
            <Route path="/pos6" element={<RequireRole allowedRoles={roleGroups.pos6}><Pos6 /></RequireRole>} />
            <Route path="/pos7" element={<RequireRole allowedRoles={roleGroups.pos7}><Pos7 /></RequireRole>} />
            <Route path="/dashboard" element={<RequireRole allowedRoles={roleGroups.dashboard}><Dashboard /></RequireRole>} />
            <Route path="/recovery" element={<RequireAuth><RecoveryPage /></RequireAuth>} />
            <Route path="/kunjungan-rumah" element={<RequireRole allowedRoles={roleGroups.field}><KunjunganRumah /></RequireRole>} />
            <Route path="/kunjungan" element={<Navigate to="/kunjungan-rumah" replace />} />
            <Route path="/admin" element={<RequireRole allowedRoles={['admin']}><AdminDashboard /></RequireRole>} />
            <Route path="/admin-dashboard" element={<RequireRole allowedRoles={['admin']}><AdminDashboard /></RequireRole>} />
            <Route path="/simpeg" element={<RequireRole allowedRoles={['admin']}><AdminDashboard initialMenu="simpeg" /></RequireRole>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {!isBlankLayout && <InstallAppBanner />}
      {!isBlankLayout && <MobileBottomNav pathname={location.pathname} hasAccess={hasAccess} />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
