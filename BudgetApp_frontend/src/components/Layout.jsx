// src/components/Layout.jsx
import { Outlet, Link, useNavigate } from 'react-router-dom';
import './Layout.css';

function Layout() {
  const navigate = useNavigate(); 
  
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    window.location.href = '/login';
  };

  return (
    <div>
      <nav className="main-nav">
        <ul className="nav-links">
          <li>
            <Link to="/">Dashboard</Link>
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