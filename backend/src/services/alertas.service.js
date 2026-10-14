import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { TIPO_MOVIMIENTO } from '../domain/constantes.js';
import { calcularSemaforo } from '../domain/calculos.js';
import { ventasPorDia, calcularStockSeguridad } from '../domain/abastecimiento.js';
import { inversaNormalEstandar } from '../domain/estadistica.js';
import { tiemposDeEntregaPorProveedor } from './proveedores.service.js';

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export function obtenerConfigSemaforo() {
  const { nivelServicio, diasVentanaDemanda } = env.abastecimiento;
  return {
    ...env.semaforo,
    nivelServicio,
    z: Math.round(inversaNormalEstandar(nivelServicio) * 100) / 100,
    diasVentanaDemanda,
  };
}

async function salidasDeLaVentanaPorProducto(hoy) {
  // Un dia de margen: la ventana se recorta despues en dias de la tienda.
  const desde = new Date(hoy.getTime() - (env.abastecimiento.diasVentanaDemanda + 1) * MILISEGUNDOS_POR_DIA);
  const salidas = await prisma.movimiento.findMany({
    where: { tipo: TIPO_MOVIMIENTO.SALIDA, fecha: { gte: desde } },
    select: { productoId: true, cantidad: true, fecha: true },
  });

  const porProducto = new Map();
  for (const s of salidas) {
    if (!porProducto.has(s.productoId)) porProducto.set(s.productoId, []);
    porProducto.get(s.productoId).push(s);
  }
  return porProducto;
}

export async function evaluarProductos() {
  const config = env.semaforo;
  const { nivelServicio, diasVentanaDemanda } = env.abastecimiento;

  const productos = await prisma.producto.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      proveedor: { select: { id: true, nombre: true } },
      movimientos: {
        where: { tipo: TIPO_MOVIMIENTO.SALIDA },
        orderBy: { fecha: 'desc' },
        take: config.ventasMuestra,
        select: { cantidad: true, fecha: true },
      },
    },
  });

  const hoy = new Date();
  const [salidasPorProducto, tiemposDeEntrega] = await Promise.all([
    salidasDeLaVentanaPorProducto(hoy),
    tiemposDeEntregaPorProveedor([...new Set(productos.map((p) => p.proveedorId))]),
  ]);

  return productos.map((p) => {
    const semaforo = calcularSemaforo({
      stockActual: p.stockActual,
      movimientosSalida: p.movimientos,
      config,
      hoy,
    });
    const tiempoEntrega = tiemposDeEntrega.get(p.proveedorId) ?? null;
    const stockSeguridad = calcularStockSeguridad({
      ventasDiarias: ventasPorDia(salidasPorProducto.get(p.id), diasVentanaDemanda, hoy),
      tiempoEntrega,
      nivelServicio,
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
      stockSeguridad: stockSeguridad?.unidades ?? null,
      bajoStockSeguridad: stockSeguridad ? p.stockActual < stockSeguridad.unidades : false,
      demandaMedia: stockSeguridad?.demandaMedia ?? null,
      desviacionDemanda: stockSeguridad?.desviacionDemanda ?? null,
      tiempoEntregaPromedio: tiempoEntrega ? Math.round(tiempoEntrega.promedio * 100) / 100 : null,
    };
  });
}
