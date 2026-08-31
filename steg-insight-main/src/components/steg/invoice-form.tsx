import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { Invoice, InvoiceStatus } from "@/lib/steg-data";
import { statusLabels } from "@/lib/steg-data";
import { useClients } from "@/hooks/use-clients";

const invoiceSchema = z
  .object({
    clientId: z.string().min(1, "Le client est requis"),
    montant: z.number().min(0.01, "Le montant doit être positif"),
    dateEmission: z.string().min(1, "La date d'émission est requise"),
    dateEcheance: z.string().min(1, "La date d'échéance est requise"),
    statut: z.enum(["payee", "en_attente", "en_retard", "impayee"]),
    montantPaye: z.number().min(0, "Doit être positif"),
  })
  .refine(
    (data) => !data.dateEcheance || !data.dateEmission || data.dateEcheance >= data.dateEmission,
    {
      message: "L'échéance doit être après l'émission",
      path: ["dateEcheance"],
    },
  )
  .refine((data) => data.montantPaye <= data.montant, {
    message: "Ne peut dépasser le montant",
    path: ["montantPaye"],
  });

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: Omit<Invoice, "id">) => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSubmit, onCancel }: InvoiceFormProps) {
  const { data: clients = [] } = useClients();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: invoice?.clientId ?? clients[0]?.id ?? "",
      montant: invoice?.montant ?? 0,
      dateEmission: invoice?.dateEmission ?? "",
      dateEcheance: invoice?.dateEcheance ?? "",
      statut: invoice?.statut ?? "en_attente",
      montantPaye: invoice?.montantPaye ?? 0,
    },
  });

  const montant = watch("montant");

  function onValid(data: InvoiceFormData) {
    onSubmit({
      clientId: data.clientId,
      montant: data.montant,
      dateEmission: data.dateEmission,
      dateEcheance: data.dateEcheance,
      statut: data.statut as InvoiceStatus,
      montantPaye: data.montantPaye,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in">
      <form
        onSubmit={handleSubmit(onValid)}
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
              {...register("clientId")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-xs text-danger">{errors.clientId.message}</p>
            )}
          </div>

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

          {invoice && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Montant payé (TND)
              </label>
              <input
                type="number"
                {...register("montantPaye", { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                min={0}
                max={montant}
              />
              {errors.montantPaye && (
                <p className="mt-1 text-xs text-danger">{errors.montantPaye.message}</p>
              )}
            </div>
          )}

          {!invoice && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Reste à payer (TND)
              </label>
              <input
                type="number"
                value={montant}
                readOnly
                className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-muted-foreground"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Date d'émission
            </label>
            <input
              type="date"
              {...register("dateEmission")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            {errors.dateEmission && (
              <p className="mt-1 text-xs text-danger">{errors.dateEmission.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Date d'échéance
            </label>
            <input
              type="date"
              {...register("dateEcheance")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            {errors.dateEcheance && (
              <p className="mt-1 text-xs text-danger">{errors.dateEcheance.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">Statut</label>
            <select
              {...register("statut")}
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
