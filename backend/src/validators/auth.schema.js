import { z } from 'zod';

export const loginSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre de usuario es obligatorio'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});
