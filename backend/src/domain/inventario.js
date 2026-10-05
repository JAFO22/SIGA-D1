import { TIPO_MOVIMIENTO } from './constantes.js';
import { diaDe } from './fechas.js';

const INVENTARIO_MINIMO = 0;

function signoDelFlujo(movimiento) {
  return movimiento.tipo === TIPO_MOVIMIENTO.ENTRADA ? 1 : -1;
}

function efectoSobreElStock(movimiento) {
  return signoDelFlujo(movimiento) * movimiento.cantidad;
}

export function reconstruirSerieInventario({ stockActual, movimientos }) {
  if (!movimientos || movimientos.length === 0) {
    return [{ fecha: diaDe(Date.now()), inventario: stockActual }];
  }

  const enOrdenCronologico = [...movimientos].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha),
  );

  const efectoAcumulado = enOrdenCronologico.reduce(
    (total, movimiento) => total + efectoSobreElStock(movimiento),
    0,
  );

  let inventario = stockActual - efectoAcumulado;
  const cierrePorDia = new Map();

  for (const movimiento of enOrdenCronologico) {
    inventario = Math.max(INVENTARIO_MINIMO, inventario + efectoSobreElStock(movimiento));
    cierrePorDia.set(diaDe(movimiento.fecha), inventario);
  }

  return [...cierrePorDia].map(([fecha, inventario]) => ({ fecha, inventario }));
}
