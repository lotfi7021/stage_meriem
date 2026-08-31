export type ClientType = "particulier" | "entreprise" | "administration";
export type InvoiceStatus = "payee" | "en_attente" | "en_retard" | "impayee";
export type RiskCategory = "faible" | "moyen" | "eleve";

export interface Client {
  id: string;
  nom: string;
  type: ClientType;
  secteur: string;
  adresse: string;
  ancienneteMois: number;
  retardsPasses: number;
  delaiMoyenJours: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  montant: number;
  dateEmission: string;
  dateEcheance: string;
  statut: InvoiceStatus;
  montantPaye: number;
}

export interface Payment {
  id: string;
  factureId: string;
  montant: number;
  datePaiement: string;
  methode: "virement" | "especes" | "cheque" | "en_ligne";
}

export interface RiskScore {
  clientId: string;
  score: number;
  categorie: RiskCategory;
  dateCalcul: string;
  facteurs: { label: string; poids: number }[];
}

export function clientById<T extends { id: string }>(id: string, list: T[]): T | undefined {
  return list.find((c) => c.id === id);
}

export function formatTND(v: number) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 0,
  }).format(v);
}

export function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export const statusLabels: Record<InvoiceStatus, string> = {
  payee: "Payée",
  en_attente: "En attente",
  en_retard: "En retard",
  impayee: "Impayée",
};

export const typeLabels: Record<ClientType, string> = {
  particulier: "Particulier",
  entreprise: "Entreprise",
  administration: "Administration",
};
