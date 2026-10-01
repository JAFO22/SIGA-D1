import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middlewares/validate.middleware.js';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { loginSchema, registroSchema } from '../validators/auth.schema.js';
import { ROLES } from '../domain/constantes.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesion. Intente mas tarde.' },
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.get('/me', autenticar, authController.perfil);

router.post(
  '/registro',
  autenticar,
  autorizar(ROLES.ADMINISTRADOR),
  validate(registroSchema),
  authController.registrar,
);

router.get(
  '/usuarios',
  autenticar,
  autorizar(ROLES.ADMINISTRADOR),
  authController.listarUsuarios,
);

export default router;

