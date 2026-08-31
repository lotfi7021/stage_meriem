import { Router } from 'express';
import { authenticate, requirePermissions } from '../middleware/auth';
import { UsersController } from '../controllers/users.controller';

const router = Router();

router.use(authenticate);
router.use(requirePermissions('users:manage'));

/** GET /users - Récupère tous les utilisateurs */
router.get('/', UsersController.getAllUsers);

/** POST /users - Crée un nouvel utilisateur */
router.post('/', UsersController.createUser);

/** PATCH /users/:id - Met à jour un utilisateur */
router.patch('/:id', UsersController.updateUser);

/** DELETE /users/:id - Supprime un utilisateur */
router.delete('/:id', UsersController.deleteUser);

export default router;
