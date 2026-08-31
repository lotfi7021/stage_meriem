import { Router } from 'express';
import { authenticate, requirePermissions } from '../middleware/auth';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);
router.use(requirePermissions('dashboard:view'));

/** GET /dashboard/kpis - Récupère les indicateurs clés de performance */
router.get('/kpis', DashboardController.getKpis);

/** GET /dashboard/monthly-series - Récupère les données mensuelles */
router.get('/monthly-series', DashboardController.getMonthlySeries);

/** GET /dashboard/status-breakdown - Récupère la répartition par statut */
router.get('/status-breakdown', DashboardController.getStatusBreakdown);

export default router;
