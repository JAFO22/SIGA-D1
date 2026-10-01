import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ROLES } from './lib/constantes.js';
import { ToastProvider } from './components/ui/Toast.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AlertasPage from './pages/AlertasPage.jsx';
import MovimientosPage from './pages/MovimientosPage.jsx';
import CatalogoPage from './pages/CatalogoPage.jsx';
import ConfiabilidadPage from './pages/ConfiabilidadPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';

export default function App() {
  const { usuario } = useAuth();

  const inicio = usuario?.rol === ROLES.ADMINISTRADOR ? '/dashboard' : '/alertas';

  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/login"
          element={usuario ? <Navigate to={inicio} replace /> : <LoginPage />}
        />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={inicio} replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="alertas" element={<AlertasPage />} />
          <Route path="movimientos" element={<MovimientosPage />} />
          <Route
            path="catalogo"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <CatalogoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="confiabilidad"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <ConfiabilidadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <ProtectedRoute roles={[ROLES.ADMINISTRADOR]}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to={inicio} replace />} />
      </Routes>
    </ToastProvider>
  );
}
