import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ClientEntity } from '../entities/client.entity';
import { InvoiceEntity, InvoiceStatus } from '../entities/invoice.entity';
import { authenticate, requirePermissions } from '../middleware/auth';

const router = Router();
const clientsRepo = () => AppDataSource.getRepository(ClientEntity);
const invoicesRepo = () => AppDataSource.getRepository(InvoiceEntity);

router.use(authenticate);
router.use(requirePermissions('dashboard:view'));

/** GET /dashboard/kpis */
router.get('/kpis', async (_req: Request, res: Response) => {
  const [invoices, nbClients] = await Promise.all([
    invoicesRepo().find(),
    clientsRepo().count(),
  ]);

  const totalFacture = invoices.reduce((s, i) => s + Number(i.montant), 0);
  const totalPaye = invoices.reduce((s, i) => s + Number(i.montantPaye), 0);
  const impayes = invoices.filter((i) => i.statut === 'en_retard' || i.statut === 'impayee');
  const montantImpaye = impayes.reduce((s, i) => s + (Number(i.montant) - Number(i.montantPaye)), 0);

  res.json({
    totalFacture,
    totalPaye,
    montantImpaye,
    tauxRecouvrement: totalFacture ? (totalPaye / totalFacture) * 100 : 0,
    tauxImpaye: invoices.length ? (impayes.length / invoices.length) * 100 : 0,
    nbFactures: invoices.length,
    nbImpayees: impayes.length,
    nbClients,
  });
});

/** GET /dashboard/monthly-series */
router.get('/monthly-series', async (_req: Request, res: Response) => {
  const invoices = await invoicesRepo().find();
  const map = new Map<string, { mois: string; facture: number; paye: number }>();

  invoices.forEach((i) => {
    const key = i.dateEmission.slice(0, 7);
    const entry = map.get(key) ?? { mois: key, facture: 0, paye: 0 };
    entry.facture += Number(i.montant);
    entry.paye += Number(i.montantPaye);
    map.set(key, entry);
  });

  const series = [...map.values()].sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12);
  res.json(series);
});

/** GET /dashboard/status-breakdown */
router.get('/status-breakdown', async (_req: Request, res: Response) => {
  const statusLabels: Record<InvoiceStatus, string> = {
    payee: 'Payée',
    en_attente: 'En attente',
    en_retard: 'En retard',
    impayee: 'Impayée',
  };
  const invoices = await invoicesRepo().find();

  const breakdown = (Object.keys(statusLabels) as InvoiceStatus[]).map((key) => ({
    statut: statusLabels[key],
    key,
    valeur: invoices.filter((i) => i.statut === key).length,
  }));

  res.json(breakdown);
});

export default router;
