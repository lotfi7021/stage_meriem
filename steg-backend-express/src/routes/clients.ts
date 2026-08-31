import { Router } from 'express';
import { authenticate, requirePermissions } from '../middleware/auth';
import { ClientsController } from '../controllers/clients.controller';



const router = Router();

router.use(authenticate);

/** GET /clients - Récupère tous les clients */
router.get('/', requirePermissions('clients:view'), ClientsController.getAllClients);

/** GET /clients/:id - Récupère un client par son ID */
router.get('/:id', requirePermissions('clients:view'), ClientsController.getClientById);

/** POST /clients - Crée un nouveau client */
router.post('/', requirePermissions('clients:manage'), ClientsController.createClient);

/** PATCH /clients/:id - Met à jour un client existant */
router.patch('/:id', requirePermissions('clients:manage'), ClientsController.updateClient);

/** DELETE /clients/:id - Supprime un client et ses données associées */
router.delete('/:id', requirePermissions('clients:manage'), ClientsController.deleteClient);

export default router;
