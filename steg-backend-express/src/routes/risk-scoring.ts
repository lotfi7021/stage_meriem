import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ClientEntity } from '../entities/client.entity';
import { InvoiceEntity } from '../entities/invoice.entity';
import { authenticate, requirePermissions } from '../middleware/auth';

const router = Router();
const clientsRepo = () => AppDataSource.getRepository(ClientEntity);
const invoicesRepo = () => AppDataSource.getRepository(InvoiceEntity);

router.use(authenticate);
router.use(requirePermissions('risques:view'));

function computeRiskForClient(client: ClientEntity, allInvoices: InvoiceEntity[]) {
  const inv = allInvoices.filter((i) => i.clientId === client.id);
  const impayes = inv.filter((i) => i.statut === 'en_retard' || i.statut === 'impayee').length;
  const tauxImpaye = inv.length ? impayes / inv.length : 0;

  const facteurs = [
    { label: "Taux d'impayes historique", poids: Math.round(tauxImpaye * 45) },
    { label: 'Nombre de retards passes', poids: Math.min(20, client.retardsPasses * 2.5) },
    { label: 'Delai moyen de paiement', poids: Math.min(20, client.delaiMoyenJours / 3) },
    { label: 'Anciennete du contrat', poids: Math.max(-10, 10 - client.ancienneteMois / 12) },
    {
      label: 'Type de client',
      poids: client.type === 'particulier' ? 8 : client.type === 'entreprise' ? 4 : 0,
    },
  ].map((f) => ({ ...f, poids: Math.round(f.poids) }));

  const score = Math.max(3, Math.min(98, facteurs.reduce((s, f) => s + f.poids, 0)));
  const categorie = score >= 60 ? 'eleve' : score >= 32 ? 'moyen' : 'faible';

  return {
    clientId: client.id,
    score,
    categorie,
    dateCalcul: new Date().toISOString().slice(0, 10),
    facteurs,
  };
}

router.get('/', async (_req: Request, res: Response) => {
  const [clients, invoices] = await Promise.all([clientsRepo().find(), invoicesRepo().find()]);
  const scores = clients.map((c) => computeRiskForClient(c, invoices));
  res.json(scores);
});

router.get('/:clientId', async (req: Request, res: Response) => {
  const client = await clientsRepo().findOne({ where: { id: req.params.clientId } });
  if (!client) {
    res.status(404).json({ statusCode: 404, message: 'Client ' + req.params.clientId + ' introuvable' });
    return;
  }
  const invoices = await invoicesRepo().find({ where: { clientId: req.params.clientId } });
  res.json(computeRiskForClient(client, invoices));
});

export default router;
