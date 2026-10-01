import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { TIPO_MOVIMIENTO } from '../domain/constantes.js';
import { recalcularCumplimiento } from './proveedores.service.js';

const RESUMEN_DE_PRODUCTO = { select: { id: true, nombre: true, proveedorId: true } };
const RESUMEN_DE_USUARIO = { select: { id: true, nombre: true } };

export function listarMovimientos({ productoId, limite = 50 }) {
  return prisma.movimiento.findMany({
    where: productoId ? { productoId } : undefined,
    orderBy: { fecha: 'desc' },
    take: limite,
    include: { producto: RESUMEN_DE_PRODUCTO, usuario: RESUMEN_DE_USUARIO },
  });
}

async function descontarStockDisponible(tx, productoId, cantidad) {
  const { count } = await tx.producto.updateMany({
    where: { id: productoId, stockActual: { gte: cantidad } },
    data: { stockActual: { decrement: cantidad } },
  });

  if (count === 0) {
    const producto = await tx.producto.findUnique({
      where: { id: productoId },
      select: { stockActual: true },
    });
    throw new AppError(
      `Stock insuficiente: hay ${producto.stockActual} unidad(es) y se intenta retirar ${cantidad}`,
      409,
    );
  }
}

export async function registrarMovimiento({
  productoId,
  tipo,
  cantidad,
  cantidadSolicitada,
  fecha,
  usuarioId,
}) {
  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findUnique({
      where: { id: productoId },
      select: { id: true, proveedorId: true },
    });
    if (!producto) throw new AppError('El producto indicado no existe', 422);

    const esEntrada = tipo === TIPO_MOVIMIENTO.ENTRADA;

    if (esEntrada) {
      await tx.producto.update({
        where: { id: productoId },
        data: { stockActual: { increment: cantidad } },
      });
    } else {
      await descontarStockDisponible(tx, productoId, cantidad);
    }

    const movimiento = await tx.movimiento.create({
      data: {
        productoId,
        usuarioId,
        tipo,
        cantidad,
        cantidadSolicitada: esEntrada ? cantidadSolicitada ?? null : null,
        fecha: fecha ?? new Date(),
      },
      include: { producto: RESUMEN_DE_PRODUCTO, usuario: RESUMEN_DE_USUARIO },
    });

    if (esEntrada) {
      await recalcularCumplimiento(producto.proveedorId, tx);
    }

    return movimiento;
  });
}
