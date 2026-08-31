import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { Client, ClientType } from "@/lib/steg-data";
import { typeLabels } from "@/lib/steg-data";

const secteursByType: Record<ClientType, string[]> = {
  particulier: ["Résidentiel", "Commercial", "Agriculture"],
  entreprise: ["Industrie", "Commerce", "Services", "Technologie", "Énergie"],
  administration: ["Municipalité", "État", "Hôpital", "Éducation"],
};

const clientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  type: z.enum(["particulier", "entreprise", "administration"]),
  secteur: z.string().min(1, "Le secteur est requis"),
  adresse: z.string().min(1, "L'adresse est requise"),
  ancienneteMois: z.number().min(0, "Doit être positif"),
  retardsPasses: z.number().min(0, "Doit être positif"),
  delaiMoyenJours: z.number().min(0, "Doit être positif"),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: Omit<Client, "id">) => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [type, setType] = useState<ClientType>(client ? client.type : "particulier");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: client?.nom ?? "",
      type: client?.type ?? "particulier",
      secteur: client?.secteur ?? secteursByType[client?.type ?? "particulier"][0] ?? "",
      adresse: client?.adresse ?? "",
      ancienneteMois: client?.ancienneteMois ?? 0,
      retardsPasses: client?.retardsPasses ?? 0,
      delaiMoyenJours: client?.delaiMoyenJours ?? 0,
    },
  });

  function onValid(data: ClientFormData) {
    onSubmit({
      nom: data.nom.trim(),
      type: data.type,
      secteur: data.secteur,
      adresse: data.adresse.trim(),
      ancienneteMois: data.ancienneteMois,
      retardsPasses: data.retardsPasses,
      delaiMoyenJours: data.delaiMoyenJours,
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
          {client ? "Modifier le client" : "Nouveau client"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">Nom</label>
            <input
              {...register("nom")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Nom du client"
            />
            {errors.nom && <p className="mt-1 text-xs text-danger">{errors.nom.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Type</label>
            <select
              {...register("type")}
              onChange={(e) => {
                const t = e.target.value as ClientType;
                setType(t);
                setValue("secteur", secteursByType[t][0] ?? "", { shouldValidate: true });
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(typeLabels) as ClientType[]).map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Secteur</label>
            <select
              {...register("secteur")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {secteursByType[type].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.secteur && <p className="mt-1 text-xs text-danger">{errors.secteur.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">Adresse</label>
            <input
              {...register("adresse")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Adresse complète"
            />
            {errors.adresse && <p className="mt-1 text-xs text-danger">{errors.adresse.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Ancienneté (mois)
            </label>
            <input
              type="number"
              {...register("ancienneteMois", { valueAsNumber: true })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
            />
            {errors.ancienneteMois && (
              <p className="mt-1 text-xs text-danger">{errors.ancienneteMois.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Retards passés</label>
            <input
              type="number"
              {...register("retardsPasses", { valueAsNumber: true })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
            />
            {errors.retardsPasses && (
              <p className="mt-1 text-xs text-danger">{errors.retardsPasses.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Délai moyen (jours)
            </label>
            <input
              type="number"
              {...register("delaiMoyenJours", { valueAsNumber: true })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
            />
            {errors.delaiMoyenJours && (
              <p className="mt-1 text-xs text-danger">{errors.delaiMoyenJours.message}</p>
            )}
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
            {client ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
