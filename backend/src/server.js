import { crearApp } from './app.js';
import { env, usaSecretoInseguro } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';

const MARGEN_DE_CIERRE_MS = 10_000;

function sinCredenciales(url) {
  if (!url) return '(no configurada)';
  try {
    const { protocol, hostname, port, pathname } = new URL(url);
    return `${protocol}//${hostname}${port ? `:${port}` : ''}${pathname}`;
  } catch {
    return '(no legible)';
  }
}

const app = crearApp();
const servidor = app.listen(env.puerto);

servidor.on('listening', () => {
  const { diasRojo, diasAmarillo, ventasMuestra } = env.semaforo;

  logger.linea();
  logger.listo(`${logger.destacar('SIGA-D1 API')} escuchando en el puerto ${env.puerto}`);
  logger.info(`Entorno: ${env.entorno}`);
  logger.info(`Base de datos: ${sinCredenciales(env.databaseUrl)}`);
  logger.info(`Origenes permitidos: ${env.origenesPermitidos.join(', ')}`);
  logger.info(
    `Semaforo: rojo <= ${diasRojo} dias · amarillo <= ${diasAmarillo} dias · ` +
      `ritmo sobre las ultimas ${ventasMuestra} salidas`,
  );
  logger.linea();

  if (usaSecretoInseguro) {
    logger.aviso('JWT_SECRET es el valor de ejemplo. Defina uno propio antes de exponer la API.');
  }
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(
      `El puerto ${env.puerto} ya esta en uso. Cierre el proceso que lo ocupa o cambie PORT.`,
    );
  } else {
    logger.error('No se pudo iniciar el servidor', error);
  }
  process.exit(1);
});

let cerrando = false;

async function apagar(motivo, codigoDeSalida = 0) {
  if (cerrando) return;
  cerrando = true;

  logger.info(`${motivo} recibido. Cerrando conexiones...`);

  const salidaForzada = setTimeout(() => {
    logger.aviso('El cierre tardo demasiado. Forzando salida.');
    process.exit(1);
  }, MARGEN_DE_CIERRE_MS);
  salidaForzada.unref();

  servidor.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      logger.error('Fallo al cerrar la conexion con la base de datos', error);
    }
    logger.listo('Servidor detenido correctamente.');
    process.exit(codigoDeSalida);
  });
}

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));

process.on('unhandledRejection', (causa) => {
  logger.error('Promesa rechazada sin gestionar', causa);
  apagar('unhandledRejection', 1);
});

process.on('uncaughtException', (causa) => {
  logger.error('Excepcion no capturada', causa);
  apagar('uncaughtException', 1);
});
