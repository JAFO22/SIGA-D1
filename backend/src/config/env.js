// Carga y valida la configuracion desde variables de entorno.
// Toda la app lee la config desde aqui; nunca desde process.env directamente.
//
// Se valida al arrancar (fail-fast): es preferible que el servidor no levante
// a que funcione con una configuracion silenciosamente incorrecta.

import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET_EJEMPLO = 'cambia-esto-por-un-secreto-largo-y-aleatorio';
const LONGITUD_MINIMA_SECRETO = 32;

function leerNumero(nombre, porDefecto) {
  const bruto = process.env[nombre];
  if (bruto === undefined || bruto === '') return porDefecto;
  const valor = Number(bruto);
  if (!Number.isFinite(valor)) {
    throw new Error(
      `Configuracion invalida: ${nombre} debe ser numerica (se recibio "${bruto}")`,
    );
  }
  return valor;
}

function leerNumeroPositivo(nombre, porDefecto) {
  const valor = leerNumero(nombre, porDefecto);
  if (valor <= 0) {
    throw new Error(`Configuracion invalida: ${nombre} debe ser mayor que cero`);
  }
  return valor;
}

const entorno = process.env.NODE_ENV || 'development';
const esProduccion = entorno === 'production';
const secreto = process.env.JWT_SECRET || JWT_SECRET_EJEMPLO;

// El secreto de ejemplo sirve para arrancar el prototipo sin configurar nada,
// pero en produccion firmaria tokens que cualquiera puede falsificar.
export const usaSecretoInseguro =
  secreto === JWT_SECRET_EJEMPLO || secreto.length < LONGITUD_MINIMA_SECRETO;

if (esProduccion && usaSecretoInseguro) {
  throw new Error(
    'Configuracion insegura: defina JWT_SECRET con una cadena aleatoria de al ' +
      `menos ${LONGITUD_MINIMA_SECRETO} caracteres antes de arrancar en produccion.`,
  );
}

const diasAmarillo = leerNumeroPositivo('SEMAFORO_DIAS_AMARILLO', 7);
const diasRojo = leerNumeroPositivo('SEMAFORO_DIAS_ROJO', 3);

// Si el umbral rojo no fuera menor que el amarillo, el estado AMARILLO seria
// inalcanzable (se evalua rojo primero) y el semaforo perderia un nivel.
if (diasRojo >= diasAmarillo) {
  throw new Error(
    `Configuracion invalida: SEMAFORO_DIAS_ROJO (${diasRojo}) debe ser menor ` +
      `que SEMAFORO_DIAS_AMARILLO (${diasAmarillo}).`,
  );
}

export const env = Object.freeze({
  puerto: leerNumeroPositivo('PORT', 4000),
  entorno,
  esProduccion,
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwt: {
    secreto,
    expiraEn: process.env.JWT_EXPIRES_IN || '8h',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Reglas de negocio configurables (semaforo de riesgo)
  semaforo: Object.freeze({
    diasAmarillo,
    diasRojo,
    ventasMuestra: leerNumeroPositivo('VENTAS_MUESTRA', 5),
  }),
});
