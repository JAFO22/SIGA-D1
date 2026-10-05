# SIGA-D1

Sistema de inventario y gestión de abastecimiento para la tienda D1.

A partir de una sola fuente de datos —los movimientos de entrada y salida que registra el
personal— el sistema deriva dos análisis en paralelo:

| Análisis | Pregunta que responde | Fórmula |
|---|---|---|
| Riesgo de quiebre | ¿Cuántos días de inventario quedan? | `cobertura = stock ÷ ritmo de venta` |
| Confiabilidad del proveedor | ¿Entrega lo que se le pide? | `% = (Σ mín(entregado, pedido) ÷ Σ pedido) × 100` |

El inventario evoluciona según el modelo de acumulación y flujos:

```
I(t+1) = máx(0, I(t) + R(t) − V(t))
```

donde `I` es el inventario, `R` la reposición y `V` las ventas.

El ritmo de venta son las unidades de las últimas `VENTAS_MUESTRA` salidas divididas entre
los días calendario transcurridos desde la más antigua de ellas hasta hoy, en la hora de
Colombia. Un producto que deja de venderse deja de aparecer en riesgo.

En la confiabilidad, lo entregado de más en un pedido no compensa lo que faltó en otro:
entregar 150 de 100 y luego 50 de 100 es un 75 %, no un 100 %.

---

## Arquitectura

```
backend/        API REST — Node.js + Express + Prisma + PostgreSQL
frontend/       SPA — React + Vite + Tailwind CSS
render.yaml     Blueprint de despliegue
```

El backend separa responsabilidades en capas con dependencia unidireccional:

| Capa | Responsabilidad |
|---|---|
| `routes/` | Declaran endpoints y encadenan middlewares |
| `controllers/` | Adaptan HTTP ↔ servicios, sin lógica de negocio |
| `services/` | Coordinan acceso a datos y transacciones |
| `domain/` | Reglas de negocio como funciones puras, sin base de datos |
| `middlewares/` | Autenticación, validación y manejo de errores |
| `validators/` | Esquemas Zod de entrada |

El núcleo de dominio no importa Prisma. Por eso las reglas se prueban sin levantar una base
de datos: `npm test`.

---

## Requisitos

- Node.js 18.18 o superior
- Una base de datos PostgreSQL

---

## Puesta en marcha

### 1. Base de datos

Cualquier PostgreSQL sirve. Con Docker:

```bash
docker run -d --name siga-pg -e POSTGRES_PASSWORD=siga -e POSTGRES_USER=siga \
  -e POSTGRES_DB=siga_d1 -p 5432:5432 postgres:16-alpine
```

También funciona una instancia gratuita de Render usando su *External Database URL*.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` con tu `DATABASE_URL` y un `JWT_SECRET` de al menos 32 caracteres. Después:

```bash
npx prisma migrate deploy
npm run seed
npm run dev
```

La API queda en `http://localhost:4000`. Comprueba el estado con:

```bash
curl http://localhost:4000/api/health
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La interfaz queda en `http://localhost:5173`. En desarrollo, Vite hace proxy de `/api` al
backend, así que no hace falta configurar nada más.

### Usuarios de ejemplo

El seed crea dos cuentas: `admin` y `empleado`. Las contraseñas por defecto son de
demostración y se pueden cambiar con `SEED_ADMIN_PASSWORD` y `SEED_EMPLEADO_PASSWORD`
antes de ejecutar el seed.

Un administrador puede registrar más cuentas desde la pantalla **Usuarios**
(`GET` y `POST /api/usuarios`, reservados al rol administrador).

---

## Comandos

### Backend

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga automática |
| `npm start` | Servidor en modo producción |
| `npm test` | Pruebas unitarias del dominio |
| `npm run seed` | Carga datos de ejemplo (no toca una base con datos) |
| `SEED_FORZAR=true npm run seed` | Regenera los datos desde cero |
| `npm run db:migrate` | Crea una migración nueva |
| `npm run db:studio` | Explorador visual de la base de datos |

### Frontend

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build para comprobarlo |

---

## Configuración

Todas las variables se leen en `backend/src/config/env.js`, que valida al arrancar: si una
variable falta o es incoherente, el servidor **no levanta** en vez de funcionar mal en
silencio.

| Variable | Por defecto | Para qué sirve |
|---|---|---|
| `DATABASE_URL` | — | Conexión a PostgreSQL. Obligatoria en producción |
| `JWT_SECRET` | valor de ejemplo | Firma los tokens. Mínimo 32 caracteres en producción |
| `JWT_EXPIRES_IN` | `8h` | Duración de la sesión |
| `CORS_ORIGIN` | `http://localhost:5173` | Orígenes permitidos, separados por comas |
| `SEMAFORO_DIAS_ROJO` | `3` | Cobertura por debajo de la cual el nivel es crítico |
| `SEMAFORO_DIAS_AMARILLO` | `7` | Cobertura por debajo de la cual el nivel es de atención |
| `VENTAS_MUESTRA` | `5` | Salidas recientes usadas para estimar el ritmo de venta |
| `DASHBOARD_DIAS_HISTORICO` | `90` | Ventana de la gráfica de inventario |
| `CONFIABILIDAD_PUNTOS_TENDENCIA` | `60` | Puntos de la tendencia por proveedor |

`SEMAFORO_DIAS_ROJO` debe ser menor que `SEMAFORO_DIAS_AMARILLO`; si no, el nivel de
atención sería inalcanzable y el arranque falla con ese mensaje.

---

## Despliegue en Render

El repositorio incluye `render.yaml`. Desde Render: **New → Blueprint**, selecciona este
repositorio y confirma. Se crean tres recursos: la base de datos, la API y el sitio
estático, ya conectados entre sí.

Los pasos detallados están en [`DESPLIEGUE.md`](DESPLIEGUE.md).

---

## Seguridad

- Contraseñas almacenadas con bcrypt; nunca en texto plano.
- Autenticación por JWT y autorización por rol comprobada **en el servidor**, no solo
  ocultando opciones en la interfaz.
- Toda entrada se valida con Zod antes de llegar a la lógica de negocio.
- Límite de peticiones global y uno más estricto en el login.
- Cabeceras de seguridad con Helmet y CORS restringido a los orígenes configurados.
- Los errores devuelven un mensaje útil al cliente, nunca la traza interna.
