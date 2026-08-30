// ---------------------------------------------------------------------------
// Serie historica de inventario I(t) a partir de los movimientos registrados.
//
// Aplica la identidad contable del modelo Stock & Flow:
//
//     I(t+1) = max(0, I(t) + R(t) - V(t))
//
//   I(t) = inventario (el "stock": lo que se acumula)
//   R(t) = entradas del periodo (flujo de reposicion)
//   V(t) = salidas del periodo  (flujo de ventas)
//
// El acotado a >= 0 replica el modelo validado en la Fase 0
// (Actividad 1/simulacion_D1.py), donde el inventario nunca es negativo.
//
// Diferencia importante con aquel script: alli se SIMULA hacia adelante con
// datos generados; aqui se RECONSTRUYE hacia atras a partir de movimientos
// reales. Es la misma identidad aplicada en sentido inverso, no el mismo
// programa.
// ---------------------------------------------------------------------------

/**
 * @param {object} params
 * @param {number} params.stockActual  inventario actual del producto
 * @param {Array<{tipo:string, cantidad:number, fecha:Date|string}>} params.movimientos
 * @returns {Array<{fecha:string, inventario:number}>} un punto por dia (YYYY-MM-DD)
 */
export function reconstruirSerieInventario({ stockActual, movimientos }) {
  if (!movimientos || movimientos.length === 0) {
    return [{ fecha: hoyISO(), inventario: stockActual }];
  }

  const ordenados = [...movimientos].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha),
  );

  // El inventario inicial se deduce "rebobinando" todos los movimientos desde
  // el stock actual. Con datos consistentes la serie vuelve a terminar en
  // `stockActual`; si el acotado a 0 llegara a activarse (solo es posible con
  // movimientos registrados con fecha retroactiva que alteran el orden
  // cronologico) el ultimo punto quedaria por encima del stock real.
  const efectoTotal = ordenados.reduce((acc, m) => acc + signo(m) * m.cantidad, 0);
  let inventario = stockActual - efectoTotal;

  const puntosPorFecha = new Map();
  for (const mov of ordenados) {
    inventario = Math.max(0, inventario + signo(mov) * mov.cantidad);
    puntosPorFecha.set(fechaISO(mov.fecha), inventario); // valor de cierre del dia
  }

  return [...puntosPorFecha.entries()].map(([fecha, valor]) => ({
    fecha,
    inventario: valor,
  }));
}

function signo(movimiento) {
  return movimiento.tipo === 'ENTRADA' ? 1 : -1;
}

function fechaISO(fecha) {
  return new Date(fecha).toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
