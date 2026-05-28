# 18 — Route Guard dan Permission Matrix

## Target
Semua menu dan route punya aturan akses jelas.

## Permission matrix awal
| Area | Permission | Role yang boleh |
|---|---|---|
| Dashboard | VIEW_DASHBOARD | superadmin, admin, koordinator |
| Staff | MANAGE_STAFF | superadmin |
| Registrasi | CREATE_PATIENT | superadmin, admin, loket |
| Edit pasien | UPDATE_PATIENT | superadmin, admin, loket |
| Pos 1 | OPEN_POS_1 | superadmin, admin, pos1, loket |
| Pos 2 | OPEN_POS_2 | superadmin, admin, pos2 |
| Pos 3 | OPEN_POS_3 | superadmin, admin, pos3 |
| Pos 4 | OPEN_POS_4 | superadmin, admin, pos4 |
| Pos 5 | OPEN_POS_5 | superadmin, admin, pos5 |
| Pos 6 | OPEN_POS_6 | superadmin, admin, pos6 |
| Pos 7 | OPEN_POS_7 | superadmin, admin, pos7 |
| Finalisasi | FINALIZE_VISIT | superadmin, admin, dokter/validator |
| Rapor | VIEW_RAPOR | superadmin, admin, validator, loket |
| Export | EXPORT_REPORT | superadmin, admin |
| TV Display | MANAGE_TV_QUEUE | superadmin, admin, loket |
| Settings | MANAGE_SETTINGS | superadmin |

## Implementasi route guard

### File route config
Buat:
```txt
src/routes/routeConfig.js
```

Contoh:
```js
export const routeConfig = [
  { path: '/dashboard', element: 'Dashboard', permission: 'VIEW_DASHBOARD' },
  { path: '/pos1', element: 'Pos1', permission: 'OPEN_POS_1' },
  { path: '/pos2', element: 'Pos2', permission: 'OPEN_POS_2' },
  { path: '/rapor/:visitId', element: 'Rapor', permission: 'VIEW_RAPOR' },
];
```

### Sidebar/menu
Menu harus dibangun dari permission, bukan hardcode role.

```js
const visibleMenus = menus.filter(menu => hasPermission(menu.permission));
```

## Hal yang tidak boleh
- Jangan cek `role === 'admin'` di 20 tempat berbeda.
- Jangan sembunyikan menu saja tanpa melindungi route.
- Jangan jadikan frontend route guard sebagai keamanan final.

## Acceptance criteria
- User tanpa permission tidak melihat menu.
- User tanpa permission tidak bisa akses route via URL langsung.
- Firestore Rules tetap menolak akses data jika user memaksa request.
