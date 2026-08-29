import { z } from 'zod';

const nombre = z.string().trim().min(2, 'Minimo 2 caracteres').max(120);
const categoria = z.string().trim().min(2, 'Minimo 2 caracteres').max(80);
const proveedorId = z.coerce
  .number()
  .int()
  .positive('Seleccione un proveedor valido');

export const crearProductoSchema = z.object({
  nombre,
  categoria,
  proveedorId,
  // Inventario inicial (saldo de apertura). A partir de aqui el stock solo
  // cambia registrando movimientos.
  stockActual: z.coerce
    .number()
    .int('El stock inicial debe ser un numero entero')
    .min(0, 'El stock inicial no puede ser negativo')
    .max(1_000_000, 'El stock inicial supera el maximo permitido')
    .default(0),
});

// En edicion solo estos campos son modificables.
const CAMPOS_EDITABLES = ['nombre', 'categoria', 'proveedorId'];

/**
 * Actualizacion de producto.
 *
 * `stockActual` NO es editable: el inventario es un valor derivado que solo se
 * mueve registrando ENTRADA / SALIDA. Editarlo a mano romperia el modelo
 * Stock & Flow (I(t+1) = I(t) + R(t) - V(t)) y dejaria el historial sin cuadrar.
 *
 * Se valida con `passthrough` + `superRefine` (en vez de `strict`) para poder
 * dar un mensaje distinto segun el error, y se recortan los campos al final
 * para que al servicio solo lleguen los editables.
 */
export const actualizarProductoSchema = z
  .object({
    nombre: nombre.optional(),
    categoria: categoria.optional(),
    proveedorId: proveedorId.optional(),
  })
  .passthrough()
  .superRefine((datos, ctx) => {
    const claves = Object.keys(datos);

    if (claves.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe enviar al menos un campo para actualizar',
      });
      return;
    }

    if (claves.includes('stockActual')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stockActual'],
        message:
          'El inventario no se edita a mano: registre un movimiento de ENTRADA o SALIDA',
      });
    }

    const noPermitidos = claves.filter(
      (k) => !CAMPOS_EDITABLES.includes(k) && k !== 'stockActual',
    );
    if (noPermitidos.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Campo(s) no editable(s): ${noPermitidos.join(', ')}`,
      });
    }
  })
  // Al servicio solo llegan los campos editables, nunca uno colado en el body.
  .transform((datos) =>
    Object.fromEntries(
      Object.entries(datos).filter(([clave]) => CAMPOS_EDITABLES.includes(clave)),
    ),
  );
