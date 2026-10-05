import { asyncHandler } from '../utils/asyncHandler.js';
import * as usuariosService from '../services/usuarios.service.js';

export const listar = asyncHandler(async (_req, res) => {
  res.json(await usuariosService.listarUsuarios());
});

export const crear = asyncHandler(async (req, res) => {
  const usuario = await usuariosService.crearUsuario(req.body);
  res.status(201).json(usuario);
});
