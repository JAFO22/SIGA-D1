import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const resultado = await authService.login(req.body);
  res.json(resultado);
});

// Devuelve el usuario del token (util para rehidratar la sesion en el frontend).
export const perfil = asyncHandler(async (req, res) => {
  res.json({ usuario: req.usuario });
});
