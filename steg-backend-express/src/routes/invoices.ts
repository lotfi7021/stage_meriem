import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { InvoiceEntity } from '../entities/invoice.entity';
import { computeInvoiceStatus } from '../utils/invoice-status';
import { generateSequentialId } from '../utils/id-generator';
import { authenticate, requirePermissions } from '../middleware/auth';

const router = Router();
const invoicesRepo = () => AppDataSource.getRepository(InvoiceEntity);

router.use(authenticate);

/** GET /invoices — avec filtres optionnels */
router.get('/', requirePermissions('factures:view'), async (req: Request, res: Response) => {
  const { statut, clientId, dateDebut, dateFin } = req.query;
  const qb = invoicesRepo().createQueryBuilder('i');
  if (statut) qb.andWhere('i.statut = :statut', { statut });
  if (clientId) qb.andWhere('i.clientId = :clientId', { clientId });
  if (dateDebut) qb.andWhere('i.dateEmission >= :dateDebut', { dateDebut });
  if (dateFin) qb.andWhere('i.dateEmission <= :dateFin', { dateFin });
  const invoices = await qb.getMany();
  res.json(invoices);
});

/** GET /invoices/:id */
router.get('/:id', requirePermissions('factures:view'), async (req: Request, res: Response) => {
  const invoice = await invoicesRepo().findOne({ where: { id: req.params.id } });
  if (!invoice) {
    res.status(404).json({ statusCode: 404, message: `Facture ${req.params.id} introuvable` });
    return;
  }
  res.json(invoice);
});

/** POST /invoices */
router.post('/', requirePermissions('factures:manage'), async (req: Request, res: Response) => {
  try {
    const { clientId, montant, dateEmission, dateEcheance, montantPaye } = req.body ?? {};
    if (!clientId || !montant || !dateEmission || !dateEcheance) {
      res.status(400).json({ statusCode: 400, message: 'clientId, montant, dateEmission, dateEcheance requis' });
      return;
    }
    if (typeof montant !== 'number' || montant <= 0) {
      res.status(400).json({ statusCode: 400, message: 'montant doit être > 0' });
      return;
    }

    const id = await generateSequentialId(AppDataSource, InvoiceEntity, 'FAC');
    const statut = computeInvoiceStatus(montant, montantPaye ?? 0, dateEcheance);
    const invoice = invoicesRepo().create({
      id,
      clientId,
      montant,
      dateEmission,
      dateEcheance,
      montantPaye: montantPaye ?? 0,
      statut,
    });
    const saved = await invoicesRepo().save(invoice);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

/** PATCH /invoices/:id */
router.patch('/:id', requirePermissions('factures:manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await invoicesRepo().findOne({ where: { id } });
    if (!invoice) {
      res.status(404).json({ statusCode: 404, message: `Facture ${id} introuvable` });
      return;
    }

    const { clientId, montant, dateEmission, dateEcheance, montantPaye } = req.body ?? {};
    if (clientId) invoice.clientId = clientId;
    if (montant !== undefined) {
      if (typeof montant !== 'number' || montant <= 0) {
        res.status(400).json({ statusCode: 400, message: 'montant doit être un nombre positif' });
        return;
      }
      invoice.montant = montant;
    }
    if (dateEmission) invoice.dateEmission = dateEmission;
    if (dateEcheance) invoice.dateEcheance = dateEcheance;
    if (montantPaye !== undefined) {
      if (typeof montantPaye !== 'number' || montantPaye < 0) {
        res.status(400).json({ statusCode: 400, message: 'montantPaye doit être un nombre positif ou zéro' });
        return;
      }
      if (montantPaye > invoice.montant) {
        res.status(400).json({ statusCode: 400, message: 'montantPaye ne peut dépasser le montant' });
        return;
      }
      invoice.montantPaye = montantPaye;
    }

    invoice.statut = computeInvoiceStatus(invoice.montant, invoice.montantPaye, invoice.dateEcheance);
    const saved = await invoicesRepo().save(invoice);
    res.json(saved);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

/** DELETE /invoices/:id */
router.delete('/:id', requirePermissions('factures:manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await invoicesRepo().findOne({ where: { id } });
    if (!invoice) {
      res.status(404).json({ statusCode: 404, message: `Facture ${id} introuvable` });
      return;
    }
    await invoicesRepo().remove(invoice);
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

export default router;
