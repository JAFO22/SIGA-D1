import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ROLES } from '../domain/constantes.js';
import { idParamSchema } from '../validators/comunes.schema.js';
import {
  crearProveedorSchema,
  actualizarProveedorSchema,
} from '../validators/proveedor.schema.js';
import * as proveedoresController from '../controllers/proveedores.controller.js';

const router = Router();

router.use(autenticar);

router.get(
  '/confiabilidad',
  autorizar(ROLES.ADMINISTRADOR),
  proveedoresController.confiabilidad,
);
router.get(
  '/:id/historial',
  autorizar(ROLES.ADMINISTRADOR),
  validate(idParamSchema, 'params'),
  proveedoresController.historial,
);

router.get('/', proveedoresController.listar);
router.get('/:id', validate(idParamSchema, 'params'), proveedoresController.obtener);

router.post(
  '/',
  autorizar(ROLES.ADMINISTRADOR),
  validate(crearProveedorSchema),
  proveedoresController.crear,
);
router.put(
  '/:id',
  autorizar(ROLES.ADMINISTRADOR),
  validate(idParamSchema, 'params'),
  validate(actualizarProveedorSchema),
  proveedoresController.actualizar,
);
router.delete(
  '/:id',
  autorizar(ROLES.ADMINISTRADOR),
  validate(idParamSchema, 'params'),
  proveedoresController.eliminar,
);

export default router;
