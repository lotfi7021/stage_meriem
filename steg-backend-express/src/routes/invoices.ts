import { Router } from 'express';
import { authenticate, requirePermissions } from '../middleware/auth';
import { InvoicesController } from '../controllers/invoices.controller';

const router = Router();

router.use(authenticate);

/** GET /invoices - Récupère toutes les factures avec filtres optionnels */
router.get('/', requirePermissions('factures:view'), InvoicesController.getAllInvoices);

/** GET /invoices/:id - Récupère une facture par son ID */
router.get('/:id', requirePermissions('factures:view'), InvoicesController.getInvoiceById);

/** POST /invoices - Crée une nouvelle facture */
router.post('/', requirePermissions('factures:manage'), InvoicesController.createInvoice);

/** PATCH /invoices/:id - Met à jour une facture existante */
router.patch('/:id', requirePermissions('factures:manage'), InvoicesController.updateInvoice);

/** DELETE /invoices/:id - Supprime une facture */
router.delete('/:id', requirePermissions('factures:manage'), InvoicesController.deleteInvoice);

export default router;
