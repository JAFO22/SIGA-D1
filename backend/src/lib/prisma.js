// Cliente Prisma unico para toda la aplicacion (evita abrir multiples pools de
// conexiones, sobre todo con el auto-recarga de `node --watch`).

import { PrismaClient } from '@prisma/client';

const globalParaPrisma = globalThis;

export const prisma =
  globalParaPrisma.__prisma ?? new PrismaClient({ log: ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') {
  globalParaPrisma.__prisma = prisma;
}
