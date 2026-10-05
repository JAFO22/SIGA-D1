import test from 'node:test';
import assert from 'node:assert/strict';

import { diaDe, diasCalendarioAbarcados } from './fechas.js';

test('diaDe usa el calendario de la tienda y no el de UTC', () => {
  assert.equal(diaDe('2026-03-10T20:30:00-05:00'), '2026-03-10');
  assert.equal(diaDe('2026-03-11T01:30:00Z'), '2026-03-10');
});

test('diasCalendarioAbarcados incluye el primer y el ultimo dia', () => {
  assert.equal(diasCalendarioAbarcados(['2026-03-10T08:00:00-05:00']), 1);
  assert.equal(
    diasCalendarioAbarcados(['2026-03-10T23:00:00-05:00', '2026-03-11T06:00:00-05:00']),
    2,
  );
});

test('diasCalendarioAbarcados no separa en dos dias las ventas de una misma noche', () => {
  assert.equal(
    diasCalendarioAbarcados(['2026-03-10T08:00:00-05:00', '2026-03-10T21:00:00-05:00']),
    1,
  );
});
