import { Router } from 'express';
import { authenticate, requirePermissions } from '../middleware/auth';
import { PaymentsController } from '../controllers/payments.controller';

const router = Router();

router.use(authenticate);

/** GET /payments - Récupère tous les paiements */
router.get('/', requirePermissions('paiements:view'), PaymentsController.getAllPayments);

/** GET /payments/:id - Récupère un paiement par son ID */
router.get('/:id', requirePermissions('paiements:view'), PaymentsController.getPaymentById);

/** POST /payments - Crée un nouveau paiement et recalcule la facture */
router.post('/', requirePermissions('paiements:manage'), PaymentsController.createPayment);

/** PATCH /payments/:id - Met à jour un paiement et réajuste la facture */
router.patch('/:id', requirePermissions('paiements:manage'), PaymentsController.updatePayment);

/** DELETE /payments/:id - Supprime un paiement et retire son montant de la facture */
router.delete('/:id', requirePermissions('paiements:manage'), PaymentsController.deletePayment);

export default router;
