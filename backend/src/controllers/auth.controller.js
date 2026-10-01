import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const resultado = await authService.login(req.body);
  res.json(resultado);
});

export const perfil = asyncHandler(async (req, res) => {
  res.json({ usuario: req.usuario });
});

export const registrar = asyncHandler(async (req, res) => {
  const usuario = await authService.registrar(req.body);
  res.status(201).json(usuario);
});

export const listarUsuarios = asyncHandler(async (_req, res) => {
  const usuarios = await authService.listarUsuarios();
  res.json(usuarios);
});

