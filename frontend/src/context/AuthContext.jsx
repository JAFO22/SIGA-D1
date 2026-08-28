import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authService from '../services/auth.service.js';
import { TOKEN_KEY, USUARIO_KEY } from '../services/apiClient.js';

const AuthContext = createContext(null);

function leerUsuarioGuardado() {
  try {
    const bruto = localStorage.getItem(USUARIO_KEY);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // La sesion se rehidrata desde localStorage al cargar la app.
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);

  const iniciarSesion = useCallback(async (nombre, password) => {
    const { token, usuario: datos } = await authService.login(nombre, password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(datos));
    setUsuario(datos);
    return datos;
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      iniciarSesion,
      cerrarSesion,
      esAdministrador: usuario?.rol === 'ADMINISTRADOR',
    }),
    [usuario, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
