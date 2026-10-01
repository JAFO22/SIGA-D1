import axios from 'axios';

export const TOKEN_KEY = 'siga_token';
export const USUARIO_KEY = 'siga_usuario';
export const EVENTO_SESION_EXPIRADA = 'siga:sesion-expirada';

const MENSAJE_POR_FALLO_DE_RED = {
  ECONNABORTED: 'La solicitud tardo demasiado. Revise su conexion e intente de nuevo.',
  ERR_NETWORK: 'No se pudo conectar con el servidor.',
};

function resolverUrlDeLaApi() {
  const configurada = import.meta.env.VITE_API_URL?.trim();
  if (!configurada) return '/api';

  const conProtocolo = /^https?:\/\//.test(configurada)
    ? configurada
    : `https://${configurada}`;
  const sinBarraFinal = conProtocolo.replace(/\/+$/, '');

  return sinBarraFinal.endsWith('/api') ? sinBarraFinal : `${sinBarraFinal}/api`;
}

const apiClient = axios.create({
  baseURL: resolverUrlDeLaApi(),
  timeout: 15000,
});

export function limpiarSesionGuardada() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function normalizarError(error) {
  const mensaje =
    error.response?.data?.error ||
    MENSAJE_POR_FALLO_DE_RED[error.code] ||
    'Ocurrio un error inesperado.';

  const normalizado = new Error(mensaje);
  normalizado.estado = error.response?.status;
  if (error.response?.data?.detalles) normalizado.detalles = error.response.data.detalles;
  return normalizado;
}

apiClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esIntentoDeLogin = error.config?.url?.includes('/auth/login');
    const sesionRechazada = error.response?.status === 401 && !esIntentoDeLogin;

    if (sesionRechazada) {
      limpiarSesionGuardada();
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }

    return Promise.reject(normalizarError(error));
  },
);

export default apiClient;
