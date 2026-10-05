import test from 'node:test';
import assert from 'node:assert/strict';

import {
  estimarRitmoVentaDiario,
  calcularSemaforo,
  calcularCumplimiento,
} from './calculos.js';
import { ESTADO_SEMAFORO } from './constantes.js';
import { instanteEnLaTienda } from './fechas.js';

const CONFIG = { diasAmarillo: 7, diasRojo: 3, ventasMuestra: 5 };
const enLaTienda = (dia, hora = '12:00') => instanteEnLaTienda(dia, hora);
const salida = (cantidad, dia, hora) => ({ cantidad, fecha: enLaTienda(dia, hora) });

const cincoVentasDeVeinteElMismoDia = ['09:00', '10:00', '11:00', '12:00', '13:00'].map((hora) =>
  salida(20, '2026-01-05', hora),
);

const semaforo = (stockActual, movimientosSalida, hoy) =>
  calcularSemaforo({ stockActual, movimientosSalida, config: CONFIG, hoy: enLaTienda(hoy, '18:00') });

test('estimarRitmoVentaDiario divide las unidades de las N salidas recientes entre los dias observados', () => {
  const movimientos = [
    salida(10, '2026-01-01'),
    salida(20, '2026-01-02'),
    salida(30, '2026-01-03'),
    salida(100, '2026-01-04'),
    salida(100, '2026-01-05'),
    salida(100, '2026-01-06'),
  ];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5, enLaTienda('2026-01-06', '18:00')), 350 / 5);
});

test('estimarRitmoVentaDiario agrupa en un solo dia las ventas de la misma fecha', () => {
  assert.equal(
    estimarRitmoVentaDiario(cincoVentasDeVeinteElMismoDia, 5, enLaTienda('2026-01-05', '18:00')),
    100,
  );
});

test('estimarRitmoVentaDiario cuenta los dias sin ventas que hay entre salidas', () => {
  const movimientos = [
    salida(50, '2026-01-01'),
    salida(30, '2026-01-03'),
    salida(20, '2026-01-06'),
  ];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5, enLaTienda('2026-01-06', '18:00')), 100 / 6);
});

test('estimarRitmoVentaDiario cuenta los dias sin ventas desde la ultima salida hasta hoy', () => {
  const movimientos = ['01', '02', '03', '04', '05'].map((dia) => salida(20, `2026-01-${dia}`));

  assert.equal(estimarRitmoVentaDiario(movimientos, 5, enLaTienda('2026-01-10')), 100 / 10);
});

test('estimarRitmoVentaDiario cuenta dias calendario aunque no se completen 24 horas', () => {
  const movimientos = [salida(40, '2026-01-02', '09:00'), salida(60, '2026-01-06', '08:00')];

  assert.equal(estimarRitmoVentaDiario(movimientos, 5, enLaTienda('2026-01-06', '08:30')), 100 / 5);
});

test('estimarRitmoVentaDiario toma una unica salida de hoy como un dia de consumo', () => {
  assert.equal(estimarRitmoVentaDiario([salida(30, '2026-01-05')], 5, enLaTienda('2026-01-05', '18:00')), 30);
});

test('estimarRitmoVentaDiario devuelve 0 si no hay ventas', () => {
  assert.equal(estimarRitmoVentaDiario([], 5, enLaTienda('2026-01-05')), 0);
});

test('semaforo VERDE cuando el inventario cubre mas dias que el umbral', () => {
  const r = semaforo(400, [salida(20, '2026-01-05'), salida(20, '2026-01-06')], '2026-01-06');
  assert.equal(r.estado, ESTADO_SEMAFORO.VERDE);
  assert.equal(r.diasRestantes, 20);
});

test('semaforo AMARILLO cuando quedan pocos dias', () => {
  const r = semaforo(100, [salida(20, '2026-01-05'), salida(20, '2026-01-06')], '2026-01-06');
  assert.equal(r.estado, ESTADO_SEMAFORO.AMARILLO);
});

test('semaforo ROJO cuando el quiebre es inminente', () => {
  const r = semaforo(40, [salida(20, '2026-01-05'), salida(20, '2026-01-06')], '2026-01-06');
  assert.equal(r.estado, ESTADO_SEMAFORO.ROJO);
});

test('semaforo deja de marcar ROJO cuando el producto dejo de venderse', () => {
  const r = semaforo(40, [salida(20, '2026-01-05'), salida(20, '2026-01-06')], '2026-02-04');
  assert.equal(r.estado, ESTADO_SEMAFORO.VERDE);
  assert.equal(r.diasRestantes, 31);
});

test('semaforo clasifica con el ritmo exacto y no con el redondeado', () => {
  const sieteUnidadesEnTresDias = [
    salida(3, '2026-01-01'),
    salida(2, '2026-01-02'),
    salida(2, '2026-01-03'),
  ];

  const r = semaforo(7, sieteUnidadesEnTresDias, '2026-01-03');

  assert.equal(r.ritmoVentaDiario, 2.33);
  assert.equal(r.diasRestantes, 3);
  assert.equal(r.estado, ESTADO_SEMAFORO.ROJO);
});

test('semaforo usa el ritmo diario cuando hay varias ventas el mismo dia', () => {
  const r = semaforo(100, cincoVentasDeVeinteElMismoDia, '2026-01-05');

  assert.equal(r.ritmoVentaDiario, 100);
  assert.equal(r.diasRestantes, 1);
  assert.equal(r.estado, ESTADO_SEMAFORO.ROJO);
});

test('semaforo ROJO cuando el stock ya esta en cero', () => {
  const r = semaforo(0, [], '2026-01-05');
  assert.equal(r.estado, ESTADO_SEMAFORO.ROJO);
  assert.equal(r.diasRestantes, 0);
});

test('semaforo VERDE (sin datos) cuando hay stock pero no hay ventas', () => {
  const r = semaforo(50, [], '2026-01-05');
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

test('cumplimiento: lo entregado de mas no compensa lo que falto en otro pedido', () => {
  const entradas = [
    { cantidad: 150, cantidadSolicitada: 100 },
    { cantidad: 50, cantidadSolicitada: 100 },
  ];
  const r = calcularCumplimiento(entradas);
  assert.equal(r.totalPedido, 200);
  assert.equal(r.totalEntregado, 150);
  assert.equal(r.porcentaje, 75);
});

test('cumplimiento nunca supera el 100 %', () => {
  assert.equal(calcularCumplimiento([{ cantidad: 130, cantidadSolicitada: 100 }]).porcentaje, 100);
});

test('cumplimiento ignora entradas sin cantidad solicitada y asume 100 si no hay datos', () => {
  assert.equal(calcularCumplimiento([{ cantidad: 50, cantidadSolicitada: null }]).porcentaje, 100);
  assert.equal(calcularCumplimiento([]).porcentaje, 100);
});
