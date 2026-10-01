import test from 'node:test';
import assert from 'node:assert/strict';

import { reconstruirSerieInventario } from './inventario.js';
import { TIPO_MOVIMIENTO } from './constantes.js';

const entrada = (cantidad, fecha) => ({ tipo: TIPO_MOVIMIENTO.ENTRADA, cantidad, fecha });
const salida = (cantidad, fecha) => ({ tipo: TIPO_MOVIMIENTO.SALIDA, cantidad, fecha });

test('sin movimientos devuelve un unico punto con el stock actual', () => {
  const serie = reconstruirSerieInventario({ stockActual: 120, movimientos: [] });

  assert.equal(serie.length, 1);
  assert.equal(serie[0].inventario, 120);
});

test('la serie termina en el stock actual: I(0) + R - V = I(final)', () => {
  const movimientos = [
    entrada(100, '2026-01-01'),
    salida(30, '2026-01-02'),
    entrada(50, '2026-01-03'),
    salida(20, '2026-01-04'),
  ];

  const serie = reconstruirSerieInventario({ stockActual: 200, movimientos });

  assert.equal(serie.at(-1).inventario, 200);
});

test('ordena cronologicamente aunque lleguen desordenados', () => {
  const movimientos = [
    salida(10, '2026-01-03'),
    entrada(40, '2026-01-01'),
    salida(5, '2026-01-02'),
  ];

  const serie = reconstruirSerieInventario({ stockActual: 25, movimientos });

  assert.deepEqual(
    serie.map((punto) => punto.fecha),
    ['2026-01-01', '2026-01-02', '2026-01-03'],
  );
  assert.equal(serie.at(-1).inventario, 25);
});

test('agrupa varios movimientos del mismo dia en el valor de cierre', () => {
  const movimientos = [
    entrada(10, '2026-02-01T08:00:00Z'),
    entrada(10, '2026-02-01T15:00:00Z'),
    salida(5, '2026-02-02T09:00:00Z'),
  ];

  const serie = reconstruirSerieInventario({ stockActual: 15, movimientos });

  assert.equal(serie.length, 2);
  assert.equal(serie[0].inventario, 20);
  assert.equal(serie[1].inventario, 15);
});

test('el inventario reconstruido nunca es negativo', () => {
  const movimientos = [salida(500, '2026-03-01'), entrada(10, '2026-03-02')];

  const serie = reconstruirSerieInventario({ stockActual: 10, movimientos });

  assert.ok(serie.every((punto) => punto.inventario >= 0));
});
