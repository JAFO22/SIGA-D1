import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { TIPO_MOVIMIENTO } from '../domain/constantes.js';
import { calcularCumplimiento } from '../domain/calculos.js';

export function listarProveedores() {
  return prisma.proveedor.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { productos: true } } },
  });
}

export async function obtenerProveedor(id) {
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: { productos: { select: { id: true, nombre: true, stockActual: true } } },
  });
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404);
  return proveedor;
}

async function asegurarProveedorExiste(id, cliente = prisma) {
  const existe = await cliente.proveedor.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existe) throw new AppError('Proveedor no encontrado', 404);
}

export function crearProveedor({ nombre }) {
  return prisma.proveedor.create({ data: { nombre } });
}

export async function actualizarProveedor(id, { nombre }) {
  await asegurarProveedorExiste(id);
  return prisma.proveedor.update({ where: { id }, data: { nombre } });
}

export async function eliminarProveedor(id) {
  return prisma.$transaction(async (tx) => {
    const proveedor = await tx.proveedor.findUnique({
      where: { id },
      select: { id: true, _count: { select: { productos: true } } },
    });
    if (!proveedor) throw new AppError('Proveedor no encontrado', 404);

    if (proveedor._count.productos > 0) {
      throw new AppError(
        `No se puede eliminar: el proveedor tiene ${proveedor._count.productos} ` +
          'producto(s) asociado(s). Reasignelos o eliminelos primero.',
        409,
      );
    }

    await tx.cumplimientoHistorial.deleteMany({ where: { proveedorId: id } });
    return tx.proveedor.delete({ where: { id } });
  });
}

export async function recalcularCumplimiento(proveedorId, cliente = prisma) {
  const entradas = await cliente.movimiento.findMany({
    where: { tipo: TIPO_MOVIMIENTO.ENTRADA, producto: { proveedorId } },
    select: { cantidad: true, cantidadSolicitada: true },
  });

  const resultado = calcularCumplimiento(entradas);

  await cliente.proveedor.update({
    where: { id: proveedorId },
    data: { porcentajeCumplimiento: resultado.porcentaje },
  });
  await cliente.cumplimientoHistorial.create({
    data: {
      proveedorId,
      porcentaje: resultado.porcentaje,
      totalPedido: resultado.totalPedido,
      totalEntregado: resultado.totalEntregado,
    },
  });

  return resultado;
}

export async function historialCumplimiento(id) {
  await asegurarProveedorExiste(id);
  const puntos = await prisma.cumplimientoHistorial.findMany({
    where: { proveedorId: id },
    orderBy: { fecha: 'desc' },
    take: env.historial.puntosDeTendencia,
  });
  return puntos.reverse();
}

export async function confiabilidadGeneral() {
  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      _count: { select: { productos: true } },
      historialCumplimiento: {
        orderBy: { fecha: 'desc' },
        take: env.historial.puntosDeTendencia,
      },
    },
  });

  return proveedores.map((proveedor) => ({
    id: proveedor.id,
    nombre: proveedor.nombre,
    porcentajeCumplimiento: proveedor.porcentajeCumplimiento,
    productos: proveedor._count.productos,
    tendencia: proveedor.historialCumplimiento
      .map((punto) => ({
        fecha: punto.fecha,
        porcentaje: punto.porcentaje,
        totalPedido: punto.totalPedido,
        totalEntregado: punto.totalEntregado,
      }))
      .reverse(),
  }));
}
