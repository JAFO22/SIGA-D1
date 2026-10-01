import test from 'node:test';
import assert from 'node:assert/strict';

import {
  estimarRitmoVentaDiario,
  calcularSemaforo,
  calcularCumplimiento,
} from './calculos.js';
import { ESTADO_SEMAFORO } from './constantes.js';

const CONFIG = { diasAmarillo: 7, diasRojo: 3, ventasMuestra: 5 };
const salida = (cantidad, fecha) => ({ cantidad, fecha });

test('estimarRitmoVentaDiario promedia solo los N movimientos mas recientes', () => {
  const movimientos = [
    salida(10, '2026-01-01'),
    salida(20, '2026-01-02'),
    salida(30, '2026-01-03'),
    salida(100, '2026-01-04'),
    salida(100, '2026-01-05'),
    salida(100, '2026-01-06'),
  ];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5), 70);
});

test('estimarRitmoVentaDiario devuelve 0 si no hay ventas', () => {
  assert.equal(estimarRitmoVentaDiario([], 5), 0);
});

test('semaforo VERDE cuando el inventario cubre mas dias que el umbral', () => {
  const r = calcularSemaforo({
    stockActual: 400,
    movimientosSalida: [salida(20, '2026-01-05'), salida(20, '2026-01-06')],
    config: CONFIG,
  });
  assert.equal(r.estado, ESTADO_SEMAFORO.VERDE);
  assert.equal(r.diasRestantes, 20);
});

test('semaforo AMARILLO cuando quedan pocos dias', () => {
  const r = calcularSemaforo({
    stockActual: 100,
    movimientosSalida: [salida(20, '2026-01-05'), salida(20, '2026-01-06')],
    config: CONFIG,
  });
  assert.equal(r.estado, ESTADO_SEMAFORO.AMARILLO);
});

test('semaforo ROJO cuando el quiebre es inminente', () => {
  const r = calcularSemaforo({
    stockActual: 40,
    movimientosSalida: [salida(20, '2026-01-05'), salida(20, '2026-01-06')],
    config: CONFIG,
  });
  assert.equal(r.estado, ESTADO_SEMAFORO.ROJO);
});

test('semaforo ROJO cuando el stock ya esta en cero', () => {
  const r = calcularSemaforo({ stockActual: 0, movimientosSalida: [], config: CONFIG });
  assert.equal(r.estado, ESTADO_SEMAFORO.ROJO);
  assert.equal(r.diasRestantes, 0);
});

test('semaforo VERDE (sin datos) cuando hay stock pero no hay ventas', () => {
  const r = calcularSemaforo({ stockActual: 50, movimientosSalida: [], config: CONFIG });
  assert.equal(r.estado, ESTADO_SEMAFORO.VERDE);
  assert.equal(r.diasRestantes, null);
});

test('cumplimiento = entregado / pedido * 100', () => {
  const entradas = [
    { cantidad: 90, cantidadSolicitada: 100 },
    { cantidad: 80, cantidadSolicitada: 100 },
  ];
  const r = calcularCumplimiento(entradas);
  assert.equal(r.totalPedido, 200);
  assert.equal(r.totalEntregado, 170);
  assert.equal(r.porcentaje, 85);
});

test('cumplimiento ignora entradas sin cantidad solicitada y asume 100 si no hay datos', () => {
  assert.equal(calcularCumplimiento([{ cantidad: 50, cantidadSolicitada: null }]).porcentaje, 100);
  assert.equal(calcularCumplimiento([]).porcentaje, 100);
});
