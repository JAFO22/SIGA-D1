import { prisma } from '../lib/prisma.js';
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

/** Comprobacion de existencia barata (no arrastra productos ni historial). */
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

/**
 * Un proveedor con productos no se borra: dejaria productos huerfanos.
 * Comprobacion, limpieza de historial y borrado van en una sola transaccion
 * para que no quede a medias ni se cuele un producto entre medias.
 */
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
    // El historial no tiene cascada en SQLite: se limpia explicitamente.
    await tx.cumplimientoHistorial.deleteMany({ where: { proveedorId: id } });
    return tx.proveedor.delete({ where: { id } });
  });
}

/**
 * Recalcula el % de cumplimiento del proveedor con TODAS las entradas de sus
 * productos y guarda una foto en el historial.
 *
 * Se invoca despues de registrar cada movimiento de ENTRADA. Acepta un cliente
 * de transaccion (`tx`) para poder ejecutarse dentro de la misma transaccion
 * que crea el movimiento.
 *
 * @param {number} proveedorId
 * @param {import('@prisma/client').Prisma.TransactionClient} [cliente]
 */
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
  return prisma.cumplimientoHistorial.findMany({
    where: { proveedorId: id },
    orderBy: { fecha: 'asc' },
  });
}

/**
 * Vista para la pantalla "Confiabilidad de proveedor": % actual de cada
 * proveedor + su tendencia en el tiempo (para graficar).
 */
export async function confiabilidadGeneral() {
  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      _count: { select: { productos: true } },
      historialCumplimiento: { orderBy: { fecha: 'asc' } },
    },
  });

  return proveedores.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    porcentajeCumplimiento: p.porcentajeCumplimiento,
    productos: p._count.productos,
    tendencia: p.historialCumplimiento.map((h) => ({
      fecha: h.fecha,
      porcentaje: h.porcentaje,
      totalPedido: h.totalPedido,
      totalEntregado: h.totalEntregado,
    })),
  }));
}
