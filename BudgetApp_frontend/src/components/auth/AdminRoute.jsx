import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminRoute() {
    const { user } = useAuth();

    if (user && user.roles.includes('admin')) {
        return <Outlet />;
    }
  
    return <Navigate to="/" replace />;
}

export default AdminRoute;