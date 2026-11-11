import { Route, Routes } from 'react-router-dom';
import RoleRoute from './components/RoleRoute';
import ProtectedLayout from './components/ProtectedLayout';
import { AuthProvider } from './auth/AuthContext';
import ClockPage from './pages/ClockPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import KioskPage from './pages/KioskPage';
import LoginPage from './pages/LoginPage';
import MySchedulePage from './pages/MySchedulePage';
import ProductsPage from './pages/ProductsPage';
import RegisterPage from './pages/RegisterPage';
import SchedulesPage from './pages/SchedulesPage';
import ShoppingListPage from './pages/ShoppingListPage';
import StockPage from './pages/StockPage';
import TimeEntriesPage from './pages/TimeEntriesPage';
import TimeSheetPrintPage from './pages/TimeSheetPrintPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/kiosk"
          element={
            <RoleRoute roles={['admin', 'kiosk']}>
              <KioskPage />
            </RoleRoute>
          }
        />
        <Route
          path="/clock"
          element={
            <RoleRoute roles={['admin', 'employee', 'kiosk']}>
              <ClockPage />
            </RoleRoute>
          }
        />
        <Route
          path="/fichajes/imprimir"
          element={
            <RoleRoute roles={['admin', 'employee']}>
              <TimeSheetPrintPage />
            </RoleRoute>
          }
        />
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
            path="/fichajes"
            element={
              <RoleRoute roles={['admin', 'employee']}>
                <TimeEntriesPage />
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
              <RoleRoute roles={['admin', 'kiosk']}>
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
