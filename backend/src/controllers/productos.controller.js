import { asyncHandler } from '../utils/asyncHandler.js';
import * as productosService from '../services/productos.service.js';

export const listar = asyncHandler(async (_req, res) => {
  res.json(await productosService.listarProductos());
});

export const obtener = asyncHandler(async (req, res) => {
  res.json(await productosService.obtenerProducto(req.params.id));
});

export const crear = asyncHandler(async (req, res) => {
  const producto = await productosService.crearProducto(req.body);
  res.status(201).json(producto);
});

export const actualizar = asyncHandler(async (req, res) => {
  res.json(await productosService.actualizarProducto(req.params.id, req.body));
});

export const eliminar = asyncHandler(async (req, res) => {
  await productosService.eliminarProducto(req.params.id);
  res.status(204).send();
});
