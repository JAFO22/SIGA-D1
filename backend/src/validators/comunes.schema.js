import { z } from 'zod';

// Parametro :id de la URL (llega como string, se convierte a entero positivo).
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un entero positivo'),
});
