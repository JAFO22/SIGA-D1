# SIGA-D1 — Sistema de inventario inteligente

Prototipo funcional para la tienda **D1 San Mateo** (Fusagasugá, Colombia).

A partir de **una sola fuente de datos** —los movimientos de entrada y salida que
registra el usuario— el sistema genera en paralelo dos análisis:

1. **Confiabilidad del proveedor** (mirando hacia atrás): compara lo pedido
   contra lo entregado y calcula un % de cumplimiento histórico por proveedor.
2. **Alerta de quiebre por producto** (mirando hacia adelante): estima cuántos
   días de inventario quedan al ritmo de venta actual y lo traduce en un nivel
   de riesgo: **Óptimo**, **Atención** o **Crítico**.

### El modelo Stock & Flow

Es un modelo de dinámica de sistemas con solo dos conceptos:

- **Stock** — lo que se acumula: el inventario `I(t)`, en unidades.
- **Flow** — lo que entra o sale y lo modifica: `R(t)` reposición y `V(t)` ventas.

Todo el modelo es una identidad contable:

```
I(t+1) = max(0, I(t) + R(t) − V(t))
```

«El inventario de mañana es el de hoy, más lo que entró, menos lo que salió», y
nunca baja de cero. No hay predicción ni estadística: es aritmética de saldos.

Quedó validado en la Fase 0 con `../Actividad 1/simulacion_D1.py` (semilla fija
`SEMILLA = 7`). El backend **no ejecuta ese script**: reimplementa la misma
identidad en `backend/src/domain/inventario.js`.

> El **semáforo no forma parte del modelo**. Stock & Flow solo produce `I(t)`; el
> semáforo es una regla de decisión aparte que se apoya en él:
> `cobertura en días = I(t) ÷ ritmo de venta`.

### Diagramas

Los siete diagramas del proyecto (Gantt, Scrum, casos de uso, clases, secuencia,
entidad-relación y flujo) están en [`docs/diagramas.html`](docs/diagramas.html).
Ábrelo en el navegador.

---

## Arquitectura

```
ProyectoD1/
├── backend/     API REST — Node.js + Express + Prisma (SQLite)
└── frontend/    SPA — React + Vite + Tailwind CSS
```

Comunicación por **API REST/JSON**. Cada capa tiene una responsabilidad única:

| Backend (`backend/src/`)          | Rol                                              |
|-----------------------------------|-------------------------------------------------|
| `routes/`                         | Definen endpoints y encadenan middlewares        |
| `controllers/`                    | Adaptan HTTP ↔ servicios (sin lógica de negocio) |
| `services/`                       | Lógica de negocio y acceso a datos (Prisma)      |
| `domain/`                         | Reglas puras: semáforo y cumplimiento (+ tests)  |
| `middlewares/`                    | Auth (JWT), validación (Zod), errores            |
| `validators/`                     | Esquemas Zod de entrada                          |

| Frontend (`frontend/src/`)        | Rol                                              |
|-----------------------------------|-------------------------------------------------|
| `pages/`                          | Una por pantalla                                 |
| `components/`                     | UI reutilizable (tabla, modal, semáforo, …)      |
| `services/`                       | Llamadas a la API (axios)                        |
| `context/`                        | Sesión y rol del usuario                         |
| `hooks/`                          | `useFetch` (carga + error + refetch)             |

---

## Requisitos

- **Node.js ≥ 18.18** (probado con Node 24) y npm.
- No se necesita instalar ninguna base de datos: SQLite se crea sola.

---

## Puesta en marcha

> Se necesitan **dos terminales**: una para el backend y otra para el frontend.

### 1) Backend  (`http://localhost:4000`)

```bash
cd backend
cp .env.example .env          # ya se incluye un .env válido para el prototipo
npm install
npm run db:migrate            # crea la base SQLite y aplica el esquema
npm run seed                  # carga datos de ejemplo (D1 San Mateo)
npm run dev                   # servidor con recarga automática
```

### 2) Frontend  (`http://localhost:5173`)

```bash
cd frontend
npm install
npm run dev
```

Abrir <http://localhost:5173> e iniciar sesión.

### Usuarios de prueba

Las credenciales de acceso se entregan de forma privada al equipo autorizado.
Consultar al administrador del proyecto para obtenerlas.

---

## Pantallas

1. **Login** — dos perfiles; cada rol ve solo sus opciones.
2. **Catálogo** *(admin)* — CRUD de productos y proveedores.
3. **Movimientos** — alta de entradas/salidas + actividad reciente.
4. **Riesgo de quiebre** — cada producto con su nivel de cobertura (motor de alertas / semáforo).
5. **Confiabilidad de proveedor** *(admin)* — % de cumplimiento y su tendencia.
6. **Panel general** *(admin)* — resumen, gráfico de inventario histórico, últimos movimientos.

---

## Reglas de negocio

### Semáforo de riesgo de quiebre (por producto)

`días de cobertura = stock actual ÷ ritmo de venta diario`, donde el ritmo es el
**promedio de las últimas N salidas** (`VENTAS_MUESTRA`, configurable).

| Estado (API) | Nivel en la interfaz | Condición                                             |
|--------------|----------------------|------------------------------------------------------|
| `ROJO`       | Crítico              | stock = 0 **o** días ≤ `SEMAFORO_DIAS_ROJO`           |
| `AMARILLO`   | Atención             | `SEMAFORO_DIAS_ROJO` < días ≤ `SEMAFORO_DIAS_AMARILLO` |
| `VERDE`      | Óptimo               | días > `SEMAFORO_DIAS_AMARILLO`                       |

Los umbrales **no están fijos en el código**: se leen de variables de entorno
(`backend/.env`). Valores por defecto: rojo ≤ 3 días, amarillo ≤ 7 días,
muestra = 5 movimientos. La API mantiene los nombres `VERDE/AMARILLO/ROJO` (regla
de negocio); la interfaz los presenta como *Óptimo / Atención / Crítico*.

### Confiabilidad del proveedor

```
porcentaje_cumplimiento = (total entregado / total pedido) × 100
```

Al registrar una **ENTRADA** se indica la *cantidad solicitada* (lo pedido) y la
*cantidad* (lo entregado). Cada ENTRADA recalcula el % del proveedor y **guarda
una foto en el historial** (`CumplimientoHistorial`), lo que permite graficar la
tendencia — no se conserva solo el último valor.

---

## Modelo de datos

`Proveedor 1─N Producto`, `Producto 1─N Movimiento`, `Usuario 1─N Movimiento`.

- **Proveedor**: `nombre`, `porcentajeCumplimiento` (calculado).
- **Producto**: `nombre`, `categoria`, `proveedorId`, `stockActual`.
- **Movimiento**: `productoId`, `usuarioId`, `tipo` (ENTRADA|SALIDA), `cantidad`,
  `cantidadSolicitada` (solo ENTRADA), `fecha`.
- **Usuario**: `nombre`, `passwordHash`, `rol` (EMPLEADO|ADMINISTRADOR).

> `tipo` y `rol` son `String` porque SQLite no soporta enums nativos en Prisma;
> se validan en la aplicación y pueden migrar a `enum` en PostgreSQL sin cambiar
> la lógica. Migrar a PostgreSQL = cambiar `provider` y `DATABASE_URL`.

---

## API REST (resumen)

| Método | Ruta                                   | Rol        |
|--------|----------------------------------------|------------|
| POST   | `/api/auth/login`                      | público    |
| GET    | `/api/productos` · `/api/proveedores`  | autenticado|
| POST/PUT/DELETE | `/api/productos/*` · `/api/proveedores/*` | admin |
| GET    | `/api/movimientos`                     | autenticado|
| POST   | `/api/movimientos`                     | autenticado|
| GET    | `/api/alertas` · `/api/alertas/config` | autenticado|
| GET    | `/api/proveedores/confiabilidad`       | autenticado|
| GET    | `/api/dashboard`                       | admin      |

Errores con código HTTP correcto y cuerpo `{ "error": "...", "detalles"?: [...] }`
(`401` sin token, `403` sin permiso, `404` inexistente, `409` regla de negocio,
`422` datos inválidos).

---

## Seguridad y buenas prácticas

- Contraseñas con **bcrypt**; sesión con **JWT** (`Authorization: Bearer`).
- **Validación en el backend** con Zod en todo endpoint que recibe datos
  (no se confía en el frontend).
- Autorización por rol en el servidor, además del filtrado del menú en el cliente.
- Cabeceras de seguridad (**helmet**), **CORS** restringido y **rate limit** en login.
- Stock y confiabilidad se actualizan dentro de una **transacción**.
- Configuración sensible en `.env` (nunca en el código).
- Manejo de errores **centralizado**.

---

## Pruebas

Las reglas puras (semáforo y cumplimiento) tienen pruebas con el runner nativo
de Node:

```bash
cd backend
npm test
```

---

## Scripts útiles (backend)

| Script            | Acción                                             |
|-------------------|---------------------------------------------------|
| `npm run dev`     | Servidor con recarga automática                    |
| `npm start`       | Servidor en modo producción                        |
| `npm run seed`    | Recarga los datos de ejemplo                       |
| `npm run db:reset`| Recrea la base desde cero y vuelve a sembrar       |
| `npm run db:studio`| Prisma Studio (explorador visual de la BD)        |
| `npm test`        | Pruebas unitarias del dominio                      |

---

## Fuera de alcance

Facturación / punto de venta, pagos y multi-tienda. El prototipo se centra solo
en inventario, alertas y confiabilidad de proveedor.
