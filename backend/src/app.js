import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import productosRoutes from './routes/productos.routes.js';
import movimientosRoutes from './routes/movimientos.routes.js';
import alertasRoutes from './routes/alertas.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

/**
 * Limite general de peticiones por IP. Es holgado (no debe estorbar el uso
 * normal de la tienda) y solo pretende contener bucles o scripts descontrolados.
 * El login tiene ademas su propio limite, mucho mas estricto.
 */
const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Espere un momento e intente de nuevo.' },
});

/**
 * Construye la app de Express. Se separa de `server.js` para poder importarla
 * en pruebas sin abrir un puerto.
 */
export function crearApp() {
  const app = express();

  app.use(helmet()); // cabeceras de seguridad por defecto
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  // Peticiones HTTP en una linea legible: metodo, ruta, estado y duracion.
  if (env.entorno !== 'test') {
    app.use(
      morgan(':method :url :status :response-time[0]ms', {
        stream: { write: (linea) => logger.info(linea.trim()) },
      }),
    );
  }

  app.use('/api', limiteGeneral);

  // Health check real: confirma que la base de datos responde, no solo que el
  // proceso esta vivo. Devuelve 503 si la BD no contesta.
  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ estado: 'ok', baseDatos: 'conectada', hora: new Date().toISOString() });
    } catch (error) {
      logger.error('El health check no pudo consultar la base de datos', error);
      res.status(503).json({ estado: 'degradado', baseDatos: 'sin conexion' });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/proveedores', proveedoresRoutes);
  app.use('/api/productos', productosRoutes);
  app.use('/api/movimientos', movimientosRoutes);
  app.use('/api/alertas', alertasRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
