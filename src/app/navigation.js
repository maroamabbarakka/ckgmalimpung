import { MODULE_ACCESS } from '../features/auth/roles';

export const POS_CARDS = [
  { to: '/pos1', label: 'Pos 1', subtitle: 'Registrasi', icon: 'clipboard', roles: MODULE_ACCESS.pos1, bg: 'hover:bg-blue-600', iconBg: 'bg-blue-100 group-hover:bg-blue-500' },
  { to: '/pos2', label: 'Pos 2', subtitle: 'TTV & Lab', icon: 'activity', roles: MODULE_ACCESS.pos2, bg: 'hover:bg-indigo-500', iconBg: 'bg-indigo-100 group-hover:bg-indigo-400' },
  { to: '/pos3', label: 'Pos 3', subtitle: 'Fisik', icon: 'scan', roles: MODULE_ACCESS.pos3, bg: 'hover:bg-rose-500', iconBg: 'bg-rose-100 group-hover:bg-rose-400' },
  { to: '/pos4', label: 'Pos 4', subtitle: 'PTM', icon: 'heart', roles: MODULE_ACCESS.pos4, bg: 'hover:bg-purple-500', iconBg: 'bg-purple-100 group-hover:bg-purple-400' },
  { to: '/pos5', label: 'Pos 5', subtitle: 'Khusus', icon: 'shield', roles: MODULE_ACCESS.pos5, bg: 'hover:bg-fuchsia-500', iconBg: 'bg-fuchsia-100 group-hover:bg-fuchsia-400' },
  { to: '/pos6', label: 'Pos 6', subtitle: 'Diagnosis', icon: 'stethoscope', roles: MODULE_ACCESS.pos6, bg: 'hover:bg-cyan-500', iconBg: 'bg-cyan-100 group-hover:bg-cyan-400' },
  { to: '/pos7', label: 'Pos 7', subtitle: 'Rapor', icon: 'file-check', roles: MODULE_ACCESS.pos7, bg: 'hover:bg-emerald-500', iconBg: 'bg-emerald-100 group-hover:bg-emerald-400' },
  { to: '/kunjungan-rumah', label: 'Door to Door', subtitle: 'Layanan Lapangan', icon: 'route', roles: MODULE_ACCESS.field, bg: 'hover:bg-emerald-600', iconBg: 'bg-emerald-100 group-hover:bg-emerald-400' },
];

export const POS_NAV_ITEMS = POS_CARDS.filter((item) => item.to.startsWith('/pos'));

export const MAIN_MODULES = [
  { to: '/loket', label: 'Loket', roles: MODULE_ACCESS.staff },
  { to: '/dashboard', label: 'Dashboard', roles: MODULE_ACCESS.dashboard },
  { to: '/kunjungan-rumah', label: 'Door to Door', roles: MODULE_ACCESS.field },
  { to: '/admin', label: 'Admin', roles: MODULE_ACCESS.simpeg },
];

export const MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home', match: 'home' },
  { to: '/loket', label: 'Loket', icon: 'ticket', roles: MODULE_ACCESS.staff },
  { to: '/dashboard', label: 'Antrean', icon: 'chart', roles: MODULE_ACCESS.dashboard, match: 'dashboard' },
  { to: '/pos1', label: 'Pos', icon: 'workflow', roles: MODULE_ACCESS.staff, match: 'pos' },
  { to: '/tentang', label: 'Menu', icon: 'menu', match: 'menu' },
];
