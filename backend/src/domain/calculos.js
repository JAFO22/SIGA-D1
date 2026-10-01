import { ESTADO_SEMAFORO } from './constantes.js';

const SIN_VENTAS_RECIENTES = 0;
const COBERTURA_INDETERMINADA = null;

function redondearADosDecimales(numero) {
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}

function masRecientePrimero(a, b) {
  return new Date(b.fecha) - new Date(a.fecha);
}

export function estimarRitmoVentaDiario(movimientosSalida, muestra) {
  if (!Array.isArray(movimientosSalida) || movimientosSalida.length === 0) {
    return SIN_VENTAS_RECIENTES;
  }

  const tamanoDeMuestra = Math.max(1, Math.trunc(muestra) || 1);

  const recientes = [...movimientosSalida]
    .sort(masRecientePrimero)
    .slice(0, tamanoDeMuestra);

  const unidadesVendidas = recientes.reduce(
    (suma, m) => suma + m.cantidad,
    0,
  );

  const fechas = recientes.map((m) => new Date(m.fecha).getTime());

  const fechaMasReciente = Math.max(...fechas);
  const fechaMasAntigua = Math.min(...fechas);

  const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

  const diasTranscurridos =
    Math.floor(
      (fechaMasReciente - fechaMasAntigua) / MILISEGUNDOS_POR_DIA,
    ) + 1;

  const diasMuestra = Math.max(1, diasTranscurridos);

  return unidadesVendidas / diasMuestra;
}

function clasificarPorCobertura(diasRestantes, { diasRojo, diasAmarillo }) {
  if (diasRestantes <= diasRojo) return ESTADO_SEMAFORO.ROJO;
  if (diasRestantes <= diasAmarillo) return ESTADO_SEMAFORO.AMARILLO;
  return ESTADO_SEMAFORO.VERDE;
}

export function calcularSemaforo({ stockActual, movimientosSalida, config }) {
  const ritmoVentaDiario = redondearADosDecimales(
    estimarRitmoVentaDiario(movimientosSalida, config.ventasMuestra),
  );

  const sinExistencias = stockActual <= 0;
  if (sinExistencias) {
    return { estado: ESTADO_SEMAFORO.ROJO, diasRestantes: 0, ritmoVentaDiario };
  }

  if (ritmoVentaDiario === SIN_VENTAS_RECIENTES) {
    return {
      estado: ESTADO_SEMAFORO.VERDE,
      diasRestantes: COBERTURA_INDETERMINADA,
      ritmoVentaDiario,
    };
  }

  const diasRestantes = stockActual / ritmoVentaDiario;

  return {
    estado: clasificarPorCobertura(diasRestantes, config),
    diasRestantes: redondearADosDecimales(diasRestantes),
    ritmoVentaDiario,
  };
}

export function calcularCumplimiento(movimientosEntrada) {
  const conPedidoDeclarado = (movimientosEntrada || []).filter(
    (m) => m.cantidadSolicitada != null && m.cantidadSolicitada > 0,
  );

  if (conPedidoDeclarado.length === 0) {
    return { porcentaje: 100, totalPedido: 0, totalEntregado: 0 };
  }

  const totalPedido = conPedidoDeclarado.reduce((s, m) => s + m.cantidadSolicitada, 0);
  const totalEntregado = conPedidoDeclarado.reduce((s, m) => s + m.cantidad, 0);

  return {
    porcentaje: redondearADosDecimales((totalEntregado / totalPedido) * 100),
    totalPedido,
    totalEntregado,
  };
}
