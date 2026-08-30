// Logger minimo y legible. Sin dependencias: la salida de un prototipo debe
// entenderse de un vistazo en la terminal, no requerir un agregador de logs.
//
//   logger.listo('API lista en http://localhost:4000')
//   logger.aviso('JWT_SECRET es el de ejemplo')
//   logger.error('Fallo al conectar', err)
//
// En produccion se desactivan los colores (los codigos ANSI ensucian los
// archivos de log y las plataformas de despliegue).

const colorHabilitado = process.env.NODE_ENV !== 'production' && process.stdout.isTTY;

const c = (codigo) => (texto) => (colorHabilitado ? `\x1b[${codigo}m${texto}\x1b[0m` : texto);
const gris = c('90');
const verde = c('32');
const amarillo = c('33');
const rojo = c('31');
const cian = c('36');
const negrita = c('1');

/** Hora local corta (HH:MM:SS) para ubicar cada linea en el tiempo. */
function hora() {
  return new Date().toLocaleTimeString('es-CO', { hour12: false });
}

function escribir(salida, simbolo, etiqueta, mensaje) {
  salida(`${gris(hora())} ${simbolo} ${etiqueta} ${mensaje}`);
}

export const logger = {
  info: (mensaje) => escribir(console.log, cian('›'), cian('info '), mensaje),
  listo: (mensaje) => escribir(console.log, verde('✓'), verde('listo'), mensaje),
  aviso: (mensaje) => escribir(console.warn, amarillo('▲'), amarillo('aviso'), mensaje),

  /**
   * Un error siempre explica QUE fallo. El detalle tecnico (stack) solo se
   * imprime fuera de produccion, para no filtrar rutas internas del servidor.
   */
  error: (mensaje, causa) => {
    escribir(console.error, rojo('✗'), rojo('error'), mensaje);
    if (!causa) return;
    const detalle = causa instanceof Error ? causa.stack || causa.message : String(causa);
    console.error(gris(process.env.NODE_ENV === 'production' ? String(causa) : detalle));
  },

  /** Linea suelta sin prefijo, para banners y separadores. */
  linea: (texto = '') => console.log(texto),
  destacar: (texto) => negrita(texto),
  atenuar: (texto) => gris(texto),
};
