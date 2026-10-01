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

const limitarPeticionesGenerales = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Espere un momento e intente de nuevo.' },
});

const politicaDeCors = {
  origin(origen, permitir) {
    const esPeticionSinNavegador = !origen;
    permitir(null, esPeticionSinNavegador || env.origenesPermitidos.includes(origen));
  },
  credentials: false,
};

async function comprobarEstadoDelServicio(_req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ estado: 'ok', baseDatos: 'conectada', hora: new Date().toISOString() });
  } catch (error) {
    logger.error('El health check no pudo consultar la base de datos', error);
    res.status(503).json({ estado: 'degradado', baseDatos: 'sin conexion' });
  }
}

export function crearApp() {
  const app = express();

  app.set('trust proxy', env.saltosDeProxyConfiables);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors(politicaDeCors));
  app.use(express.json({ limit: '100kb' }));

  if (env.entorno !== 'test') {
    app.use(
      morgan(':method :url :status :response-time[0]ms', {
        stream: { write: (linea) => logger.info(linea.trim()) },
      }),
    );
  }

  app.get('/api/health', comprobarEstadoDelServicio);

  app.use('/api', limitarPeticionesGenerales);
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
