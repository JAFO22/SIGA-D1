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

const cincoVentasDeVeinteElMismoDia = [9, 10, 11, 12, 13].map((hora) =>
  salida(20, `2026-01-05T${String(hora).padStart(2, '0')}:00:00Z`),
);

test('estimarRitmoVentaDiario divide las unidades de las N salidas recientes entre los dias que abarcan', () => {
  const movimientos = [
    salida(10, '2026-01-01'),
    salida(20, '2026-01-02'),
    salida(30, '2026-01-03'),
    salida(100, '2026-01-04'),
    salida(100, '2026-01-05'),
    salida(100, '2026-01-06'),
  ];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5), 350 / 5);
});

test('estimarRitmoVentaDiario agrupa en un solo dia las ventas de la misma fecha', () => {
  assert.equal(estimarRitmoVentaDiario(cincoVentasDeVeinteElMismoDia, 5), 100);
});

test('estimarRitmoVentaDiario cuenta los dias sin ventas que hay entre salidas', () => {
  const movimientos = [
    salida(50, '2026-01-01'),
    salida(30, '2026-01-03'),
    salida(20, '2026-01-06'),
  ];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5), 100 / 6);
});

test('estimarRitmoVentaDiario cuenta dias calendario aunque no se completen 24 horas', () => {
  const movimientos = [
    salida(40, '2026-01-02T09:00:00Z'),
    salida(60, '2026-01-06T08:00:00Z'),
  ];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5), 100 / 5);
});

test('estimarRitmoVentaDiario toma una unica salida como un dia de consumo', () => {
  assert.equal(estimarRitmoVentaDiario([salida(30, '2026-01-05')], 5), 30);
});

test('calcularSemaforo usa el ritmo diario cuando hay varias ventas el mismo dia', () => {
  const r = calcularSemaforo({
    stockActual: 100,
    movimientosSalida: cincoVentasDeVeinteElMismoDia,
    config: CONFIG,
  });

  assert.equal(r.ritmoVentaDiario, 100);
  assert.equal(r.diasRestantes, 1);
  assert.equal(r.estado, ESTADO_SEMAFORO.ROJO);
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
