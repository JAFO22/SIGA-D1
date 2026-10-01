const usarColores = process.env.NODE_ENV !== 'production' && Boolean(process.stdout.isTTY);

const colorear = (codigo) => (texto) =>
  usarColores ? `\x1b[${codigo}m${texto}\x1b[0m` : texto;

const gris = colorear('90');
const verde = colorear('32');
const amarillo = colorear('33');
const rojo = colorear('31');
const cian = colorear('36');
const negrita = colorear('1');

function marcaDeTiempo() {
  return new Date().toISOString().slice(11, 19);
}

function escribir(salida, simbolo, etiqueta, mensaje) {
  salida(`${gris(marcaDeTiempo())} ${simbolo} ${etiqueta} ${mensaje}`);
}

function describirCausa(causa) {
  if (causa instanceof Error) return causa.stack || `${causa.name}: ${causa.message}`;
  if (typeof causa === 'object') {
    try {
      return JSON.stringify(causa);
    } catch {
      return String(causa);
    }
  }
  return String(causa);
}

export const logger = {
  info: (mensaje) => escribir(console.log, cian('›'), cian('info '), mensaje),
  listo: (mensaje) => escribir(console.log, verde('✓'), verde('listo'), mensaje),
  aviso: (mensaje) => escribir(console.warn, amarillo('▲'), amarillo('aviso'), mensaje),

  error: (mensaje, causa) => {
    escribir(console.error, rojo('✗'), rojo('error'), mensaje);
    if (causa !== undefined) console.error(gris(describirCausa(causa)));
  },

  linea: (texto = '') => console.log(texto),
  destacar: (texto) => negrita(texto),
  atenuar: (texto) => gris(texto),
};
