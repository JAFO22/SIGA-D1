// Envuelve un controlador async para que cualquier promesa rechazada llegue al
// middleware de errores central (sin repetir try/catch en cada endpoint).

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
