import { useState } from "react";
import { X } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@/lib/steg-data";
import { statusLabels } from "@/lib/steg-data";
import { useStegStore } from "@/lib/store";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: Omit<Invoice, "id">) => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSubmit, onCancel }: InvoiceFormProps) {
  const clients = useStegStore((s) => s.clients);
  const [clientId, setClientId] = useState(invoice ? invoice.clientId : (clients[0]?.id ?? ""));
  const [montant, setMontant] = useState(invoice ? invoice.montant : 0);
  const [dateEmission, setDateEmission] = useState(invoice ? invoice.dateEmission : "");
  const [dateEcheance, setDateEcheance] = useState(invoice ? invoice.dateEcheance : "");
  const [statut, setStatut] = useState<InvoiceStatus>(invoice ? invoice.statut : "en_attente");
  const [montantPaye, setMontantPaye] = useState(invoice ? invoice.montantPaye : 0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!clientId) e["clientId"] = "Le client est requis";
    if (montant <= 0) e["montant"] = "Le montant doit être positif";
    if (!dateEmission) e["dateEmission"] = "La date d'émission est requise";
    if (!dateEcheance) e["dateEcheance"] = "La date d'échéance est requise";
    if (dateEcheance && dateEmission && dateEcheance < dateEmission) {
      e["dateEcheance"] = "L'échéance doit être après l'émission";
    }
    if (montantPaye < 0) e["montantPaye"] = "Doit être positif";
    if (montantPaye > montant) e["montantPaye"] = "Ne peut dépasser le montant";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({ clientId, montant, dateEmission, dateEcheance, statut, montantPaye });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-scale-in"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-secondary"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {invoice ? "Modifier la facture" : "Nouvelle facture"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
            {errors["clientId"] && <p className="mt-1 text-xs text-danger">{errors["clientId"]}</p>}
          </div>

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
              Montant payé (TND)
            </label>
            <input
              type="number"
              value={montantPaye}
              onChange={(e) => setMontantPaye(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
              max={montant}
            />
            {errors["montantPaye"] && (
              <p className="mt-1 text-xs text-danger">{errors["montantPaye"]}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Date d'émission
            </label>
            <input
              type="date"
              value={dateEmission}
              onChange={(e) => setDateEmission(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            {errors["dateEmission"] && (
              <p className="mt-1 text-xs text-danger">{errors["dateEmission"]}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Date d'échéance
            </label>
            <input
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            {errors["dateEcheance"] && (
              <p className="mt-1 text-xs text-danger">{errors["dateEcheance"]}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as InvoiceStatus)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(statusLabels) as InvoiceStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
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
            {invoice ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
