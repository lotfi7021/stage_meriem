import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { PaymentEntity } from '../entities/payment.entity';
import { InvoiceEntity } from '../entities/invoice.entity';
import { computeInvoiceStatus } from '../utils/invoice-status';
import { generateSequentialId } from '../utils/id-generator';

const paymentsRepo = () => AppDataSource.getRepository(PaymentEntity);
const invoicesRepo = () => AppDataSource.getRepository(InvoiceEntity);

export class PaymentsController {
  /**
   * GET /payments
   * Récupère tous les paiements
   */
  static async getAllPayments(_req: Request, res: Response): Promise<void> {
    try {
      const payments = await paymentsRepo().find();
      res.json(payments);
    } catch (err) {
      console.error('Get all payments error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }

  /**
   * GET /payments/:id
   * Récupère un paiement par son ID
   */
  static async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const payment = await paymentsRepo().findOne({ where: { id: req.params.id } });
      if (!payment) {
        res.status(404).json({ statusCode: 404, message: `Paiement ${req.params.id} introuvable` });
        return;
      }
      res.json(payment);
    } catch (err) {
      console.error('Get payment by id error:', err);
      res.status(500).json({ statusCode: 500, message: 'Erreur interne du serveur' });
    }
  }

  /**
   * POST /payments
   * Crée un nouveau paiement et recalcule la facture liée
   */
  static async createPayment(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * PATCH /payments/:id
   * Met à jour un paiement et réajuste la facture
   */
  static async updatePayment(req: Request, res: Response): Promise<void> {
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
  }

  /**
   * DELETE /payments/:id
   * Supprime un paiement et retire son montant de la facture
   */
  static async deletePayment(req: Request, res: Response): Promise<void> {
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
  }
}
