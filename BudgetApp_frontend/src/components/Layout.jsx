// src/components/Layout.jsx
import { Outlet, Link } from 'react-router-dom';
import './Layout.css';

function Layout() {
  return (
    <div>
      <nav className="main-nav">
        <ul className="nav-links">
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          
          <li className="login">
            <Link to="/login">Login</Link>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
      
    </div>
  );
}

export default Layout;