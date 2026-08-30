// Constantes de dominio compartidas por toda la aplicacion.
// Al no existir enums en SQLite, estas son la unica fuente de verdad de los
// valores permitidos (se usan tanto en validacion Zod como en la logica).

export const ROLES = Object.freeze({
  EMPLEADO: 'EMPLEADO',
  ADMINISTRADOR: 'ADMINISTRADOR',
});

export const TIPO_MOVIMIENTO = Object.freeze({
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA',
});

export const ESTADO_SEMAFORO = Object.freeze({
  VERDE: 'VERDE',
  AMARILLO: 'AMARILLO',
  ROJO: 'ROJO',
});
