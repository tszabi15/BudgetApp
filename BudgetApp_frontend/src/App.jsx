import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
          
          {/*Protected routes*/}
        </Route>

        {/* 404 page
          <Route path="*" element={<NotFoundPage />} /> 
        */}
      </Route>
    </Routes>
  );
}

export default App;