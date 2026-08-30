import { asyncHandler } from '../utils/asyncHandler.js';
import * as movimientosService from '../services/movimientos.service.js';

export const listar = asyncHandler(async (req, res) => {
  const { productoId, limite } = req.query;
  res.json(await movimientosService.listarMovimientos({ productoId, limite }));
});

export const registrar = asyncHandler(async (req, res) => {
  // El autor del movimiento sale del token, no del body (no se puede falsear).
  const movimiento = await movimientosService.registrarMovimiento({
    ...req.body,
    usuarioId: req.usuario.id,
  });
  res.status(201).json(movimiento);
});
