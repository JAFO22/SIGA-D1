import dotenv from 'dotenv';

dotenv.config();

const SECRETO_DE_EJEMPLO = 'cambia-esto-por-un-secreto-largo-y-aleatorio';
const LONGITUD_MINIMA_DEL_SECRETO = 32;

function configuracionInvalida(mensaje) {
  return new Error(`Configuracion invalida: ${mensaje}`);
}

function leerNumeroPositivo(nombre, porDefecto) {
  const bruto = process.env[nombre];
  if (bruto === undefined || bruto === '') return porDefecto;

  const valor = Number(bruto);
  if (!Number.isFinite(valor)) {
    throw configuracionInvalida(`${nombre} debe ser numerica (se recibio "${bruto}")`);
  }
  if (valor <= 0) {
    throw configuracionInvalida(`${nombre} debe ser mayor que cero`);
  }
  return valor;
}

function conProtocolo(origen) {
  return /^https?:\/\//.test(origen) ? origen : `https://${origen}`;
}

function sinBarraFinal(origen) {
  return origen.replace(/\/+$/, '');
}

function leerListaDeOrigenes(nombre, porDefecto) {
  const bruto = process.env[nombre];
  if (!bruto) return porDefecto;

  const origenes = bruto
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean)
    .map((origen) => sinBarraFinal(conProtocolo(origen)));

  if (origenes.length === 0) {
    throw configuracionInvalida(`${nombre} no contiene ningun origen valido`);
  }
  return origenes;
}

const entorno = process.env.NODE_ENV || 'development';
const esProduccion = entorno === 'production';
const secretoJwt = process.env.JWT_SECRET || SECRETO_DE_EJEMPLO;

export const usaSecretoInseguro =
  secretoJwt === SECRETO_DE_EJEMPLO || secretoJwt.length < LONGITUD_MINIMA_DEL_SECRETO;

if (esProduccion && usaSecretoInseguro) {
  throw configuracionInvalida(
    'defina JWT_SECRET con una cadena aleatoria de al menos ' +
      `${LONGITUD_MINIMA_DEL_SECRETO} caracteres antes de arrancar en produccion`,
  );
}

if (esProduccion && !process.env.DATABASE_URL) {
  throw configuracionInvalida('DATABASE_URL es obligatoria en produccion');
}

const diasAmarillo = leerNumeroPositivo('SEMAFORO_DIAS_AMARILLO', 7);
const diasRojo = leerNumeroPositivo('SEMAFORO_DIAS_ROJO', 3);

if (diasRojo >= diasAmarillo) {
  throw configuracionInvalida(
    `SEMAFORO_DIAS_ROJO (${diasRojo}) debe ser menor que ` +
      `SEMAFORO_DIAS_AMARILLO (${diasAmarillo}); de lo contrario el nivel ` +
      'AMARILLO nunca se alcanzaria',
  );
}

export const env = Object.freeze({
  puerto: leerNumeroPositivo('PORT', 4000),
  entorno,
  esProduccion,
  databaseUrl: process.env.DATABASE_URL || '',

  jwt: Object.freeze({
    secreto: secretoJwt,
    expiraEn: process.env.JWT_EXPIRES_IN || '8h',
  }),

  origenesPermitidos: leerListaDeOrigenes('CORS_ORIGIN', ['http://localhost:5173']),
  saltosDeProxyConfiables: esProduccion ? 1 : 0,

  semaforo: Object.freeze({
    diasAmarillo,
    diasRojo,
    ventasMuestra: leerNumeroPositivo('VENTAS_MUESTRA', 5),
  }),

  historial: Object.freeze({
    movimientosRecientes: leerNumeroPositivo('DASHBOARD_MOVIMIENTOS_RECIENTES', 10),
    diasDeSerieInventario: leerNumeroPositivo('DASHBOARD_DIAS_HISTORICO', 90),
    puntosDeTendencia: leerNumeroPositivo('CONFIABILIDAD_PUNTOS_TENDENCIA', 60),
  }),
});
