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

// IMPORTANTE: '/confiabilidad' va antes que '/:id'. Express resuelve por orden
// de declaracion; al reves, "confiabilidad" se leeria como un id y fallaria.

// La confiabilidad es informacion de decision comercial: solo ADMINISTRADOR.
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

// Lectura basica: cualquier usuario autenticado (el empleado necesita la lista
// de proveedores para dar de alta un producto o interpretar un movimiento).
router.get('/', proveedoresController.listar);
router.get('/:id', validate(idParamSchema, 'params'), proveedoresController.obtener);

// Escritura: solo ADMINISTRADOR.
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
