import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

const RESPUESTA_SEGUN_CODIGO_DE_PRISMA = {
  P2025: { estado: 404, error: 'El recurso solicitado no existe' },
  P2002: { estado: 409, error: 'Ya existe un registro con ese valor unico' },
  P2003: { estado: 409, error: 'Operacion no valida por integridad referencial' },
};

const esCuerpoJsonMalFormado = (err) => err instanceof SyntaxError && 'body' in err;

function traducirAErrorDeCliente(err) {
  if (err instanceof ZodError) {
    return {
      estado: 422,
      error: 'Datos de entrada invalidos',
      detalles: err.issues.map((problema) => ({
        campo: problema.path.join('.') || '(raiz)',
        mensaje: problema.message,
      })),
    };
  }

  if (esCuerpoJsonMalFormado(err)) {
    return { estado: 400, error: 'El cuerpo de la peticion no es un JSON valido' };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return RESPUESTA_SEGUN_CODIGO_DE_PRISMA[err.code] ?? null;
  }

  if (err instanceof AppError) {
    return { estado: err.statusCode, error: err.message, detalles: err.detalles };
  }

  return null;
}

export function notFound(req, _res, next) {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, _next) {
  const respuesta = traducirAErrorDeCliente(err);

  if (respuesta) {
    const { estado, error, detalles } = respuesta;
    return res.status(estado).json(detalles === undefined ? { error } : { error, detalles });
  }

  logger.error(`Error no controlado en ${req.method} ${req.originalUrl}`, err);

  return res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.esProduccion ? {} : { debug: String(err?.message ?? err) }),
  });
}
