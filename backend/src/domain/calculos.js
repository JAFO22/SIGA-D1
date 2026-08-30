// ---------------------------------------------------------------------------
// Nucleo de reglas de negocio de SIGA-D1.
//
// Son funciones PURAS (sin base de datos ni I/O) para poder probarlas de forma
// aislada -> ver src/domain/calculos.test.js. Los servicios se limitan a traer
// los datos y delegar el calculo aqui.
// ---------------------------------------------------------------------------

import { ESTADO_SEMAFORO } from './constantes.js';

/**
 * Estima el ritmo de venta diario como el promedio de la cantidad de los
 * ultimos `muestra` movimientos de tipo SALIDA.
 *
 * El modelo Stock & Flow razona dia a dia: V(t) es la venta del dia. Si el
 * usuario registra las salidas con periodicidad diaria, este promedio movil
 * aproxima el V(t) "actual" y suaviza los picos (p. ej. quincena).
 *
 * @param {Array<{cantidad:number, fecha:Date|string}>} movimientosSalida
 * @param {number} muestra  cantidad de movimientos recientes a promediar
 * @returns {number} unidades/dia (0 si no hay historial de ventas)
 */
export function estimarRitmoVentaDiario(movimientosSalida, muestra) {
  if (!Array.isArray(movimientosSalida) || movimientosSalida.length === 0) {
    return 0;
  }
  const tamano = Math.max(1, Math.trunc(muestra) || 1);
  const recientes = [...movimientosSalida]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, tamano);

  const total = recientes.reduce((suma, m) => suma + m.cantidad, 0);
  return total / recientes.length;
}

/**
 * Traduce el inventario de un producto a un semaforo de riesgo segun cuantos
 * DIAS de inventario le quedan al ritmo de venta actual.
 *
 * Reglas (los umbrales llegan por configuracion, nunca fijos aqui):
 *   - ROJO:     stock == 0  o  diasRestantes <= diasRojo      (quiebre inminente)
 *   - AMARILLO: diasRojo < diasRestantes <= diasAmarillo       (reponer pronto)
 *   - VERDE:    diasRestantes > diasAmarillo                   (sin accion)
 *
 * Caso borde: si no hay ventas recientes (ritmo = 0) pero si hay stock, no hay
 * evidencia de quiebre -> VERDE con diasRestantes = null.
 *
 * @param {object} params
 * @param {number} params.stockActual
 * @param {Array<{cantidad:number, fecha:Date|string}>} params.movimientosSalida
 * @param {{diasAmarillo:number, diasRojo:number, ventasMuestra:number}} params.config
 * @returns {{estado:string, diasRestantes:number|null, ritmoVentaDiario:number}}
 */
export function calcularSemaforo({ stockActual, movimientosSalida, config }) {
  const { diasAmarillo, diasRojo, ventasMuestra } = config;
  const ritmoVentaDiario = redondear(
    estimarRitmoVentaDiario(movimientosSalida, ventasMuestra),
  );

  if (stockActual <= 0) {
    return { estado: ESTADO_SEMAFORO.ROJO, diasRestantes: 0, ritmoVentaDiario };
  }
  if (ritmoVentaDiario === 0) {
    return { estado: ESTADO_SEMAFORO.VERDE, diasRestantes: null, ritmoVentaDiario };
  }

  const diasRestantes = stockActual / ritmoVentaDiario;
  let estado;
  if (diasRestantes <= diasRojo) estado = ESTADO_SEMAFORO.ROJO;
  else if (diasRestantes <= diasAmarillo) estado = ESTADO_SEMAFORO.AMARILLO;
  else estado = ESTADO_SEMAFORO.VERDE;

  return { estado, diasRestantes: redondear(diasRestantes), ritmoVentaDiario };
}

/**
 * Confiabilidad de un proveedor:
 *
 *   porcentajeCumplimiento = (total entregado / total pedido) * 100
 *
 * Se calcula sobre todos los movimientos de ENTRADA de sus productos que
 * registran `cantidadSolicitada`. Se aplica la formula tal cual: si un
 * proveedor entrega de mas, el resultado puede superar el 100 %.
 * Si aun no hay datos con pedido asociado, se asume 100 %.
 *
 * @param {Array<{cantidad:number, cantidadSolicitada:number|null}>} movimientosEntrada
 * @returns {{porcentaje:number, totalPedido:number, totalEntregado:number}}
 */
export function calcularCumplimiento(movimientosEntrada) {
  const conPedido = (movimientosEntrada || []).filter(
    (m) => m.cantidadSolicitada != null && m.cantidadSolicitada > 0,
  );

  if (conPedido.length === 0) {
    return { porcentaje: 100, totalPedido: 0, totalEntregado: 0 };
  }

  const totalPedido = conPedido.reduce((s, m) => s + m.cantidadSolicitada, 0);
  const totalEntregado = conPedido.reduce((s, m) => s + m.cantidad, 0);
  const porcentaje = redondear((totalEntregado / totalPedido) * 100);

  return { porcentaje, totalPedido, totalEntregado };
}

/** Redondea a 2 decimales evitando errores de coma flotante tipo 12.340000001. */
function redondear(numero) {
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}
