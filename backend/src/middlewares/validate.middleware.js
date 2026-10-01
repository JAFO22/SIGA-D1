export const validate =
  (schema, fuente = 'body') =>
  (req, _res, next) => {
    const resultado = schema.safeParse(req[fuente]);
    if (!resultado.success) return next(resultado.error);

    req[fuente] = resultado.data;
    next();
  };
