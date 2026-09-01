import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { ROLES } from '../domain/constantes.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

// El dashboard consolidado es una herramienta de decision del ADMINISTRADOR.
router.get(
  '/',
  autenticar,
  autorizar(ROLES.ADMINISTRADOR),
  dashboardController.resumen,
);

export default router;
