import { z } from 'zod';

export const crearProveedorSchema = z.object({
  nombre: z.string().trim().min(2, 'Minimo 2 caracteres').max(120),
});

export const actualizarProveedorSchema = crearProveedorSchema;
