import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import TransactionsPage from './pages/Transactions';
import AdminRoute from './components/auth/AdminRoute';
import AdminPage from './pages/AdminPage';
import UserManagementPage from './pages/UserManagement';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin/transactions" element={<AdminPage />} />
          <Route path="admin/users" element={<UserManagementPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;