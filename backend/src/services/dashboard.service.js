import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { ESTADO_SEMAFORO } from '../domain/constantes.js';
import { reconstruirSerieInventario } from '../domain/inventario.js';
import { evaluarProductos } from './alertas.service.js';

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

function inicioDeLaVentanaHistorica() {
  const dias = env.historial.diasDeSerieInventario;
  return new Date(Date.now() - dias * MILISEGUNDOS_POR_DIA);
}

function contarPorEstado(alertas) {
  return {
    totalProductos: alertas.length,
    enRojo: alertas.filter((a) => a.estado === ESTADO_SEMAFORO.ROJO).length,
    enAmarillo: alertas.filter((a) => a.estado === ESTADO_SEMAFORO.AMARILLO).length,
    enVerde: alertas.filter((a) => a.estado === ESTADO_SEMAFORO.VERDE).length,
  };
}

export async function resumenDashboard() {
  const desde = inicioDeLaVentanaHistorica();

  const [alertas, ultimosMovimientos, productos] = await Promise.all([
    evaluarProductos(),

    prisma.movimiento.findMany({
      orderBy: { fecha: 'desc' },
      take: env.historial.movimientosRecientes,
      include: {
        producto: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
      },
    }),

    prisma.producto.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        stockActual: true,
        movimientos: {
          where: { fecha: { gte: desde } },
          orderBy: { fecha: 'asc' },
          select: { tipo: true, cantidad: true, fecha: true },
        },
      },
    }),
  ]);

  return {
    resumen: contarPorEstado(alertas),
    alertasCriticas: alertas.filter((a) => a.estado !== ESTADO_SEMAFORO.VERDE),
    ultimosMovimientos,
    inventarioHistorico: productos.map((producto) => ({
      productoId: producto.id,
      nombre: producto.nombre,
      serie: reconstruirSerieInventario({
        stockActual: producto.stockActual,
        movimientos: producto.movimientos,
      }),
    })),
  };
}
