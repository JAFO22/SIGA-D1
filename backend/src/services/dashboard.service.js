import { prisma } from '../lib/prisma.js';
import { ESTADO_SEMAFORO } from '../domain/constantes.js';
import { reconstruirSerieInventario } from '../domain/inventario.js';
import { evaluarProductos } from './alertas.service.js';

/**
 * Resumen general para el dashboard del administrador:
 *  - conteo de productos por estado de semaforo
 *  - productos que requieren atencion (rojo / amarillo)
 *  - ultimos movimientos registrados
 *  - serie historica de inventario por producto (modelo Stock & Flow)
 */
export async function resumenDashboard() {
  const [alertas, ultimosMovimientos, productos] = await Promise.all([
    evaluarProductos(),
    prisma.movimiento.findMany({
      orderBy: { fecha: 'desc' },
      take: 10,
      include: {
        producto: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
      },
    }),
    prisma.producto.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        movimientos: {
          orderBy: { fecha: 'asc' },
          select: { tipo: true, cantidad: true, fecha: true },
        },
      },
    }),
  ]);

  const cuenta = (estado) => alertas.filter((a) => a.estado === estado).length;

  return {
    resumen: {
      totalProductos: alertas.length,
      enRojo: cuenta(ESTADO_SEMAFORO.ROJO),
      enAmarillo: cuenta(ESTADO_SEMAFORO.AMARILLO),
      enVerde: cuenta(ESTADO_SEMAFORO.VERDE),
    },
    alertasCriticas: alertas.filter((a) => a.estado !== ESTADO_SEMAFORO.VERDE),
    ultimosMovimientos,
    inventarioHistorico: productos.map((p) => ({
      productoId: p.id,
      nombre: p.nombre,
      serie: reconstruirSerieInventario({
        stockActual: p.stockActual,
        movimientos: p.movimientos,
      }),
    })),
  };
}
