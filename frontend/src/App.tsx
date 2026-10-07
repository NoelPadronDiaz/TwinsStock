import { Route, Routes } from 'react-router-dom';
import RoleRoute from './components/RoleRoute';
import ProtectedLayout from './components/ProtectedLayout';
import { AuthProvider } from './auth/AuthContext';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import MySchedulePage from './pages/MySchedulePage';
import ProductsPage from './pages/ProductsPage';
import RegisterPage from './pages/RegisterPage';
import SchedulesPage from './pages/SchedulesPage';
import ShoppingListPage from './pages/ShoppingListPage';
import StockPage from './pages/StockPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/cesta" element={<ShoppingListPage />} />
          <Route
            path="/dashboard"
            element={
              <RoleRoute roles={['admin', 'employee']}>
                <DashboardPage />
              </RoleRoute>
            }
          />
          <Route path="/history" element={<HistoryPage />} />
          <Route
            path="/my-schedule"
            element={
              <RoleRoute roles={['admin', 'employee']}>
                <MySchedulePage />
              </RoleRoute>
            }
          />
          <Route
            path="/schedules"
            element={
              <RoleRoute roles={['admin']}>
                <SchedulesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/products"
            element={
              <RoleRoute roles={['admin']}>
                <ProductsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/users"
            element={
              <RoleRoute roles={['admin']}>
                <UsersPage />
              </RoleRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
