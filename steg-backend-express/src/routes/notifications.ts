import { Router } from 'express';
import { authenticate, requirePermissions } from '../middleware/auth';
import { NotificationsController } from '../controllers/notifications.controller';

const router = Router();

router.use(authenticate);
router.use(requirePermissions('notifications:view'));

/** GET /notifications - Récupère toutes les notifications */
router.get('/', NotificationsController.getAllNotifications);

export default router;
