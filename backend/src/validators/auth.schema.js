import { z } from 'zod';
import { ROLES } from '../domain/constantes.js';

const rolesValidos = Object.values(ROLES);

export const loginSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre de usuario es obligatorio'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});

export const registroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(30, 'El nombre no puede superar los 30 caracteres'),
  password: z
    .string()
    .min(6, 'La contrasena debe tener al menos 6 caracteres')
    .max(72, 'La contrasena no puede superar los 72 caracteres'),
  rol: z.enum(rolesValidos, {
    errorMap: () => ({ message: `El rol debe ser uno de: ${rolesValidos.join(', ')}` }),
  }),
});
