import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

// Se devuelve siempre el proveedor "resumido" para no exponer datos de mas.
const INCLUIR_PROVEEDOR = {
  proveedor: { select: { id: true, nombre: true, porcentajeCumplimiento: true } },
};

export function listarProductos() {
  return prisma.producto.findMany({
    orderBy: { nombre: 'asc' },
    include: INCLUIR_PROVEEDOR,
  });
}

export async function obtenerProducto(id) {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: INCLUIR_PROVEEDOR,
  });
  if (!producto) throw new AppError('Producto no encontrado', 404);
  return producto;
}

async function asegurarProveedorExiste(proveedorId) {
  const existe = await prisma.proveedor.findUnique({ where: { id: proveedorId } });
  if (!existe) throw new AppError('El proveedor indicado no existe', 422);
}

export async function crearProducto(datos) {
  await asegurarProveedorExiste(datos.proveedorId);
  return prisma.producto.create({ data: datos, include: INCLUIR_PROVEEDOR });
}

export async function actualizarProducto(id, datos) {
  await obtenerProducto(id);
  if (datos.proveedorId !== undefined) {
    await asegurarProveedorExiste(datos.proveedorId);
  }
  return prisma.producto.update({
    where: { id },
    data: datos,
    include: INCLUIR_PROVEEDOR,
  });
}

/**
 * Un producto con movimientos NO se borra: su historial es la evidencia que
 * sostiene el inventario y la confiabilidad del proveedor.
 *
 * La comprobacion y el borrado van en una transaccion para que no se pueda
 * colar un movimiento entre ambas operaciones.
 */
export async function eliminarProducto(id) {
  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findUnique({
      where: { id },
      select: { id: true, _count: { select: { movimientos: true } } },
    });
    if (!producto) throw new AppError('Producto no encontrado', 404);

    if (producto._count.movimientos > 0) {
      throw new AppError(
        `No se puede eliminar: el producto tiene ${producto._count.movimientos} ` +
          'movimiento(s) registrado(s). Su historial sostiene el inventario.',
        409,
      );
    }
    return tx.producto.delete({ where: { id } });
  });
}
