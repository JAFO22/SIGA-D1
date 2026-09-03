# SIGA-D1 · Frontend

SPA en **React + Vite** con **Tailwind CSS**, **Recharts** para las gráficas y
**Framer Motion** para las micro-interacciones (modales, toasts, control
segmentado). Las animaciones de entrada son CSS puro, así que el contenido
siempre queda visible aunque el hilo de animación se pause.

## Instalación y ejecución

```bash
npm install
npm run dev        # http://localhost:5173
```

> El backend debe estar corriendo en `http://localhost:4000`.
> Vite hace *proxy* de `/api` hacia ese puerto (ver `vite.config.js`), así que
> en desarrollo no hace falta configurar nada.

Para apuntar a un backend remoto: crear `.env` con
`VITE_API_URL=https://mi-backend/api`.

## Estructura

```
src/
├── pages/            Una página por pantalla (Login, Dashboard, Alertas,
│                     Movimientos, Catalogo, Confiabilidad)
├── components/       UI reutilizable: Layout, Sidebar, DataTable, Modal,
│                     Field, SemaforoChip, StatCard, EstadoCarga, ...
│   └── catalogo/     Modales de formulario de producto y proveedor
├── services/         Cliente axios + un módulo por recurso de la API
├── context/          AuthContext (sesión + rol, persistida en localStorage)
├── hooks/            useFetch (data / cargando / error / recargar)
└── lib/              constantes y utilidades de formato (es-CO)
```

## Scripts

| Script            | Acción                            |
|-------------------|-----------------------------------|
| `npm run dev`     | Servidor de desarrollo            |
| `npm run build`   | Build de producción en `dist/`    |
| `npm run preview` | Sirve el build para revisarlo     |

## Notas de diseño

- **Rutas protegidas** por `<ProtectedRoute>`: sin sesión → `/login`; sin el rol
  requerido → se redirige al inicio del usuario. El menú también se filtra por
  rol, pero la autorización real vive en el backend.
- El interceptor de axios adjunta el JWT y, ante un `401`, limpia la sesión y
  vuelve al login.
- Componentes pequeños y reutilizables; nada de lógica de negocio en el cliente
  (el semáforo y el % de cumplimiento llegan calculados desde la API).
