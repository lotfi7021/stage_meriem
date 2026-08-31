import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { InvoiceEntity } from '../entities/invoice.entity';
import { ClientEntity } from '../entities/client.entity';

const invoicesRepo = () => AppDataSource.getRepository(InvoiceEntity);
const clientsRepo = () => AppDataSource.getRepository(ClientEntity);

const ECHEANCE_ALERT_DAYS = 7;

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(fromDateStr + 'T00:00:00Z');
  const to = new Date(toDateStr + 'T00:00:00Z');
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export class NotificationsController {
  /**
   * GET /notifications
   * Récupère toutes les notifications (impayés, retards, échéances proches)
   */
  static async getAllNotifications(_req: Request, res: Response): Promise<void> {
    try {
      const [invoices, clients] = await Promise.all([invoicesRepo().find(), clientsRepo().find()]);
      const clientById = new Map(clients.map((c) => [c.id, c]));
      const todayStr = new Date().toISOString().slice(0, 10);
      const notifs: any[] = [];
      let n = 1;

      for (const f of invoices) {
        const client = clientById.get(f.clientId);
        if (!client) continue;

        if (f.statut === 'impayee') {
          const daysLate = daysBetween(f.dateEcheance, todayStr);
          notifs.push({
            id: 'NOTIF-' + String(n++).padStart(5, '0'),
            type: 'impayee',
            invoiceId: f.id,
            clientId: f.clientId,
            message: 'Facture ' + f.id + ' impayee depuis ' + daysLate + ' jours',
            montant: Number(f.montant) - Number(f.montantPaye),
            date: f.dateEcheance,
            lu: false,
          });
        } else if (f.statut === 'en_retard') {
          const daysLate = daysBetween(f.dateEcheance, todayStr);
          notifs.push({
            id: 'NOTIF-' + String(n++).padStart(5, '0'),
            type: 'retard',
            invoiceId: f.id,
            clientId: f.clientId,
            message: 'Facture ' + f.id + ' en retard depuis ' + daysLate + ' jours',
            montant: Number(f.montant) - Number(f.montantPaye),
            date: f.dateEcheance,
            lu: false,
          });
        } else if (f.statut === 'en_attente') {
          const daysUntil = daysBetween(todayStr, f.dateEcheance);
          if (daysUntil >= 0 && daysUntil <= ECHEANCE_ALERT_DAYS) {
            notifs.push({
              id: 'NOTIF-' + String(n++).padStart(5, '0'),
              type: 'echeance',
              invoiceId: f.id,
              clientId: f.clientId,
              message: 'Facture ' + f.id + ' arrive a echeance dans ' + daysUntil + ' jours',
              montant: Number(f.montant) - Number(f.montantPaye),
              date: f.dateEcheance,
              lu: false,
            });
          }
        }
      }

      res.json(notifs);
    } catch (err) {
      console.error('Get notifications error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }
}
