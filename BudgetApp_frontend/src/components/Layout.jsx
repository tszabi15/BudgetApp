import { Outlet, Link } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <nav style={{ padding: '1rem', background: '#f4f4f4' }}>
        <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem' }}>
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/login">Bejelentkezés</Link>
          </li>
          <li>
            <Link to="/register">Regisztráció</Link>
          </li>
        </ul>
      </nav>

      <hr />

      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>

    </div>
  );
}
export default Layout;