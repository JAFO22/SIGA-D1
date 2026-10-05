import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ROLES } from '../domain/constantes.js';
import { crearUsuarioSchema } from '../validators/usuario.schema.js';
import * as usuariosController from '../controllers/usuarios.controller.js';

const router = Router();

router.use(autenticar, autorizar(ROLES.ADMINISTRADOR));

router.get('/', usuariosController.listar);
router.post('/', validate(crearUsuarioSchema), usuariosController.crear);

export default router;
