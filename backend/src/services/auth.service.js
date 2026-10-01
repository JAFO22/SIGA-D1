import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export async function login({ nombre, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { nombre } });

  const passwordOk =
    usuario && (await bcrypt.compare(password, usuario.passwordHash));

  if (!usuario || !passwordOk) {
    throw new AppError('Usuario o contrasena incorrectos', 401);
  }

  const token = jwt.sign(
    { sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    env.jwt.secreto,
    { expiresIn: env.jwt.expiraEn },
  );

  return {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
  };
}

export async function registrar({ nombre, password, rol }) {
  const existe = await prisma.usuario.findUnique({ where: { nombre } });
  if (existe) {
    throw new AppError('Ya existe un usuario con ese nombre', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await prisma.usuario.create({
    data: { nombre, passwordHash, rol },
    select: { id: true, nombre: true, rol: true, createdAt: true },
  });

  return usuario;
}

export async function listarUsuarios() {
  return prisma.usuario.findMany({
    select: { id: true, nombre: true, rol: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

