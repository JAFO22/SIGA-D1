import { asyncHandler } from '../utils/asyncHandler.js';
import * as alertasService from '../services/alertas.service.js';

export const listar = asyncHandler(async (_req, res) => {
  res.json(await alertasService.evaluarProductos());
});

export const config = asyncHandler(async (_req, res) => {
  res.json(alertasService.obtenerConfigSemaforo());
});
