import { Router } from 'express';
import { authenticate, requirePermissions } from '../middleware/auth';
import { RiskScoringController } from '../controllers/risk-scoring.controller';

const router = Router();

router.use(authenticate);
router.use(requirePermissions('risques:view'));

/** GET /risk-scores - Récupère tous les scores de risque */
router.get('/', RiskScoringController.getAllRiskScores);

/** GET /risk-scores/:clientId - Récupère le score de risque d'un client */
router.get('/:clientId', RiskScoringController.getRiskScoreByClient);

export default router;
