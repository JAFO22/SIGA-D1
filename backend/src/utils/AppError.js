// Error de negocio "esperado" (producto inexistente, stock insuficiente, etc.).
// Lo captura el middleware de errores y lo convierte en una respuesta HTTP con
// el codigo adecuado, sin volcar el stack trace al cliente.

export class AppError extends Error {
  /**
   * @param {string} mensaje  texto apto para mostrar al usuario
   * @param {number} statusCode  codigo HTTP (por defecto 400)
   * @param {unknown} [detalles]  informacion adicional opcional
   */
  constructor(mensaje, statusCode = 400, detalles = undefined) {
    super(mensaje);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.detalles = detalles;
    this.esOperacional = true; // distingue de un bug no controlado
    Error.captureStackTrace?.(this, AppError);
  }
}
