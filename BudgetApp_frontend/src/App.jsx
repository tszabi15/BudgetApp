// src/App.jsx
import { Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        
        <Route index element={<DashboardPage />} />
        
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

      </Route>
    </Routes>
  );
}

export default App;