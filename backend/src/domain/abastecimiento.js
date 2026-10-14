import { diaDe, sumarDias, diasCalendarioEntre } from './fechas.js';
import { media, desviacionEstandar, inversaNormalEstandar } from './estadistica.js';

function redondearADosDecimales(numero) {
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}

function tieneFechaDePedido(entrada) {
  return entrada.fechaPedido != null;
}

export function calcularTiempoEntrega(entradas) {
  const tiempos = (entradas || [])
    .filter(tieneFechaDePedido)
    .map((e) => diasCalendarioEntre(e.fechaPedido, e.fecha));

  if (tiempos.length === 0) return null;

  return {
    promedio: media(tiempos),
    desviacion: desviacionEstandar(tiempos),
    muestras: tiempos.length,
  };
}

export function ventasPorDia(movimientosSalida, diasVentana, hoy) {
  const ultimoDia = diaDe(hoy);
  const primerDiaPosible = sumarDias(ultimoDia, -(diasVentana - 1));

  const unidadesPorDia = new Map();
  for (const m of movimientosSalida || []) {
    const dia = diaDe(m.fecha);
    if (dia < primerDiaPosible || dia > ultimoDia) continue;
    unidadesPorDia.set(dia, (unidadesPorDia.get(dia) ?? 0) + m.cantidad);
  }
  if (unidadesPorDia.size === 0) return [];

  const primerDiaConVentas = [...unidadesPorDia.keys()].sort()[0];
  const serie = [];
  for (let dia = primerDiaConVentas; dia <= ultimoDia; dia = sumarDias(dia, 1)) {
    serie.push(unidadesPorDia.get(dia) ?? 0);
  }
  return serie;
}

export function calcularStockSeguridad({ ventasDiarias, tiempoEntrega, nivelServicio }) {
  if (!tiempoEntrega) return null;

  const z = inversaNormalEstandar(nivelServicio);
  const demanda = media(ventasDiarias);
  const desviacionDemanda = desviacionEstandar(ventasDiarias);
  const { promedio: plazo, desviacion: desviacionPlazo } = tiempoEntrega;

  const varianzaDuranteElPlazo =
    plazo * desviacionDemanda ** 2 + demanda ** 2 * desviacionPlazo ** 2;

  return {
    unidades: Math.ceil(z * Math.sqrt(varianzaDuranteElPlazo)),
    z: redondearADosDecimales(z),
    demandaMedia: redondearADosDecimales(demanda),
    desviacionDemanda: redondearADosDecimales(desviacionDemanda),
  };
}
