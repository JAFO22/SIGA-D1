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
test('estimarRitmoVentaDiario calcula unidades por día sobre las salidas recientes', () => {
  const movimientos = [
    salida(10, '2026-01-01'),
    salida(20, '2026-01-02'),
    salida(30, '2026-01-03'),
    salida(100, '2026-01-04'),
    salida(100, '2026-01-05'),
    salida(100, '2026-01-06'),
  ];

  // Las 5 salidas más recientes suman 350 unidades
  // y cubren 5 días calendario (02/01 al 06/01).
  assert.equal(estimarRitmoVentaDiario(movimientos, 5), 70);
});

test('agrupa correctamente varias ventas realizadas el mismo día', () => {
  const movimientos = [
    salida(20, '2026-01-05T09:00:00'),
    salida(20, '2026-01-05T10:00:00'),
    salida(20, '2026-01-05T11:00:00'),
    salida(20, '2026-01-05T12:00:00'),
    salida(20, '2026-01-05T13:00:00'),
  ];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5), 100);
});

test('calcula correctamente cuando las ventas ocurren en días irregulares', () => {
  const movimientos = [
    salida(50, '2026-01-01'),
    salida(30, '2026-01-03'),
    salida(20, '2026-01-06'),
  ];

  // 100 unidades entre el 01/01 y el 06/01, inclusive = 6 días.
  assert.equal(estimarRitmoVentaDiario(movimientos, 5), 100 / 6);
});

test('varias ventas el mismo día producen una cobertura correcta', () => {
  const movimientos = [
    salida(20, '2026-01-05T09:00:00'),
    salida(20, '2026-01-05T10:00:00'),
    salida(20, '2026-01-05T11:00:00'),
    salida(20, '2026-01-05T12:00:00'),
    salida(20, '2026-01-05T13:00:00'),
  ];

  const r = calcularSemaforo({
    stockActual: 100,
    movimientosSalida: movimientos,
    config: CONFIG,
  });

  assert.equal(r.ritmoVentaDiario, 100);
  assert.equal(r.diasRestantes, 1);
  assert.equal(r.estado, ESTADO_SEMAFORO.ROJO);
});

test('una sola salida se considera un día de consumo', () => {
  const movimientos = [
    salida(30, '2026-01-05'),
  ];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5), 30);
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
