import { InvoiceStatus } from '../entities/invoice.entity';

/**
 * Calcule le statut d'une facture.
 * IMPORTANT: on compare des chaînes "YYYY-MM-DD" plutôt que des objets Date,
 * pour éviter le bug de fuseau horaire identifié côté frontend.
 */
export function computeInvoiceStatus(
  montant: number,
  montantPaye: number,
  dateEcheance: string,
): InvoiceStatus {
  if (montantPaye >= montant) return 'payee';

  const todayStr = new Date().toISOString().slice(0, 10);
  if (todayStr > dateEcheance) {
    return montantPaye > 0 ? 'en_retard' : 'impayee';
  }
  return 'en_attente';
}
