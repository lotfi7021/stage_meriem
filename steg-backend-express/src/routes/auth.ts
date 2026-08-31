import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

/** POST /auth/login - Authentification */
router.post('/login', AuthController.login);

/** POST /auth/logout - Déconnexion */
router.post('/logout', authenticate, AuthController.logout);

/** GET /auth/me - Informations utilisateur connecté */
router.get('/me', authenticate, AuthController.me);

export default router;
