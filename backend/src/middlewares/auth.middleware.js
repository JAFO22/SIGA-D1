import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

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

export const autorizar =
  (...rolesPermitidos) =>
  (req, _res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return next(new AppError('No tiene permisos para realizar esta accion', 403));
    }
    next();
  };
