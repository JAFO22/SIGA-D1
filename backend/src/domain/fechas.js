const ZONA_HORARIA_DE_LA_TIENDA = 'America/Bogota';
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const calendarioDeLaTienda = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA_DE_LA_TIENDA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function diaDe(fecha) {
  const partes = Object.fromEntries(
    calendarioDeLaTienda.formatToParts(new Date(fecha)).map(({ type, value }) => [type, value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}`;
}

function numeroDeDia(fecha) {
  return Date.parse(diaDe(fecha)) / MILISEGUNDOS_POR_DIA;
}

export function diasCalendarioAbarcados(fechas) {
  const dias = fechas.map(numeroDeDia);
  return Math.max(...dias) - Math.min(...dias) + 1;
}
