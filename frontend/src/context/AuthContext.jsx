import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth.service.js';
import {
  TOKEN_KEY,
  USUARIO_KEY,
  EVENTO_SESION_EXPIRADA,
  limpiarSesionGuardada,
} from '../services/apiClient.js';
import { ROLES } from '../lib/constantes.js';

const AuthContext = createContext(null);

function leerCaducidadDelToken(token) {
  try {
    const [, cargaUtil] = token.split('.');
    const json = atob(cargaUtil.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json);
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function recuperarSesionVigente() {
  const token = localStorage.getItem(TOKEN_KEY);
  const usuarioGuardado = localStorage.getItem(USUARIO_KEY);
  if (!token || !usuarioGuardado) return null;

  const caducaEn = leerCaducidadDelToken(token);
  if (caducaEn === null || caducaEn <= Date.now()) {
    limpiarSesionGuardada();
    return null;
  }

  try {
    return JSON.parse(usuarioGuardado);
  } catch {
    limpiarSesionGuardada();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(recuperarSesionVigente);

  useEffect(() => {
    const alExpirarLaSesion = () => setUsuario(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirarLaSesion);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirarLaSesion);
  }, []);

  const iniciarSesion = useCallback(async (nombre, password) => {
    const { token, usuario: datos } = await authService.login(nombre, password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(datos));
    setUsuario(datos);
    return datos;
  }, []);

  const cerrarSesion = useCallback(() => {
    limpiarSesionGuardada();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      iniciarSesion,
      cerrarSesion,
      esAdministrador: usuario?.rol === ROLES.ADMINISTRADOR,
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
