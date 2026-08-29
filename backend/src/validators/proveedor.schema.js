import { z } from 'zod';

// Nota: `porcentajeCumplimiento` NO se acepta desde el cliente: es un valor
// calculado por el sistema a partir de los movimientos de ENTRADA.
export const crearProveedorSchema = z.object({
  nombre: z.string().trim().min(2, 'Minimo 2 caracteres').max(120),
});

export const actualizarProveedorSchema = crearProveedorSchema;
