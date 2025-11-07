import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  const isAdmin = user && user.roles.includes('admin');
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) {
    return <Outlet />;
  }

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          BudgetApp
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink to="/" end>
                <i className="fas fa-tachometer-alt"></i> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/transactions">
                <i className="fas fa-exchange-alt"></i> All Transactions
              </NavLink>
            </li>
          </ul>

          {isAdmin && (
            <div className="sidebar-admin-menu">
              <h4><i className="fas fa-shield-alt"></i> Admin</h4>
              <ul>
                <li>
                  <NavLink to="/admin/transactions">
                    <i className="fas fa-list-ul"></i> All Transactions
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/users">
                    <i className="fas fa-users"></i> User Management
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </nav>

        <footer className="sidebar-footer">
          <div className="currency-selector-container">
            <label htmlFor="layout-currency">Currency</label>
            <select
              id="layout-currency"
              value={user?.currency || 'USD'}
              onChange={handleCurrencyChange}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          
          <button onClick={handleLogout} className="sidebar-logout-button">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </footer>
      </aside>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;