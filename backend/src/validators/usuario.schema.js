import { z } from 'zod';
import { ROLES } from '../domain/constantes.js';

const BYTES_MAXIMOS_DE_BCRYPT = 72;
const rolesValidos = Object.values(ROLES);

export const crearUsuarioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(30, 'El nombre no puede superar los 30 caracteres'),
  password: z
    .string()
    .min(6, 'La contrasena debe tener al menos 6 caracteres')
    .refine((c) => Buffer.byteLength(c) <= BYTES_MAXIMOS_DE_BCRYPT, {
      message: 'La contrasena es demasiado larga',
    }),
  rol: z.enum(rolesValidos, {
    errorMap: () => ({ message: `El rol debe ser uno de: ${rolesValidos.join(', ')}` }),
  }),
});
