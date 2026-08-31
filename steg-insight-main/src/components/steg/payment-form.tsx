import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { Payment } from "@/lib/steg-data";
import { methodLabels } from "@/lib/store";

const paymentSchema = z.object({
  montant: z.number().min(0.01, "Le montant doit être positif"),
  datePaiement: z.string().min(1, "La date est requise"),
  methode: z.enum(["virement", "especes", "cheque", "en_ligne"]),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  payment: Payment;
  onSubmit: (data: Omit<Payment, "id">) => void;
  onCancel: () => void;
}

export function PaymentForm({ payment, onSubmit, onCancel }: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montant: payment.montant,
      datePaiement: payment.datePaiement,
      methode: payment.methode,
    },
  });

  function onValid(data: PaymentFormData) {
    onSubmit({
      factureId: payment.factureId,
      montant: data.montant,
      datePaiement: data.datePaiement,
      methode: data.methode,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in">
      <form
        onSubmit={handleSubmit(onValid)}
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
              {...register("montant", { valueAsNumber: true })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
            />
            {errors.montant && <p className="mt-1 text-xs text-danger">{errors.montant.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Date de paiement
            </label>
            <input
              type="date"
              {...register("datePaiement")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            {errors.datePaiement && (
              <p className="mt-1 text-xs text-danger">{errors.datePaiement.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Méthode</label>
            <select
              {...register("methode")}
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
