import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ClientEntity, SECTEURS_BY_TYPE, ClientType } from '../entities/client.entity';
import { InvoiceEntity } from '../entities/invoice.entity';
import { PaymentEntity } from '../entities/payment.entity';
import { generateSequentialId } from '../utils/id-generator';
import { authenticate, requirePermissions } from '../middleware/auth';

const router = Router();
const clientsRepo = () => AppDataSource.getRepository(ClientEntity);

router.use(authenticate);

/** GET /clients */
router.get('/', requirePermissions('clients:view'), async (_req: Request, res: Response) => {
  const clients = await clientsRepo().find();
  res.json(clients);
});

/** GET /clients/:id */
router.get('/:id', requirePermissions('clients:view'), async (req: Request, res: Response) => {
  const client = await clientsRepo().findOne({ where: { id: req.params.id } });
  if (!client) {
    res.status(404).json({ statusCode: 404, message: `Client ${req.params.id} introuvable` });
    return;
  }
  res.json(client);
});

/** POST /clients */
router.post('/', requirePermissions('clients:manage'), async (req: Request, res: Response) => {
  try {
    const { nom, type, secteur, adresse, ancienneteMois, retardsPasses, delaiMoyenJours } = req.body ?? {};
    if (!nom || !type || !secteur || !adresse) {
      res.status(400).json({ statusCode: 400, message: 'nom, type, secteur, adresse requis' });
      return;
    }

    const validTypes: ClientType[] = ['particulier', 'entreprise', 'administration'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ statusCode: 400, message: `type invalide. Valeurs: ${validTypes.join(', ')}` });
      return;
    }

    const secteurs = SECTEURS_BY_TYPE[type as ClientType];
    if (!secteurs.includes(secteur)) {
      res.status(400).json({
        statusCode: 400,
        message: `Secteur "${secteur}" invalide pour le type "${type}". Valeurs possibles: ${secteurs.join(', ')}`,
      });
      return;
    }

    const id = await generateSequentialId(AppDataSource, ClientEntity, 'CLI');
    const client = clientsRepo().create({
      id,
      nom,
      type,
      secteur,
      adresse,
      ancienneteMois: ancienneteMois ?? 0,
      retardsPasses: retardsPasses ?? 0,
      delaiMoyenJours: delaiMoyenJours ?? 0,
    });
    const saved = await clientsRepo().save(client);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

/** PATCH /clients/:id */
router.patch('/:id', requirePermissions('clients:manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await clientsRepo().findOne({ where: { id } });
    if (!client) {
      res.status(404).json({ statusCode: 404, message: `Client ${id} introuvable` });
      return;
    }

    const { nom, type, secteur, adresse, ancienneteMois, retardsPasses, delaiMoyenJours } = req.body ?? {};

    if (type || secteur) {
      const effectiveType = type ?? client.type;
      const effectiveSecteur = secteur ?? client.secteur;
      const secteurs = SECTEURS_BY_TYPE[effectiveType as ClientType];
      if (!secteurs.includes(effectiveSecteur)) {
        res.status(400).json({
          statusCode: 400,
          message: `Secteur "${effectiveSecteur}" invalide pour le type "${effectiveType}". Valeurs possibles: ${secteurs.join(', ')}`,
        });
        return;
      }
    }

    if (nom) client.nom = nom;
    if (type) client.type = type;
    if (secteur) client.secteur = secteur;
    if (adresse) client.adresse = adresse;
    if (ancienneteMois !== undefined) client.ancienneteMois = ancienneteMois;
    if (retardsPasses !== undefined) client.retardsPasses = retardsPasses;
    if (delaiMoyenJours !== undefined) client.delaiMoyenJours = delaiMoyenJours;

    const saved = await clientsRepo().save(client);
    res.json(saved);
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

/** DELETE /clients/:id — supprime le client + factures + paiements liés en transaction */
router.delete('/:id', requirePermissions('clients:manage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await clientsRepo().findOne({ where: { id } });
    if (!client) {
      res.status(404).json({ statusCode: 404, message: `Client ${id} introuvable` });
      return;
    }

    const invoicesRepo = AppDataSource.getRepository(InvoiceEntity);
    const paymentsRepo = AppDataSource.getRepository(PaymentEntity);

    await AppDataSource.transaction(async (manager) => {
      const invoiceIds = (
        await manager.find(InvoiceEntity, { where: { clientId: id }, select: ['id'] })
      ).map((i) => i.id);

      if (invoiceIds.length > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from(PaymentEntity)
          .where('factureId IN (:...invoiceIds)', { invoiceIds })
          .execute();
        await manager.delete(InvoiceEntity, { clientId: id });
      }

      await manager.delete(ClientEntity, { id });
    });

    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
  }
});

export default router;
