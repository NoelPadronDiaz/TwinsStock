import { Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import ProtectedLayout from './components/ProtectedLayout';
import { AuthProvider } from './auth/AuthContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import RegisterPage from './pages/RegisterPage';
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/products"
            element={
              <AdminRoute>
                <ProductsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
