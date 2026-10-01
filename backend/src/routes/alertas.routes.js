import { Router } from 'express';
import { autenticar } from '../middlewares/auth.middleware.js';
import * as alertasController from '../controllers/alertas.controller.js';

const router = Router();

router.use(autenticar);

router.get('/', alertasController.listar);
router.get('/config', alertasController.config);

export default router;
