import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { cifrarContrasena } from '../lib/contrasenas.js';
import { AppError } from '../utils/AppError.js';

const CAMPOS_PUBLICOS = { id: true, nombre: true, rol: true, createdAt: true };

const esNombreDuplicado = (error) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export function listarUsuarios() {
  return prisma.usuario.findMany({ select: CAMPOS_PUBLICOS, orderBy: { createdAt: 'desc' } });
}

export async function crearUsuario({ nombre, password, rol }) {
  const passwordHash = await cifrarContrasena(password);

  try {
    return await prisma.usuario.create({
      data: { nombre, passwordHash, rol },
      select: CAMPOS_PUBLICOS,
    });
  } catch (error) {
    if (esNombreDuplicado(error)) throw new AppError('Ya existe un usuario con ese nombre', 409);
    throw error;
  }
}
