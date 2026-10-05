const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export function diaDe(fecha) {
  return new Date(fecha).toISOString().slice(0, 10);
}

function numeroDeDia(fecha) {
  return Math.floor(new Date(fecha).getTime() / MILISEGUNDOS_POR_DIA);
}

export function diasCalendarioAbarcados(fechas) {
  const dias = fechas.map(numeroDeDia);
  return Math.max(...dias) - Math.min(...dias) + 1;
}
