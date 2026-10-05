export class AppError extends Error {
  constructor(mensaje, statusCode = 400, detalles = undefined) {
    super(mensaje);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.detalles = detalles;
    this.esOperacional = true;
    Error.captureStackTrace?.(this, AppError);
  }
}
