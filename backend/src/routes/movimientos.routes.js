import { Router } from 'express';
import { autenticar } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  crearMovimientoSchema,
  listarMovimientosQuery,
} from '../validators/movimiento.schema.js';
import * as movimientosController from '../controllers/movimientos.controller.js';

const router = Router();

router.use(autenticar);

// Empleado y Administrador pueden registrar y consultar movimientos.
router.get(
  '/',
  validate(listarMovimientosQuery, 'query'),
  movimientosController.listar,
);
router.post('/', validate(crearMovimientoSchema), movimientosController.registrar);

export default router;
