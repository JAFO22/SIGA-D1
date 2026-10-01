# Despliegue en Render

Guía paso a paso. Al terminar tendrás tres recursos funcionando: una base de datos
PostgreSQL, la API y el sitio web.

---

## Antes de empezar

- Una cuenta en [render.com](https://render.com) (el registro con GitHub es el camino corto).
- El repositorio `JAFO22/SIGA-D1` con la rama `main` actualizada.

---

## Paso 1 — Crear el Blueprint

1. Entra en [dashboard.render.com](https://dashboard.render.com).
2. Pulsa **New +** → **Blueprint**.
3. Si es la primera vez, Render pedirá conectar tu cuenta de GitHub. Autoriza el acceso
   al repositorio **SIGA-D1**.
4. Selecciona el repositorio y la rama **main**.
5. Render detecta `render.yaml` y muestra lo que va a crear:
   - `siga-d1-db` — base de datos PostgreSQL
   - `siga-d1-api` — la API
   - `siga-d1-web` — el sitio web
6. Dale un nombre al blueprint y pulsa **Apply**.

No hace falta escribir ninguna URL a mano: el blueprint conecta los tres servicios entre
sí. `JWT_SECRET` se genera solo.

---

## Paso 2 — Esperar el primer despliegue

El primer despliegue tarda entre 5 y 10 minutos. Se ejecuta en este orden:

1. Se crea la base de datos.
2. La API instala dependencias, genera el cliente de Prisma, **aplica las migraciones** y
   **carga los datos de ejemplo**.
3. El sitio web compila el frontend.

Puedes seguir el progreso en la pestaña **Logs** de cada servicio.

### Qué deberías ver en los logs de la API

```
✓ listo SIGA-D1 API escuchando en el puerto 10000
› info  Entorno: production
› info  Base de datos: postgresql://dpg-xxxxx.oregon-postgres.render.com/siga_d1
› info  Origenes permitidos: https://siga-d1-web.onrender.com
```

La contraseña de la base de datos nunca aparece en los logs.

---

## Paso 3 — Comprobar que funciona

1. Abre la URL de la API y añade `/api/health`:

   ```
   https://siga-d1-api.onrender.com/api/health
   ```

   Debe responder:

   ```json
   {"estado":"ok","baseDatos":"conectada","hora":"..."}
   ```

2. Abre la URL del sitio web (`https://siga-d1-web.onrender.com`) e inicia sesión con las
   cuentas de ejemplo.

3. Navega a **Riesgo de quiebre** y recarga la página con F5. Si carga bien, la regla de
   reescritura de rutas está funcionando.

---

## Paso 4 — Cambiar las contraseñas de ejemplo

El seed crea las cuentas con contraseñas de demostración. Para producción:

1. Ve a **siga-d1-api** → **Environment**.
2. Añade `SEED_ADMIN_PASSWORD` y `SEED_EMPLEADO_PASSWORD` con los valores que quieras.
3. Ve a **Shell** (o fuerza un redeploy) y ejecuta:

   ```bash
   SEED_FORZAR=true npm run seed
   ```

   Ojo: `SEED_FORZAR` **borra y regenera** los datos de ejemplo. Hazlo antes de empezar a
   cargar información real.

---

## Cosas que conviene saber del plan gratuito

**El servicio se duerme.** Tras 15 minutos sin tráfico, la API se apaga. La siguiente
petición la despierta y tarda unos 50 segundos. Es normal: no es un fallo. Si durante una
demostración necesitas que responda al instante, abre la URL de `/api/health` un minuto
antes.

**La base de datos caduca.** Las bases PostgreSQL gratuitas expiran a los 30 días. Render
avisa por correo. Para conservar los datos, exporta antes con `pg_dump` o pasa al plan de
pago.

**Los despliegues no borran datos.** El seed comprueba si ya hay información y, si la hay,
no toca nada. Solo `SEED_FORZAR=true` regenera desde cero.

---

## Si algo sale mal

| Síntoma | Causa probable | Solución |
|---|---|---|
| El build de la API falla en `migrate deploy` | La base aún no estaba lista | Pulsa **Manual Deploy** → **Deploy latest commit** |
| La web carga pero el login da error de red | `CORS_ORIGIN` no coincide | En **siga-d1-api** → Environment, comprueba que apunta al host de `siga-d1-web` |
| `/api/health` responde `degradado` | La API no alcanza la base de datos | Revisa que `DATABASE_URL` esté enlazada a `siga-d1-db` |
| Recargar una ruta interna da 404 | Falta la regla de reescritura | Comprueba que `render.yaml` incluye el bloque `routes` del sitio estático |
| La API no arranca y el log dice «Configuracion invalida» | Falta una variable obligatoria | El mensaje dice exactamente cuál; añádela en **Environment** |

---

## Actualizar el proyecto

Cada `git push` a `main` dispara un despliegue automático de los servicios afectados.

```bash
git add .
git commit -m "describe el cambio"
git push
```

Si cambias el esquema de la base de datos, crea la migración antes de subir:

```bash
cd backend
npx prisma migrate dev --name describe_el_cambio
```

El despliegue aplicará esa migración con `prisma migrate deploy`.
