// src/components/Layout.jsx
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

function Layout() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="main-nav">
        <ul className="nav-links">
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/transactions">All Transactions</Link>
          </li>
          
          {token ? (
            <li className="login">
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