import { crearApp } from './app.js';
import { env, usaSecretoInseguro } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';

const app = crearApp();
const servidor = app.listen(env.puerto);

servidor.on('listening', () => {
  const { diasRojo, diasAmarillo, ventasMuestra } = env.semaforo;

  logger.linea();
  logger.listo(`${logger.destacar('SIGA-D1 API')} escuchando en http://localhost:${env.puerto}`);
  logger.info(`Entorno: ${env.entorno}  ·  Base de datos: ${env.databaseUrl}`);
  logger.info(`CORS permitido para: ${env.corsOrigin}`);
  logger.info(
    `Semaforo: rojo <= ${diasRojo} dias  ·  amarillo <= ${diasAmarillo} dias  ` +
      `·  ritmo sobre las ultimas ${ventasMuestra} salidas`,
  );
  logger.linea(logger.atenuar('  Comprobar estado:  curl http://localhost:' + env.puerto + '/api/health'));
  logger.linea(logger.atenuar('  Cargar datos demo: npm run seed'));
  logger.linea();

  if (usaSecretoInseguro) {
    logger.aviso(
      'JWT_SECRET es el valor de ejemplo. Sirve para el prototipo, pero define ' +
        'uno propio en .env antes de exponer la API.',
    );
  }
});

// Diagnostico claro cuando el puerto ya esta ocupado: es el fallo mas frecuente
// al arrancar y el mensaje por defecto de Node no dice como resolverlo.
servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(
      `El puerto ${env.puerto} ya esta en uso. Cierre el proceso que lo ocupa ` +
        'o cambie PORT en el archivo .env',
    );
  } else {
    logger.error('No se pudo iniciar el servidor', error);
  }
  process.exit(1);
});

/**
 * Cierre ordenado: deja de aceptar peticiones, espera a las que estan en curso
 * y libera el pool de Prisma. Si algo se queda colgado, se fuerza la salida a
 * los 10 s para no dejar el proceso zombi.
 */
let cerrando = false;
async function apagar(senal) {
  if (cerrando) return;
  cerrando = true;

  logger.linea();
  logger.info(`${senal} recibido. Cerrando conexiones...`);

  const forzar = setTimeout(() => {
    logger.aviso('El cierre tardo demasiado. Forzando salida.');
    process.exit(1);
  }, 10_000);
  forzar.unref();

  servidor.close(async () => {
    await prisma.$disconnect();
    logger.listo('Servidor detenido correctamente.');
    process.exit(0);
  });
}

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));

// Una promesa rechazada sin capturar deja la app en estado indefinido: se
// registra con detalle y se cierra de forma ordenada.
process.on('unhandledRejection', (causa) => {
  logger.error('Promesa rechazada sin gestionar', causa);
  apagar('unhandledRejection');
});
