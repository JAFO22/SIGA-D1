import { ESTADO_SEMAFORO } from './constantes.js';
import { diasCalendarioAbarcados } from './fechas.js';

const SIN_VENTAS_RECIENTES = 0;
const COBERTURA_INDETERMINADA = null;

function redondearADosDecimales(numero) {
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}

function masRecientePrimero(a, b) {
  return new Date(b.fecha) - new Date(a.fecha);
}

export function estimarRitmoVentaDiario(movimientosSalida, muestra, hoy) {
  if (!Array.isArray(movimientosSalida) || movimientosSalida.length === 0) {
    return SIN_VENTAS_RECIENTES;
  }

  const tamanoDeMuestra = Math.max(1, Math.trunc(muestra) || 1);
  const recientes = [...movimientosSalida].sort(masRecientePrimero).slice(0, tamanoDeMuestra);
  const unidadesVendidas = recientes.reduce((suma, m) => suma + m.cantidad, 0);
  const diasObservados = diasCalendarioAbarcados([...recientes.map((m) => m.fecha), hoy]);

  return unidadesVendidas / diasObservados;
}

function clasificarPorCobertura(diasRestantes, { diasRojo, diasAmarillo }) {
  if (diasRestantes <= diasRojo) return ESTADO_SEMAFORO.ROJO;
  if (diasRestantes <= diasAmarillo) return ESTADO_SEMAFORO.AMARILLO;
  return ESTADO_SEMAFORO.VERDE;
}

export function calcularSemaforo({ stockActual, movimientosSalida, config, hoy }) {
  const ritmo = estimarRitmoVentaDiario(movimientosSalida, config.ventasMuestra, hoy);
  const ritmoVentaDiario = redondearADosDecimales(ritmo);

  const sinExistencias = stockActual <= 0;
  if (sinExistencias) {
    return { estado: ESTADO_SEMAFORO.ROJO, diasRestantes: 0, ritmoVentaDiario };
  }

  if (ritmo === SIN_VENTAS_RECIENTES) {
    return {
      estado: ESTADO_SEMAFORO.VERDE,
      diasRestantes: COBERTURA_INDETERMINADA,
      ritmoVentaDiario,
    };
  }

  const diasRestantes = stockActual / ritmo;

  return {
    estado: clasificarPorCobertura(diasRestantes, config),
    diasRestantes: redondearADosDecimales(diasRestantes),
    ritmoVentaDiario,
  };
}

function entregadoSinExcedente(entrada) {
  return Math.min(entrada.cantidad, entrada.cantidadSolicitada);
}

export function calcularCumplimiento(movimientosEntrada) {
  const conPedidoDeclarado = (movimientosEntrada || []).filter(
    (m) => m.cantidadSolicitada != null && m.cantidadSolicitada > 0,
  );

  if (conPedidoDeclarado.length === 0) {
    return { porcentaje: 100, totalPedido: 0, totalEntregado: 0 };
  }

  const totalPedido = conPedidoDeclarado.reduce((s, m) => s + m.cantidadSolicitada, 0);
  const totalEntregado = conPedidoDeclarado.reduce((s, m) => s + entregadoSinExcedente(m), 0);

  return {
    porcentaje: redondearADosDecimales((totalEntregado / totalPedido) * 100),
    totalPedido,
    totalEntregado,
  };
}
