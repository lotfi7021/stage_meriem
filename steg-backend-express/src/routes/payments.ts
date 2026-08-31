import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { PaymentEntity } from '../entities/payment.entity';
import { InvoiceEntity } from '../entities/invoice.entity';
import { computeInvoiceStatus } from '../utils/invoice-status';
import { generateSequentialId } from '../utils/id-generator';
import { authenticate, requirePermissions } from '../middleware/auth';

const router = Router();
const paymentsRepo = () => AppDataSource.getRepository(PaymentEntity);
const invoicesRepo = () => AppDataSource.getRepository(InvoiceEntity);

router.use(authenticate);

/** GET /payments */
router.get('/', requirePermissions('paiements:view'), async (_req: Request, res: Response) => {
  const payments = await paymentsRepo().find();
  res.json(payments);
});

/** GET /payments/:id */
router.get('/:id', requirePermissions('paiements:view'), async (req: Request, res: Response) => {
  const payment = await paymentsRepo().findOne({ where: { id: req.params.id } });
  if (!payment) {
    res.status(404).json({ statusCode: 404, message: `Paiement ${req.params.id} introuvable` });
    return;
  }
  res.json(payment);
});

/** POST /payments — crée le paiement ET recalcule la facture liée en transaction */
router.post('/', requirePermissions('paiements:manage'), async (req: Request, res: Response) => {
  try {
    const { factureId, montant, datePaiement, methode } = req.body ?? {};
    if (!factureId || !montant || !datePaiement || !methode) {
      res.status(400).json({ statusCode: 400, message: 'factureId, montant, datePaiement, methode requis' });
      return;
    }
    const validMethods = ['virement', 'especes', 'cheque', 'en_ligne'];
    if (!validMethods.includes(methode)) {
      res.status(400).json({ statusCode: 400, message: `methode invalide. Valeurs: ${validMethods.join(', ')}` });
      return;
    }

    const result = await AppDataSource.transaction(async (manager) => {
      const invoice = await manager.findOne(InvoiceEntity, { where: { id: factureId } });
      if (!invoice) throw new Error(`Facture ${factureId} introuvable`);

      const id = await generateSequentialId(AppDataSource, PaymentEntity, 'PAY');
      const payment = manager.create(PaymentEntity, { id, factureId, montant, datePaiement, methode });
      await manager.save(payment);

      invoice.montantPaye = Number(invoice.montantPaye) + Number(montant);
      invoice.statut = computeInvoiceStatus(invoice.montant, invoice.montantPaye, invoice.dateEcheance);
      await manager.save(invoice);

      return payment;
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error('Create payment error:', err);
    if (err.message?.includes('introuvable')) {
      res.status(404).json({ statusCode: 404, message: err.message });
      return;
    }
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

/** PATCH /payments/:id — modifie un paiement ET réajuste la facture par la différence */
router.patch('/:id', requirePermissions('paiements:manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { montant, datePaiement, methode } = req.body ?? {};

    const result = await AppDataSource.transaction(async (manager) => {
      const payment = await manager.findOne(PaymentEntity, { where: { id } });
      if (!payment) throw new Error(`Paiement ${id} introuvable`);

      const oldMontant = Number(payment.montant);
      const newMontant = montant !== undefined ? Number(montant) : oldMontant;
      const diff = newMontant - oldMontant;

      if (montant !== undefined) payment.montant = montant;
      if (datePaiement) payment.datePaiement = datePaiement;
      if (methode) payment.methode = methode;
      await manager.save(payment);

      if (diff !== 0) {
        const invoice = await manager.findOne(InvoiceEntity, { where: { id: payment.factureId } });
        if (invoice) {
          invoice.montantPaye = Math.max(0, Number(invoice.montantPaye) + diff);
          invoice.statut = computeInvoiceStatus(invoice.montant, invoice.montantPaye, invoice.dateEcheance);
          await manager.save(invoice);
        }
      }

      return payment;
    });

    res.json(result);
  } catch (err: any) {
    console.error('Update payment error:', err);
    if (err.message?.includes('introuvable')) {
      res.status(404).json({ statusCode: 404, message: err.message });
      return;
    }
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

/** DELETE /payments/:id — supprime le paiement ET retire son montant de la facture */
router.delete('/:id', requirePermissions('paiements:manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await AppDataSource.transaction(async (manager) => {
      const payment = await manager.findOne(PaymentEntity, { where: { id } });
      if (!payment) throw new Error(`Paiement ${id} introuvable`);

      const invoice = await manager.findOne(InvoiceEntity, { where: { id: payment.factureId } });
      await manager.remove(payment);

      if (invoice) {
        invoice.montantPaye = Math.max(0, Number(invoice.montantPaye) - Number(payment.montant));
        invoice.statut = computeInvoiceStatus(invoice.montant, invoice.montantPaye, invoice.dateEcheance);
        await manager.save(invoice);
      }
    });

    res.json({ deleted: true });
  } catch (err: any) {
    console.error('Delete payment error:', err);
    if (err.message?.includes('introuvable')) {
      res.status(404).json({ statusCode: 404, message: err.message });
      return;
    }
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

export default router;
