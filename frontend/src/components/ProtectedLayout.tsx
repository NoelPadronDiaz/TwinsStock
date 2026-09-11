import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedLayout() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <img src="/logo-twins.png" alt="Twins" className="brand-logo" />
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Registrar consumo
          </NavLink>
          <NavLink to="/stock" className={({ isActive }) => (isActive ? 'active' : '')}>
            Control de stock
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            Panel de control
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
