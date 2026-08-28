// Valida (y normaliza) una parte de la peticion contra un esquema Zod.
// Si algo falla, delega en el middleware de errores, que responde 422.
// No confiamos en la validacion del frontend: TODO endpoint que reciba datos
// pasa por aqui.

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'params'|'query'} fuente
 */
export const validate =
  (schema, fuente = 'body') =>
  (req, _res, next) => {
    const resultado = schema.safeParse(req[fuente]);
    if (!resultado.success) return next(resultado.error);
    // Se reemplaza por el dato ya parseado/tipado (coerciones, defaults, trim).
    req[fuente] = resultado.data;
    next();
  };
