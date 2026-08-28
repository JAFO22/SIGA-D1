import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middlewares/validate.middleware.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { loginSchema } from '../validators/auth.schema.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Limita intentos de login para mitigar fuerza bruta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesion. Intente mas tarde.' },
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.get('/me', autenticar, authController.perfil);

export default router;
