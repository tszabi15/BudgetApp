// src/components/Layout.jsx
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import './Layout.css';

const CURRENCIES = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'HUF', label: 'HUF (Ft)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'JPY', label: 'JPY (¥)' },
];

function Layout() {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    try {
      const response = await apiClient.put('/profile/settings', {
        currency: newCurrency,
      });
      
      updateUser(response.data.user);

    } catch (err) {
      console.error("Failed to update currency", err);
      alert("Error: Could not update currency.");
    }
  };

  return (
    <div>
      <nav className="main-nav">
        <ul className="nav-links">
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/transactions">Transactions</Link>
          </li>
          <li className="currency-dropdown">
                <select 
                  className="currency-dropdown"
                  value={user?.currency || 'USD'}
                  onChange={handleCurrencyChange}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </li>
          {token ? (
            <li className="logout-button">
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button></li>
          ) : (
            <>
              <li className="login">
                <Link to="/login">Login</Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
      
    </div>
  );
}

export default Layout;