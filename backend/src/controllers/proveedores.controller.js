import { asyncHandler } from '../utils/asyncHandler.js';
import * as proveedoresService from '../services/proveedores.service.js';

export const listar = asyncHandler(async (_req, res) => {
  res.json(await proveedoresService.listarProveedores());
});

export const obtener = asyncHandler(async (req, res) => {
  res.json(await proveedoresService.obtenerProveedor(req.params.id));
});

export const crear = asyncHandler(async (req, res) => {
  const proveedor = await proveedoresService.crearProveedor(req.body);
  res.status(201).json(proveedor);
});

export const actualizar = asyncHandler(async (req, res) => {
  res.json(await proveedoresService.actualizarProveedor(req.params.id, req.body));
});

export const eliminar = asyncHandler(async (req, res) => {
  await proveedoresService.eliminarProveedor(req.params.id);
  res.status(204).send();
});

export const historial = asyncHandler(async (req, res) => {
  res.json(await proveedoresService.historialCumplimiento(req.params.id));
});

export const confiabilidad = asyncHandler(async (_req, res) => {
  res.json(await proveedoresService.confiabilidadGeneral());
});
