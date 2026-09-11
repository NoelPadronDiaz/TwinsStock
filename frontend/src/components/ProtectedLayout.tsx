import { useState } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <img src="/logo-twins.png" alt="Twins" className="brand-logo" />
          <button
            className="nav-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        <nav className={menuOpen ? 'nav-open' : ''} onClick={() => setMenuOpen(false)}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Registrar consumo
          </NavLink>
          <NavLink to="/stock" className={({ isActive }) => (isActive ? 'active' : '')}>
            Control de stock
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            Panel de control
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>
            Historial
          </NavLink>
          {user.role === 'admin' && (
            <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
              Productos
            </NavLink>
          )}
          {user.role === 'admin' && (
            <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
              Usuarios
            </NavLink>
          )}
          <span className="nav-user">{user.name}</span>
          <button className="nav-logout" onClick={logout}>
            Salir
          </button>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
