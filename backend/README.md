# SIGA-D1 · Backend

API REST en **Node.js + Express** con **Prisma** sobre **SQLite**.
Arquitectura en capas: `routes → controllers → services → domain / prisma`.

## Instalación y ejecución

```bash
cp .env.example .env
npm install
npm run db:migrate      # aplica el esquema y crea prisma/dev.db
npm run seed            # datos de ejemplo (D1 San Mateo)
npm run dev             # http://localhost:4000
```

Comprobación rápida: `GET http://localhost:4000/api/health`.

## Variables de entorno (`.env`)

| Variable                 | Por defecto | Descripción                                  |
|--------------------------|-------------|----------------------------------------------|
| `PORT`                   | `4000`      | Puerto HTTP                                   |
| `DATABASE_URL`           | `file:./dev.db` | Conexión (cambiar para PostgreSQL)       |
| `JWT_SECRET`             | *(ejemplo)* | Secreto de firma de tokens                    |
| `JWT_EXPIRES_IN`         | `8h`        | Expiración del token                          |
| `CORS_ORIGIN`            | `http://localhost:5173` | Origen permitido                  |
| `SEMAFORO_DIAS_AMARILLO` | `7`         | Umbral (días) para pasar a amarillo           |
| `SEMAFORO_DIAS_ROJO`     | `3`         | Umbral (días) para pasar a rojo               |
| `VENTAS_MUESTRA`         | `5`         | Nº de salidas recientes para el ritmo de venta|

## Estructura

```
src/
├── config/env.js          Lectura y validación de la configuración
├── domain/                 Reglas puras + constantes + pruebas
│   ├── calculos.js         Semáforo y cumplimiento (funciones puras)
│   ├── inventario.js       Serie histórica I(t) (Stock & Flow)
│   └── calculos.test.js    Pruebas (node:test)
├── middlewares/            auth (JWT), validate (Zod), error handler
├── validators/             Esquemas Zod de entrada
├── services/               Lógica de negocio + Prisma
├── controllers/            HTTP ↔ servicios
├── routes/                 Endpoints
├── lib/prisma.js           Cliente Prisma único
├── app.js                  Ensamblado de Express (sin escuchar)
└── server.js               Arranque + apagado ordenado
prisma/
├── schema.prisma           Modelo de datos
└── seed.js                 Datos de ejemplo
```

## Scripts

| Script             | Acción                                    |
|--------------------|-------------------------------------------|
| `npm run dev`      | Servidor con `--watch`                    |
| `npm start`        | Servidor sin watch                        |
| `npm run seed`     | Recarga datos de ejemplo                  |
| `npm run db:migrate` | `prisma migrate dev`                    |
| `npm run db:reset` | Recrea la BD y re-siembra                 |
| `npm run db:studio`| Prisma Studio                            |
| `npm test`         | Pruebas del dominio                       |

## Notas de diseño

- **Una sola fuente de datos**: todo sale de `Movimiento`. El semáforo y la
  confiabilidad se derivan de ahí; `Producto.stockActual` y
  `Proveedor.porcentajeCumplimiento` son cachés que se actualizan en cada
  movimiento dentro de una **transacción**.
- `cantidadSolicitada` (opcional, solo ENTRADA) es lo que se le pidió al
  proveedor; comparado con `cantidad` (lo entregado) da el % de cumplimiento.
- SQLite no soporta enums en Prisma → `tipo` y `rol` son `String` validados con
  Zod. Migración a PostgreSQL: cambiar `provider` + `DATABASE_URL` (y, si se
  quiere, convertir a `enum`).
