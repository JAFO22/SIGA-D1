import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { TIPO_MOVIMIENTO } from '../domain/constantes.js';
import { recalcularCumplimiento } from './proveedores.service.js';

export function listarMovimientos({ productoId, limite = 50 }) {
  return prisma.movimiento.findMany({
    where: productoId ? { productoId } : undefined,
    orderBy: { fecha: 'desc' },
    take: limite,
    include: {
      producto: { select: { id: true, nombre: true, proveedorId: true } },
      usuario: { select: { id: true, nombre: true } },
    },
  });
}

/**
 * Registra un movimiento y mantiene el inventario consistente. Es la UNICA
 * fuente de datos del sistema: de aqui se derivan el semaforo y la confiabilidad.
 *
 *   ENTRADA -> stock += cantidad   y recalcula la confiabilidad del proveedor
 *   SALIDA  -> valida que haya stock suficiente y stock -= cantidad
 *
 * Todo ocurre dentro de una transaccion: si algo falla, ni el movimiento ni el
 * stock quedan a medias.
 */
export async function registrarMovimiento({
  productoId,
  tipo,
  cantidad,
  cantidadSolicitada,
  fecha,
  usuarioId,
}) {
  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findUnique({ where: { id: productoId } });
    if (!producto) throw new AppError('El producto indicado no existe', 422);

    if (tipo === TIPO_MOVIMIENTO.SALIDA && cantidad > producto.stockActual) {
      throw new AppError(
        `Stock insuficiente: hay ${producto.stockActual} unidad(es) y se intenta retirar ${cantidad}`,
        409,
      );
    }

    const delta = tipo === TIPO_MOVIMIENTO.ENTRADA ? cantidad : -cantidad;

    const movimiento = await tx.movimiento.create({
      data: {
        productoId,
        usuarioId,
        tipo,
        cantidad,
        // La cantidad solicitada solo tiene sentido en una ENTRADA.
        cantidadSolicitada:
          tipo === TIPO_MOVIMIENTO.ENTRADA ? cantidadSolicitada ?? null : null,
        fecha: fecha ?? new Date(),
      },
      include: { producto: { select: { id: true, nombre: true } } },
    });

    await tx.producto.update({
      where: { id: productoId },
      data: { stockActual: { increment: delta } },
    });

    // Confiabilidad "mirando hacia atras": se recalcula en cada ENTRADA y queda
    // en el historial (no solo el ultimo valor).
    if (tipo === TIPO_MOVIMIENTO.ENTRADA) {
      await recalcularCumplimiento(producto.proveedorId, tx);
    }

    return movimiento;
  });
}
