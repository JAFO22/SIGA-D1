import axios from 'axios';

const TOKEN_KEY = 'siga_token';
const USUARIO_KEY = 'siga_usuario';

// baseURL: en dev usa el proxy de Vite (/api); en prod, VITE_API_URL.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Adjunta el JWT a cada peticion si hay sesion.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normaliza los errores: el resto de la app siempre recibe un Error con un
// mensaje legible (el que envia el backend en `error`). Ante un 401 fuera del
// login, limpia la sesion y manda a /login.
apiClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !esLogin) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    const mensaje =
      error.response?.data?.error ||
      (error.code === 'ECONNABORTED'
        ? 'La solicitud tardo demasiado'
        : 'No se pudo conectar con el servidor');
    const detalles = error.response?.data?.detalles;
    const err = new Error(mensaje);
    if (detalles) err.detalles = detalles;
    return Promise.reject(err);
  },
);

export { TOKEN_KEY, USUARIO_KEY };
export default apiClient;
