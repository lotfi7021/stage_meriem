import { useState } from "react";
import { X } from "lucide-react";
import type { Payment } from "@/lib/steg-data";

interface PaymentFormProps {
  payment: Payment;
  onSubmit: (data: Omit<Payment, "id">) => void;
  onCancel: () => void;
}

const methodLabels: Record<string, string> = {
  virement: "Virement",
  especes: "Espèces",
  cheque: "Chèque",
  en_ligne: "En ligne",
};

export function PaymentForm({ payment, onSubmit, onCancel }: PaymentFormProps) {
  const [montant, setMontant] = useState(payment.montant);
  const [datePaiement, setDatePaiement] = useState(payment.datePaiement);
  const [methode, setMethode] = useState(payment.methode);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (montant <= 0) e["montant"] = "Le montant doit être positif";
    if (!datePaiement) e["datePaiement"] = "La date est requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({
      factureId: payment.factureId,
      montant,
      datePaiement,
      methode: methode as Payment["methode"],
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-scale-in"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-secondary"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-5 text-lg font-semibold text-foreground">Modifier le paiement</h2>

        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Montant (TND)</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
            />
            {errors["montant"] && <p className="mt-1 text-xs text-danger">{errors["montant"]}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Date de paiement
            </label>
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            {errors["datePaiement"] && (
              <p className="mt-1 text-xs text-danger">{errors["datePaiement"]}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Méthode</label>
            <select
              value={methode}
              onChange={(e) => setMethode(e.target.value as Payment["methode"])}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(methodLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
