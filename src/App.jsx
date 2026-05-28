import { lazy, Suspense, useEffect, useState } from 'react';
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
import { listDrafts } from './utils/draftStorage';
import './App.css';

// IMPORT ICON DARI LUCIDE REACT
import {
  Activity,
  BarChart2,
  ClipboardList,
  FileCheck,
  Heart,
  Home,
  Menu,
  Route as RouteIcon,
  Scan,
  Shield,
  Stethoscope,
  Ticket,
  Tv,
} from 'lucide-react';

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

const Icon = ({ name, className = 'h-7 w-7' }) => {
  const icons = {
    activity: Activity,
    chart: BarChart2,
    clipboard: ClipboardList,
    'file-check': FileCheck,
    heart: Heart,
    home: Home,
    menu: Menu,
    route: RouteIcon,
    scan: Scan,
    shield: Shield,
    stethoscope: Stethoscope,
    ticket: Ticket,
    workflow: Tv, // untuk Layar Antrean / Tv
  };
  const LucideIcon = icons[name] || Menu;
  return <LucideIcon className={className} />;
};

const CARD_ACCENTS = {
  '/pos1': { rgb: '0,128,255', color: '#0080FF', number: '01' },
  '/pos2': { rgb: '99,102,241', color: '#6366F1', number: '02' },
  '/pos3': { rgb: '244,63,94', color: '#F43F5E', number: '03' },
  '/pos4': { rgb: '168,85,247', color: '#A855F7', number: '04' },
  '/pos5': { rgb: '139,92,246', color: '#8B5CF6', number: '05' },
  '/pos6': { rgb: '6,182,212', color: '#06B6D4', number: '06' },
  '/pos7': { rgb: '16,185,129', color: '#10B981', number: '07' },
  '/kunjungan-rumah': { rgb: '20,184,166', color: '#14B8A6', number: 'KR' },
  '/loket': { rgb: '245,158,11', color: '#F59E0B', number: '00' },
  '/dashboard': { rgb: '0,128,255', color: '#0080FF', number: 'DT' },
  '/admin': { rgb: '15,118,110', color: '#0F766E', number: 'AD' },
  '/tentang': { rgb: '14,165,233', color: '#0EA5E9', number: 'IN' },
  '/tv': { rgb: '37,99,235', color: '#2563EB', number: 'TV' },
};

const getPosAccentClass = (to) => {
  if (to === '/pos1') return 'pos-accent-pos1';
  if (to === '/pos2') return 'pos-accent-pos2';
  if (to === '/pos3') return 'pos-accent-pos3';
  if (to === '/pos4') return 'pos-accent-pos4';
  if (to === '/pos5') return 'pos-accent-pos5';
  if (to === '/pos6') return 'pos-accent-pos6';
  if (to === '/pos7') return 'pos-accent-pos7';
  if (to === '/kunjungan-rumah') return 'pos-accent-kunjungan-rumah';
  return 'pos-accent-pos1';
};

const getModuleAccentClass = (to) => {
  if (to === '/loket') return 'module-accent-loket';
  if (to === '/dashboard') return 'module-accent-dashboard';
  if (to === '/admin') return 'module-accent-admin';
  if (to === '/tentang') return 'module-accent-tentang';
  if (to === '/tv') return 'module-accent-tv';
  return 'module-accent-loket';
};

const CardMenu = ({ to, title, subtitle, icon, isAllowed, target, variant = 'module' }) => {
  if (!isAllowed) {
    return null;
  }
  const accent = CARD_ACCENTS[to] || CARD_ACCENTS['/dashboard'];

  if (variant === 'pos') {
    const accentClass = getPosAccentClass(to);
    return (
      <Link
        to={to}
        target={target}
        className={`pos-card ${accentClass} group`}
      >
        <span className="pos-number">{accent.number}</span>
        <span className="pos-icon">
          <Icon name={icon} className="h-6 w-6" />
        </span>
        <span className="pos-title">{title}</span>
        <span className="pos-subtitle">{subtitle}</span>
      </Link>
    );
  }

  const accentClass = getModuleAccentClass(to);
  return (
    <Link
      to={to}
      target={target}
      className={`module-card ${accentClass} group`}
    >
      <span className="pos-icon">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span className="relative z-10 text-[15px] font-extrabold leading-tight text-[#304050] mt-3">{title}</span>
      <span className="relative z-10 mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A8A9A]">{subtitle}</span>
    </Link>
  );
};

const NavDesktopItem = ({ to, label, isActive, isAllowed }) => {
  if (!isAllowed) {
    return null;
  }
  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      {label}
    </Link>
  );
};

const NavMobileItem = ({ to, icon, label, isActive, isAllowed, onClick, type = 'link' }) => {
  if (!isAllowed) {
    return null;
  }

  if (type === 'button') {
    return (
      <button type="button" onClick={onClick} className={`mobile-nav-item ${isActive ? 'mobile-nav-active' : ''}`}>
        <span className={`mobile-nav-icon ${isActive ? 'nav-active' : ''}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="mobile-nav-label max-w-full truncate text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </button>
    );
  }

  return (
    <Link to={to} className={`mobile-nav-item ${isActive ? 'mobile-nav-active' : ''}`}>
      <span className={`mobile-nav-icon ${isActive ? 'nav-active' : ''}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="mobile-nav-label max-w-full truncate text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
};

function MobileBottomNav({ pathname, hasAccess }) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    setActivePanel(null);
  }, [pathname]);

  const isMobileActive = (item) => {
    if (item.match === 'home') return pathname === '/';
    if (item.match === 'pos') return pathname.startsWith('/pos');
    if (item.match === 'dashboard') return pathname === '/dashboard';
    if (item.match === 'menu') return pathname === '/tentang' || pathname.startsWith('/admin') || pathname === '/kunjungan-rumah' || pathname === '/tv';
    return pathname === item.to;
  };

  const allowedPosItems = posCards.filter((item) => item.to.startsWith('/pos') && hasAccess(item.roles));
  const allowedMenuItems = [
    { to: '/kunjungan-rumah', label: 'Door to Door', subtitle: 'Layanan lapangan', icon: 'route', roles: roleGroups.field },
    { to: '/loket', label: 'Loket Tiket', subtitle: 'Ambil antrean', icon: 'ticket', roles: roleGroups.staff },
    { to: '/dashboard', label: 'Dashboard', subtitle: 'Pantau antrean', icon: 'chart', roles: roleGroups.dashboard },
    { to: '/tv', label: 'Layar Antrean', subtitle: 'Mode display', icon: 'workflow', roles: roleGroups.staff },
    { to: '/admin', label: 'Admin', subtitle: 'Operasional', icon: 'shield', roles: roleGroups.simpeg },
    { to: '/tentang', label: 'Tentang', subtitle: 'Info aplikasi', icon: 'clipboard' },
  ].filter((item) => !item.roles || hasAccess(item.roles));

  const openPanel = (panel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const goTo = (to) => {
    setActivePanel(null);
    navigate(to);
  };

  return (
    <>
      {activePanel && (
        <div className="mobile-nav-backdrop print:hidden md:hidden" onClick={() => setActivePanel(null)} aria-hidden="true" />
      )}

      {activePanel === 'pos' && (
        <section className="mobile-super-panel print:hidden md:hidden" aria-label="Pilih Pos Workflow">
          <div className="mobile-super-panel-header">
            <div>
              <p>Workflow</p>
              <h3>Pilih Pos Pelayanan</h3>
            </div>
            <button type="button" onClick={() => setActivePanel(null)} aria-label="Tutup panel">×</button>
          </div>
          <div className="mobile-super-grid pos-grid">
            {allowedPosItems.map((item) => (
              <button key={item.to} type="button" onClick={() => goTo(item.to)} className={`mobile-super-card ${pathname === item.to ? 'active' : ''}`}>
                <span className="mobile-super-icon"><Icon name={item.icon} className="h-5 w-5" /></span>
                <span className="mobile-super-title">{item.label}</span>
                <span className="mobile-super-subtitle">{item.subtitle}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {activePanel === 'menu' && (
        <section className="mobile-super-panel print:hidden md:hidden" aria-label="Menu Modul">
          <div className="mobile-super-panel-header">
            <div>
              <p>Super App</p>
              <h3>Menu Operasional</h3>
            </div>
            <button type="button" onClick={() => setActivePanel(null)} aria-label="Tutup panel">×</button>
          </div>
          <div className="mobile-super-grid">
            {allowedMenuItems.map((item) => (
              <button key={item.to} type="button" onClick={() => goTo(item.to)} className={`mobile-super-card ${pathname === item.to ? 'active' : ''}`}>
                <span className="mobile-super-icon"><Icon name={item.icon} className="h-5 w-5" /></span>
                <span className="mobile-super-title">{item.label}</span>
                <span className="mobile-super-subtitle">{item.subtitle}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <nav className="mobile-nav mobile-super-nav print:hidden md:hidden" aria-label="Navigasi utama">
        {mobileNavItems.map((item) => {
          const isPanelItem = item.match === 'pos' || item.match === 'menu';
          const panelKey = item.match === 'pos' ? 'pos' : item.match === 'menu' ? 'menu' : null;
          return (
            <NavMobileItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              type={isPanelItem ? 'button' : 'link'}
              onClick={isPanelItem ? () => openPanel(panelKey) : undefined}
              isActive={(panelKey && activePanel === panelKey) || isMobileActive(item)}
              isAllowed={!item.roles || hasAccess(item.roles)}
            />
          );
        })}
      </nav>
    </>
  );
}

function Beranda() {
  const { isAuthenticated, hasAnyRole } = useAuth();
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [draftCount, setDraftCount] = useState(0);
  const isAdmin = hasAnyRole(['admin']);
  const allowedPosCards = posCards.filter((item) => hasAnyRole(item.roles));
  const workflowCount = allowedPosCards.filter((item) => item.to.startsWith('/pos')).length;
  const moduleCards = [
    { to: '/loket', title: 'Loket Tiket', subtitle: 'Antrean', icon: 'ticket', isAllowed: hasAnyRole(roleGroups.staff) },
    { to: '/dashboard', title: 'Dashboard', subtitle: 'Analitik Data', icon: 'chart', isAllowed: hasAnyRole(roleGroups.dashboard) },
    { to: '/admin', title: 'Admin', subtitle: 'Admin Dashboard', icon: 'shield', isAllowed: isAdmin },
    { to: '/tentang', title: 'Tentang', subtitle: 'Info Aplikasi', icon: 'clipboard', isAllowed: true },
    { to: '/tv', target: '_blank', title: 'Layar Antrean', subtitle: 'Mode Display', icon: 'workflow', isAllowed: hasAnyRole(roleGroups.staff) },
  ].filter((item) => item.isAllowed);

  useEffect(() => {
    const updateOnline = () => setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    const updateDrafts = () => setDraftCount(listDrafts().length);

    updateOnline();
    updateDrafts();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    window.addEventListener('storage', updateDrafts);
    const interval = window.setInterval(updateDrafts, 5000);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('storage', updateDrafts);
      window.clearInterval(interval);
    };
  }, []);

  const statusItems = [
    { label: 'Jaringan', value: isOnline ? 'Online' : 'Offline', accentClass: 'status-accent-online' },
    { label: 'Sinkronisasi', value: isOnline ? 'Sinkron' : 'Menunggu', accentClass: 'status-accent-sinkron' },
    { label: 'Draft Lokal', value: `${draftCount} Draft`, accentClass: 'status-accent-draft' },
    { label: 'Workflow', value: `${workflowCount} Pos Aktif`, accentClass: 'status-accent-workflow' },
  ];

  return (
    <div className="home-dashboard relative z-10 mx-auto flex w-full flex-col px-0 py-4 md:py-6">
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }`}</style>

      {/* 10. Hero Section */}
      <section className="hero-section animate-fade-in-up">
        {/* 11. Hero Layout Grid */}
        <div className="hero-grid">
          {/* LEFT: Logo + Identity */}
          <div className="hero-identity-panel flex flex-col items-center justify-center gap-4 p-6">
            <div className="flex items-center gap-4">
              <img src={LOGO_PINRANG} alt="Logo Pinrang" className="h-16 w-auto object-contain" />
              <div className="w-px h-10 bg-slate-200" />
              <img src={LOGO_MALIMPUNG} alt="Logo Malimpung" className="h-16 w-auto object-contain" />
            </div>
            <div className="text-center font-bold text-xs uppercase tracking-widest text-[#7A8A9A]">
              Puskesmas Malimpung
            </div>
          </div>
          {/* RIGHT: Title + Summary */}
          <div className="min-w-0">
            <p className="hero-eyebrow">Healthcare Workflow Hub</p>
            <h1 className="hero-title">TERSANJUNG</h1>
            <p className="hero-subtitle">
              Sistem Informasi Layanan Kesehatan Berbasis Jaringan Terpadu Puskesmas Malimpung
            </p>
          </div>
        </div>

        {/* 13. Operational Status Grid */}
        <div className="status-grid" aria-label="Status operasional">
          {statusItems.map((item) => (
            <div key={item.label} className={`status-card ${item.accentClass}`}>
              <span className="status-label">{item.label}</span>
              <span className="status-value">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="animate-fade-in-up home-section-stack flex w-full flex-col gap-5 mt-5" style={{ animationDelay: '0.12s' }}>
        {/* 14. Workflow Utama Section */}
        {allowedPosCards.length > 0 && (
          <section className="section-wrapper">
            <div className="section-heading mb-4 flex justify-between items-end">
              <div>
                <p className="section-eyebrow">Workflow Utama</p>
                <h2 className="section-title">Alur Skrining Pasien</h2>
              </div>
              <span className="section-hint text-xs font-semibold text-slate-400 hidden md:block">Pilih pos sesuai tahapan layanan</span>
            </div>
            {/* 15. Pos Grid */}
            <div className="pos-grid">
              {allowedPosCards.map((item) => (
                <CardMenu
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  isAllowed
                  variant="pos"
                />
              ))}
            </div>
          </section>
        )}

        {/* 17. Module Section */}
        <section className="section-wrapper module-section">
          <div className="section-heading mb-4">
            <div>
              <p className="section-eyebrow">Modul Layanan</p>
              <h2 className="section-title">Akses Pendukung Operasional</h2>
            </div>
          </div>
          {/* 18. Module Grid */}
          <div className="module-grid">
            {moduleCards.map((item) => (
              <CardMenu key={item.to} {...item} isAllowed />
            ))}
          </div>
        </section>

        {!isAuthenticated && (
          <Link
            to="/login"
            className="mx-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0080FF] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/10 hover:bg-blue-600 mt-4 transition-all active:scale-95"
          >
            Masuk untuk mulai pelayanan
          </Link>
        )}
      </div>
    </div>
  );
}

function Tentang() {
  const featureGroups = [
    ['Workflow Pos', 'Loket sampai Pos 7 dengan antrean, pemeriksaan, validasi dokter, dan rapor digital.'],
    ['Smart Form', 'Form dinamis mengikuti umur, jenis kelamin, klaster, dan kebutuhan pemeriksaan tanpa mengubah FormSchemas.'],
    ['Super App Mobile', 'Bottom nav Home, Loket, Antrean, Pos, dan Menu untuk akses cepat satu tangan.'],
    ['Analitik Wilayah', 'Demografi, PTM, capaian dusun, ekspor laporan, dan insight operasional untuk Puskesmas.'],
  ];

  const standards = [
    'Healthcare Workflow App',
    'Mobile-first',
    'Inter + Poppins',
    'Soft healthcare UI',
    'Sticky action aman',
    'Queue reusable',
  ];

  return (
    <div className="about-page mx-auto w-full max-w-5xl px-4 py-6 md:py-10">
      <section className="about-hero">
        <div>
          <p className="about-eyebrow">Aplikasi Cek Kesehatan Gratis</p>
          <h1>TERSANJUNG CKG Malimpung</h1>
          <p>
            Healthcare workflow super app untuk antrean, registrasi, pemeriksaan per Pos, kunjungan rumah, rapor digital,
            dashboard analitik, dan laporan operasional UPT Puskesmas Malimpung.
          </p>
        </div>
        <div className="about-version-card">
          <span>Versi</span>
          <strong>{APP_VERSION}</strong>
          <small>Build {BUILD_DATE}</small>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-head">
          <p>Prinsip Produk</p>
          <h2>Dirancang untuk kerja petugas yang cepat, jelas, dan tidak melelahkan.</h2>
        </div>
        <div className="about-chip-grid">
          {standards.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="about-grid">
        {featureGroups.map(([title, description]) => (
          <article key={title} className="about-card">
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="about-section about-docs">
        <div>
          <p className="about-eyebrow">Dokumentasi Aktif</p>
          <h2>Riwayat implementasi dan standar UI/UX sudah disimpan untuk pengembangan berikutnya.</h2>
        </div>
        <div className="about-actions">
          <a href="/Laporan_Tersanjung_Final.html">Buka Laporan Final</a>
          <a href="/Laporan_Tersanjung_Final.html#smart-ui-ux-standard">SMART UI/UX</a>
        </div>
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

  const bgClass = isBlankLayout ? 'bg-slate-100' : 'app-workspace-bg';
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
        <div className="fixed inset-x-3 top-[72px] z-[70] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm font-bold text-amber-800 shadow-xl shadow-amber-900/10 md:left-auto md:right-5 md:w-96">
          Sesi akan berakhir demi keamanan data pasien. Sentuh atau tekan tombol apa pun untuk melanjutkan.
        </div>
      )}
      {!isBlankLayout && (
        <>
          {/* Header Desktop */}
          <nav className="app-desktop-nav sticky top-0 z-50 hidden items-center justify-between px-6 print:hidden md:flex">
            <Link to="/" className="header-brand">
              <img src={LOGO_MALIMPUNG} alt="PKM" />
              <span className="brand-title">TERSANJUNG</span>
            </Link>

            <div className="flex items-center gap-1 text-sm">
              <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>Beranda</Link>
              <NavDesktopItem to="/loket" label="Loket" isActive={isActive('/loket')} isAllowed={hasAccess(roleGroups.staff)} />
              {posNavItems.map((item) => (
                <NavDesktopItem key={item.to} to={item.to} label={item.label} isActive={isActive(item.to)} isAllowed={hasAccess(item.roles)} />
              ))}
              <NavDesktopItem to="/dashboard" label="Data" isActive={isActive('/dashboard')} isAllowed={hasAccess(roleGroups.dashboard)} />
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && isAdmin && (
                <Link to="/admin" className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  Admin
                </Link>
              )}
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-100 transition shadow-sm">
                  Keluar
                </button>
              ) : (
                <Link to="/login" className="rounded-xl bg-[#0080FF] px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-blue-600 transition">
                  Masuk
                </Link>
              )}
            </div>
          </nav>

          {/* Header Mobile */}
          <header className="mobile-header print:hidden md:hidden">
            <div className="flex min-w-0 items-center gap-3">
              {showMobileBack && (
                <button
                  type="button"
                  onClick={() => safeBack(navigate, '/dashboard')}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm mr-1"
                  aria-label="Kembali"
                >
                  <span className="text-lg leading-none">&lt;</span>
                </button>
              )}
              <Link to="/" className="flex items-center gap-2.5 min-w-0">
                <img src={LOGO_MALIMPUNG} alt="PKM" className="mobile-logo shrink-0" />
                <div className="mobile-title-container min-w-0">
                  <span className="mobile-title truncate">TERSANJUNG</span>
                  <span className="mobile-subtitle truncate">Puskesmas Malimpung</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="online-badge">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>Online</span>
              </div>
              {!isAuthenticated && (
                <Link to="/login" className="inline-flex min-h-[28px] items-center rounded-full bg-blue-600 px-3 text-[10px] font-bold text-white shadow-sm">Masuk</Link>
              )}
            </div>
          </header>
        </>
      )}

      <main className={isBlankLayout ? 'w-full' : 'relative z-10 mx-auto max-w-[1320px] p-4 pb-[calc(136px+env(safe-area-inset-bottom))] md:p-6 md:pb-8'}>
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
