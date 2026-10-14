import test from 'node:test';
import assert from 'node:assert/strict';

import { calcularTiempoEntrega, ventasPorDia, calcularStockSeguridad } from './abastecimiento.js';
import { media, desviacionEstandar, inversaNormalEstandar } from './estadistica.js';
import { instanteEnLaTienda } from './fechas.js';

const enLaTienda = (dia, hora = '12:00') => instanteEnLaTienda(dia, hora);
const entrada = (diaPedido, diaEntrega) => ({
  fechaPedido: diaPedido && enLaTienda(diaPedido, '16:00'),
  fecha: enLaTienda(diaEntrega, '08:00'),
});
const salida = (cantidad, dia, hora) => ({ cantidad, fecha: enLaTienda(dia, hora) });

test('desviacionEstandar es la muestral (divide entre n - 1)', () => {
  assert.equal(media([2, 4, 4, 4, 5, 5, 7, 9]), 5);
  assert.ok(Math.abs(desviacionEstandar([2, 4, 4, 4, 5, 5, 7, 9]) - 2.138) < 1e-3);
  assert.equal(desviacionEstandar([7]), 0);
});

test('inversaNormalEstandar devuelve el z de los niveles de servicio usuales', () => {
  assert.equal(inversaNormalEstandar(0.5), 0);
  assert.ok(Math.abs(inversaNormalEstandar(0.9) - 1.2816) < 1e-4);
  assert.ok(Math.abs(inversaNormalEstandar(0.95) - 1.6449) < 1e-4);
  assert.ok(Math.abs(inversaNormalEstandar(0.99) - 2.3263) < 1e-4);
  assert.ok(Math.abs(inversaNormalEstandar(0.01) + 2.3263) < 1e-4);
  assert.throws(() => inversaNormalEstandar(1), RangeError);
});

test('calcularTiempoEntrega mide dias calendario entre el pedido y la entrega', () => {
  const resultado = calcularTiempoEntrega([
    entrada('2026-01-05', '2026-01-07'),
    entrada('2026-01-08', '2026-01-09'),
    entrada('2026-01-10', '2026-01-13'),
  ]);

  assert.equal(resultado.promedio, 2);
  assert.equal(resultado.desviacion, 1);
  assert.equal(resultado.muestras, 3);
});

test('calcularTiempoEntrega ignora las entradas sin fecha de pedido', () => {
  assert.equal(calcularTiempoEntrega([entrada(null, '2026-01-07')]), null);
  assert.equal(calcularTiempoEntrega([]), null);
  assert.deepEqual(calcularTiempoEntrega([entrada(null, '2026-01-07'), entrada('2026-01-07', '2026-01-07')]), {
    promedio: 0,
    desviacion: 0,
    muestras: 1,
  });
});

test('calcularTiempoEntrega cuenta en la hora de la tienda un pedido hecho de noche', () => {
  const pedidoALas11pm = { fechaPedido: enLaTienda('2026-01-05', '23:00'), fecha: enLaTienda('2026-01-06', '07:00') };
  assert.equal(calcularTiempoEntrega([pedidoALas11pm]).promedio, 1);
});

test('ventasPorDia suma por dia y rellena con cero los dias sin ventas hasta hoy', () => {
  const serie = ventasPorDia(
    [salida(10, '2026-01-01', '09:00'), salida(5, '2026-01-01', '18:00'), salida(20, '2026-01-03')],
    28,
    enLaTienda('2026-01-05', '20:00'),
  );

  assert.deepEqual(serie, [15, 0, 20, 0, 0]);
});

test('ventasPorDia descarta las ventas fuera de la ventana', () => {
  const serie = ventasPorDia([salida(99, '2026-01-01'), salida(10, '2026-01-09')], 3, enLaTienda('2026-01-10'));
  assert.deepEqual(serie, [10, 0]);
  assert.deepEqual(ventasPorDia([], 28, enLaTienda('2026-01-10')), []);
});

test('calcularStockSeguridad combina la variacion de la demanda y la del plazo', () => {
  const resultado = calcularStockSeguridad({
    ventasDiarias: [37, 53, 37, 53],
    tiempoEntrega: { promedio: 2, desviacion: 0.5, muestras: 6 },
    nivelServicio: 0.95,
  });

  // d = 45, sd = 9.24, SS = 1.645 * sqrt(2 * 85.33 + 45^2 * 0.25) = 1.645 * 26.0 = 42.8
  assert.equal(resultado.demandaMedia, 45);
  assert.equal(resultado.desviacionDemanda, 9.24);
  assert.equal(resultado.z, 1.64);
  assert.equal(resultado.unidades, 43);
});

test('calcularStockSeguridad con plazo fijo solo protege la variacion de la demanda', () => {
  const resultado = calcularStockSeguridad({
    ventasDiarias: [10, 20, 30],
    tiempoEntrega: { promedio: 4, desviacion: 0, muestras: 3 },
    nivelServicio: 0.95,
  });

  // 1.645 * sqrt(4 * 100) = 32.9
  assert.equal(resultado.unidades, 33);
});

test('calcularStockSeguridad sube con el nivel de servicio', () => {
  const base = { ventasDiarias: [10, 20, 30], tiempoEntrega: { promedio: 4, desviacion: 1, muestras: 5 } };
  const al90 = calcularStockSeguridad({ ...base, nivelServicio: 0.9 }).unidades;
  const al99 = calcularStockSeguridad({ ...base, nivelServicio: 0.99 }).unidades;
  assert.ok(al99 > al90);
});

test('calcularStockSeguridad sin datos de entrega no inventa un valor', () => {
  assert.equal(calcularStockSeguridad({ ventasDiarias: [10, 20], tiempoEntrega: null, nivelServicio: 0.95 }), null);
});

test('calcularStockSeguridad es cero si no hay ventas recientes', () => {
  const resultado = calcularStockSeguridad({
    ventasDiarias: [],
    tiempoEntrega: { promedio: 2, desviacion: 1, muestras: 4 },
    nivelServicio: 0.95,
  });
  assert.equal(resultado.unidades, 0);
});
