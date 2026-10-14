import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { TIPO_MOVIMIENTO } from '../domain/constantes.js';
import { calcularCumplimiento } from '../domain/calculos.js';
import { calcularTiempoEntrega } from '../domain/abastecimiento.js';

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

function bloquearProveedorHastaTerminar(tx, proveedorId) {
  return tx.$queryRaw`SELECT id FROM "Proveedor" WHERE id = ${proveedorId} FOR UPDATE`;
}

export async function recalcularCumplimiento(proveedorId, tx) {
  await bloquearProveedorHastaTerminar(tx, proveedorId);

  const entradas = await tx.movimiento.findMany({
    where: { tipo: TIPO_MOVIMIENTO.ENTRADA, producto: { proveedorId } },
    select: { cantidad: true, cantidadSolicitada: true },
  });

  const resultado = calcularCumplimiento(entradas);

  await tx.proveedor.update({
    where: { id: proveedorId },
    data: { porcentajeCumplimiento: resultado.porcentaje },
  });
  await tx.cumplimientoHistorial.create({
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

async function entregasConFechaDePedido(proveedorId) {
  return prisma.movimiento.findMany({
    where: { tipo: TIPO_MOVIMIENTO.ENTRADA, fechaPedido: { not: null }, producto: { proveedorId } },
    orderBy: { fecha: 'desc' },
    take: env.abastecimiento.entregasMuestra,
    select: { fecha: true, fechaPedido: true },
  });
}

export async function tiemposDeEntregaPorProveedor(proveedorIds) {
  const tiempos = await Promise.all(
    proveedorIds.map(async (id) => [id, calcularTiempoEntrega(await entregasConFechaDePedido(id))]),
  );
  return new Map(tiempos);
}

function redondearTiempoEntrega(tiempo) {
  if (!tiempo) return null;
  return {
    promedio: Math.round(tiempo.promedio * 100) / 100,
    desviacion: Math.round(tiempo.desviacion * 100) / 100,
    muestras: tiempo.muestras,
  };
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

  const tiemposDeEntrega = await tiemposDeEntregaPorProveedor(proveedores.map((p) => p.id));

  return proveedores.map((proveedor) => ({
    id: proveedor.id,
    nombre: proveedor.nombre,
    porcentajeCumplimiento: proveedor.porcentajeCumplimiento,
    productos: proveedor._count.productos,
    tiempoEntrega: redondearTiempoEntrega(tiemposDeEntrega.get(proveedor.id)),
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
