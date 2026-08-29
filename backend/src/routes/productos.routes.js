import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ROLES } from '../domain/constantes.js';
import { idParamSchema } from '../validators/comunes.schema.js';
import {
  crearProductoSchema,
  actualizarProductoSchema,
} from '../validators/producto.schema.js';
import * as productosController from '../controllers/productos.controller.js';

const router = Router();

router.use(autenticar);

router.get('/', productosController.listar);
router.get('/:id', validate(idParamSchema, 'params'), productosController.obtener);

// El catalogo (crear/editar/borrar productos) es exclusivo del ADMINISTRADOR.
router.post(
  '/',
  autorizar(ROLES.ADMINISTRADOR),
  validate(crearProductoSchema),
  productosController.crear,
);
router.put(
  '/:id',
  autorizar(ROLES.ADMINISTRADOR),
  validate(idParamSchema, 'params'),
  validate(actualizarProductoSchema),
  productosController.actualizar,
);
router.delete(
  '/:id',
  autorizar(ROLES.ADMINISTRADOR),
  validate(idParamSchema, 'params'),
  productosController.eliminar,
);

export default router;
