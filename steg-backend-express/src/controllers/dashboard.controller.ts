import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ClientEntity } from '../entities/client.entity';
import { InvoiceEntity, InvoiceStatus } from '../entities/invoice.entity';

const clientsRepo = () => AppDataSource.getRepository(ClientEntity);
const invoicesRepo = () => AppDataSource.getRepository(InvoiceEntity);

export class DashboardController {
  /**
   * GET /dashboard/kpis
   * Récupère les indicateurs clés de performance
   */
  static async getKpis(_req: Request, res: Response): Promise<void> {
    try {
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
    } catch (err) {
      console.error('Get KPIs error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }

  /**
   * GET /dashboard/monthly-series
   * Récupère les données mensuelles pour les graphiques
   */
  static async getMonthlySeries(_req: Request, res: Response): Promise<void> {
    try {
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
    } catch (err) {
      console.error('Get monthly series error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }

  /**
   * GET /dashboard/status-breakdown
   * Récupère la répartition des factures par statut
   */
  static async getStatusBreakdown(_req: Request, res: Response): Promise<void> {
    try {
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
    } catch (err) {
      console.error('Get status breakdown error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }
}
