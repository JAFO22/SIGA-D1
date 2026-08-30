import { z } from 'zod';
import { TIPO_MOVIMIENTO } from '../domain/constantes.js';

// Tope de seguridad: una tienda de barrio no mueve mas de esto en un registro.
// Evita que un error de digitacion (un cero de mas) corrompa el inventario.
const CANTIDAD_MAXIMA = 100_000;

const cantidad = z.coerce
  .number()
  .int('La cantidad debe ser un numero entero')
  .positive('La cantidad debe ser mayor que cero')
  .max(CANTIDAD_MAXIMA, `La cantidad no puede superar ${CANTIDAD_MAXIMA} unidades`);

export const crearMovimientoSchema = z
  .object({
    productoId: z.coerce.number().int().positive('Seleccione un producto valido'),
    tipo: z.enum([TIPO_MOVIMIENTO.ENTRADA, TIPO_MOVIMIENTO.SALIDA], {
      errorMap: () => ({ message: 'El tipo debe ser ENTRADA o SALIDA' }),
    }),
    cantidad,
    // Solo para ENTRADA: lo que se le pidio al proveedor.
    cantidadSolicitada: cantidad.optional(),
    // Fecha opcional; por defecto "ahora". No se aceptan fechas futuras: el
    // ritmo de venta y la cobertura en dias se calculan sobre el pasado, y un
    // movimiento "del futuro" distorsionaria ambos y la serie historica.
    fecha: z.coerce
      .date()
      .refine((f) => f.getTime() <= Date.now(), {
        message: 'La fecha no puede estar en el futuro',
      })
      .optional(),
  })
  .refine(
    (d) => d.tipo === TIPO_MOVIMIENTO.ENTRADA || d.cantidadSolicitada === undefined,
    {
      path: ['cantidadSolicitada'],
      message: 'La cantidad solicitada solo aplica a movimientos de ENTRADA',
    },
  );

export const listarMovimientosQuery = z.object({
  productoId: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().positive().max(200).optional(),
});
