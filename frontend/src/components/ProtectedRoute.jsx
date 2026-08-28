import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Envuelve rutas privadas. Si no hay sesion -> /login.
 * Si `roles` se especifica y el usuario no lo cumple -> lo manda a su inicio.
 */
export default function ProtectedRoute({ children, roles }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" state={{ desde: location.pathname }} replace />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
