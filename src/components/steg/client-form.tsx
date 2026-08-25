import { useState } from "react";
import { X } from "lucide-react";
import type { Client, ClientType } from "@/lib/steg-data";
import { typeLabels } from "@/lib/steg-data";

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: Omit<Client, "id">) => void;
  onCancel: () => void;
}

const secteursByType: Record<ClientType, string[]> = {
  particulier: ["Résidentiel", "Commercial", "Agriculture"],
  entreprise: ["Industrie", "Commerce", "Services", "Technologie", "Énergie"],
  administration: ["Municipalité", "État", "Hôpital", "Éducation"],
};

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [nom, setNom] = useState(client ? client.nom : "");
  const [type, setType] = useState<ClientType>(client ? client.type : "particulier");
  const [secteur, setSecteur] = useState(client ? client.secteur : "");
  const [adresse, setAdresse] = useState(client ? client.adresse : "");
  const [ancienneteMois, setAncienneteMois] = useState(client ? client.ancienneteMois : 0);
  const [retardsPasses, setRetardsPasses] = useState(client ? client.retardsPasses : 0);
  const [delaiMoyenJours, setDelaiMoyenJours] = useState(client ? client.delaiMoyenJours : 0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!nom.trim()) e["nom"] = "Le nom est requis";
    if (!secteur) e["secteur"] = "Le secteur est requis";
    if (!adresse.trim()) e["adresse"] = "L'adresse est requise";
    if (ancienneteMois < 0) e["ancienneteMois"] = "Doit être positif";
    if (retardsPasses < 0) e["retardsPasses"] = "Doit être positif";
    if (delaiMoyenJours < 0) e["delaiMoyenJours"] = "Doit être positif";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({
      nom: nom.trim(),
      type,
      secteur,
      adresse: adresse.trim(),
      ancienneteMois,
      retardsPasses,
      delaiMoyenJours,
    });
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
          {client ? "Modifier le client" : "Nouveau client"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Nom du client"
            />
            {errors["nom"] && <p className="mt-1 text-xs text-danger">{errors["nom"]}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Type</label>
            <select
              value={type}
              onChange={(e) => {
                const t = e.target.value as ClientType;
                setType(t);
                setSecteur(secteursByType[t][0] ?? "");
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
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {secteursByType[type].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors["secteur"] && <p className="mt-1 text-xs text-danger">{errors["secteur"]}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">Adresse</label>
            <input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Adresse complète"
            />
            {errors["adresse"] && <p className="mt-1 text-xs text-danger">{errors["adresse"]}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Ancienneté (mois)
            </label>
            <input
              type="number"
              value={ancienneteMois}
              onChange={(e) => setAncienneteMois(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
            />
            {errors["ancienneteMois"] && (
              <p className="mt-1 text-xs text-danger">{errors["ancienneteMois"]}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Retards passés</label>
            <input
              type="number"
              value={retardsPasses}
              onChange={(e) => setRetardsPasses(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
            />
            {errors["retardsPasses"] && (
              <p className="mt-1 text-xs text-danger">{errors["retardsPasses"]}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Délai moyen (jours)
            </label>
            <input
              type="number"
              value={delaiMoyenJours}
              onChange={(e) => setDelaiMoyenJours(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              min={0}
            />
            {errors["delaiMoyenJours"] && (
              <p className="mt-1 text-xs text-danger">{errors["delaiMoyenJours"]}</p>
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
