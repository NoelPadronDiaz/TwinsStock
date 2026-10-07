import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../api/client';
import {
  BoxIcon,
  CalendarCheckIcon,
  CalendarIcon,
  CartIcon,
  ChartIcon,
  ClockIcon,
  GridIcon,
  MoonIcon,
  MoreIcon,
  PowerIcon,
  SunIcon,
  TagIcon,
  UsersIcon,
} from './icons';

const ALL_ROLES: UserRole[] = ['admin', 'employee'];

interface NavItem {
  to: string;
  end?: boolean;
  label: string;
  icon: () => JSX.Element;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', end: true, label: 'Registrar consumo', icon: BoxIcon, roles: ALL_ROLES },
  { to: '/stock', label: 'Control de stock', icon: GridIcon, roles: ALL_ROLES },
  { to: '/cesta', label: 'Cesta de la compra', icon: CartIcon, roles: ALL_ROLES },
  { to: '/dashboard', label: 'Panel de control', icon: ChartIcon, roles: ['admin', 'employee'] },
  { to: '/history', label: 'Historial', icon: ClockIcon, roles: ALL_ROLES },
  { to: '/my-schedule', label: 'Mi horario', icon: CalendarCheckIcon, roles: ['admin', 'employee'] },
  { to: '/products', label: 'Productos', icon: TagIcon, roles: ['admin'] },
  { to: '/schedules', label: 'Horarios', icon: CalendarIcon, roles: ['admin'] },
  { to: '/users', label: 'Usuarios', icon: UsersIcon, roles: ['admin'] },
];

function ThemeSwitch({ theme, onChange }: { theme: 'light' | 'dark'; onChange: (t: 'light' | 'dark') => void }) {
  return (
    <div className="theme-switch" role="group" aria-label="Tema">
      <button
        type="button"
        className={theme === 'light' ? 'theme-switch-button active' : 'theme-switch-button'}
        onClick={() => onChange('light')}
        aria-pressed={theme === 'light'}
        aria-label="Tema claro"
        title="Tema claro"
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className={theme === 'dark' ? 'theme-switch-button active' : 'theme-switch-button'}
        onClick={() => onChange('dark')}
        aria-pressed={theme === 'dark'}
        aria-label="Tema oscuro"
        title="Tema oscuro"
      >
        <MoonIcon />
      </button>
    </div>
  );
}

export default function ProtectedLayout() {
  const { user, logout, setTheme } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheetOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sheetOpen]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const primaryItems = items.slice(0, 3);
  const overflowItems = items.slice(3);

  return (
    <div className="layout">
      <aside className="sidebar">
        <img src="/logo-twins.png" alt="Twins" className="sidebar-logo" />

        <div className="sidebar-user-row">
          <span className="sidebar-user-name">{user.name}</span>
          <ThemeSwitch theme={user.theme} onChange={setTheme} />
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a className="sidebar-legal-link" href="#" onClick={(e) => e.preventDefault()}>
            Aviso legal
          </a>
          <button className="sidebar-logout-button" onClick={logout}>
            <PowerIcon />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="layout-main">
        <header className="mobile-topbar">
          <img src="/logo-twins.png" alt="Twins" className="brand-logo" />
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'bottom-nav-item active' : 'bottom-nav-item')}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="true"
          aria-expanded={sheetOpen}
        >
          <MoreIcon />
          <span>Más</span>
        </button>
      </nav>

      {sheetOpen && (
        <div className="sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <span className="sidebar-user-name">{user.name}</span>
            {overflowItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <ThemeSwitch theme={user.theme} onChange={setTheme} />
            <div className="sidebar-footer">
              <a className="sidebar-legal-link" href="#" onClick={(e) => e.preventDefault()}>
                Aviso legal
              </a>
              <button className="sidebar-logout-button" onClick={logout}>
                <PowerIcon />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
