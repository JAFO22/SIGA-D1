import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { TIPO_MOVIMIENTO } from '../domain/constantes.js';
import { calcularSemaforo } from '../domain/calculos.js';

/** Umbrales vigentes del semaforo (leidos de la configuracion, no fijos). */
export function obtenerConfigSemaforo() {
  return { ...env.semaforo };
}

/**
 * Motor de alertas: evalua cada producto y le asigna un estado de semaforo
 * segun los dias de inventario que le quedan al ritmo de venta actual.
 */
export async function evaluarProductos() {
  const config = env.semaforo;

  const productos = await prisma.producto.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      proveedor: { select: { id: true, nombre: true } },
      // Solo las ultimas SALIDA: es la muestra para estimar el ritmo de venta.
      movimientos: {
        where: { tipo: TIPO_MOVIMIENTO.SALIDA },
        orderBy: { fecha: 'desc' },
        take: config.ventasMuestra,
        select: { cantidad: true, fecha: true },
      },
    },
  });

  return productos.map((p) => {
    const semaforo = calcularSemaforo({
      stockActual: p.stockActual,
      movimientosSalida: p.movimientos,
      config,
    });
    return {
      productoId: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      proveedorId: p.proveedor.id,
      proveedor: p.proveedor.nombre,
      stockActual: p.stockActual,
      ritmoVentaDiario: semaforo.ritmoVentaDiario,
      diasRestantes: semaforo.diasRestantes,
      estado: semaforo.estado,
    };
  });
}
