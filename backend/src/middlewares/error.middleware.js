// Manejo de errores centralizado. Todas las rutas terminan aqui ante un fallo,
// de modo que el formato de respuesta de error es siempre el mismo:
//   { "error": "mensaje legible", "detalles"?: [{ campo, mensaje }] }
//
// Regla: el cliente recibe SIEMPRE un mensaje util y nunca un stack trace.

import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars -- Express identifica el handler por su aridad (4 args)
export function errorHandler(err, req, res, next) {
  // 1. Datos de entrada invalidos (Zod) -> 422 con el detalle por campo
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: 'Datos de entrada invalidos',
      detalles: err.issues.map((i) => ({
        campo: i.path.join('.') || '(raiz)',
        mensaje: i.message,
      })),
    });
  }

  // 2. Cuerpo JSON mal formado (lo lanza express.json antes de llegar a Zod).
  //    Sin este caso caeria en el 500 generico, que confunde al cliente.
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'El cuerpo de la peticion no es un JSON valido',
    });
  }

  // 3. Errores conocidos de Prisma -> codigo HTTP adecuado
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'El recurso solicitado no existe' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un registro con ese valor unico' });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({ error: 'Operacion no valida por integridad referencial' });
    }
  }

  // 4. Errores de negocio esperados (producto inexistente, stock insuficiente...)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.detalles !== undefined ? { detalles: err.detalles } : {}),
    });
  }

  // 5. Cualquier otra cosa es un bug no controlado: se registra con contexto
  //    suficiente para reproducirlo y se responde de forma generica.
  logger.error(`Error no controlado en ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.esProduccion ? {} : { debug: String(err?.message || err) }),
  });
}
