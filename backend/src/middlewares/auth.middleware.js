// Autenticacion (JWT) y autorizacion (por rol).

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/** Exige un JWT valido en la cabecera `Authorization: Bearer <token>`. */
export function autenticar(req, _res, next) {
  const cabecera = req.headers.authorization || '';
  const [esquema, token] = cabecera.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next(new AppError('Falta el token de autenticacion', 401));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secreto);
    req.usuario = { id: payload.sub, nombre: payload.nombre, rol: payload.rol };
    next();
  } catch {
    next(new AppError('Token invalido o expirado', 401));
  }
}

/**
 * Exige que el usuario autenticado tenga uno de los roles indicados.
 * Debe usarse siempre despues de `autenticar`.
 */
export const autorizar =
  (...rolesPermitidos) =>
  (req, _res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return next(new AppError('No tiene permisos para realizar esta accion', 403));
    }
    next();
  };
