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

let clients: Client[] = [
  {
    id: "CLI-0001",
    nom: "Groupe Chimique Tunisien",
    type: "entreprise",
    secteur: "Industrie",
    adresse: "45 Av. Habib Bourguiba, Tunis",
    ancienneteMois: 96,
    retardsPasses: 3,
    delaiMoyenJours: 28,
  },
  {
    id: "CLI-0002",
    nom: "Ben Salah Mohamed",
    type: "particulier",
    secteur: "Résidentiel",
    adresse: "12 Av. Habib Bourguiba, Sfax",
    ancienneteMois: 24,
    retardsPasses: 1,
    delaiMoyenJours: 12,
  },
];

export { clients };

let invoices: Invoice[] = [
  {
    id: "FAC-00001",
    clientId: "CLI-0001",
    montant: 4500,
    dateEmission: "2026-06-10",
    dateEcheance: "2026-07-10",
    statut: "en_retard",
    montantPaye: 1500,
  },
  {
    id: "FAC-00002",
    clientId: "CLI-0002",
    montant: 180,
    dateEmission: "2026-07-15",
    dateEcheance: "2026-08-14",
    statut: "payee",
    montantPaye: 180,
  },
];

export { invoices };

const payments: Payment[] = [
  {
    id: "PAY-00001",
    factureId: "FAC-00001",
    montant: 1500,
    datePaiement: "2026-07-05",
    methode: "virement",
  },
  {
    id: "PAY-00002",
    factureId: "FAC-00002",
    montant: 180,
    datePaiement: "2026-08-10",
    methode: "en_ligne",
  },
];

export { payments };

function nextId(prefix: string, list: { id: string }[]) {
  const nums = list.map((i) => parseInt(i.id.split("-")[1] ?? "0", 10));
  const next = Math.max(0, ...nums) + 1;
  return `${prefix}-${String(next).padStart(5, "0")}`;
}

export function addClient(data: Omit<Client, "id">): Client {
  const client: Client = { ...data, id: nextId("CLI", clients) };
  clients = [...clients, client];
  return client;
}

export function updateClient(id: string, data: Partial<Omit<Client, "id">>): Client | null {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  clients = clients.map((c) => (c.id === id ? { ...c, ...data } : c));
  return clients[idx] ?? null;
}

export function deleteClient(id: string): boolean {
  const before = clients.length;
  clients = clients.filter((c) => c.id !== id);
  invoices = invoices.filter((i) => i.clientId !== id);
  return clients.length < before;
}

/** Scoring "IA" simulé : régression logistique simple et interprétable. */
export function computeRisk(client: Client): RiskScore {
  const inv = invoices.filter((i) => i.clientId === client.id);
  const impayes = inv.filter((i) => i.statut === "en_retard" || i.statut === "impayee").length;
  const tauxImpaye = inv.length ? impayes / inv.length : 0;

  const facteurs = [
    { label: "Taux d'impayés historique", poids: Math.round(tauxImpaye * 45) },
    { label: "Nombre de retards passés", poids: Math.min(20, client.retardsPasses * 2.5) },
    { label: "Délai moyen de paiement", poids: Math.min(20, client.delaiMoyenJours / 3) },
    { label: "Ancienneté du contrat", poids: Math.max(-10, 10 - client.ancienneteMois / 12) },
    {
      label: "Type de client",
      poids: client.type === "particulier" ? 8 : client.type === "entreprise" ? 4 : 0,
    },
  ].map((f) => ({ ...f, poids: Math.round(f.poids) }));

  const score = Math.max(
    3,
    Math.min(
      98,
      facteurs.reduce((s, f) => s + f.poids, 0),
    ),
  );
  const categorie: RiskCategory = score >= 60 ? "eleve" : score >= 32 ? "moyen" : "faible";
  return { clientId: client.id, score, categorie, dateCalcul: "2026-08-24", facteurs };
}

export let riskScores: RiskScore[] = clients.map(computeRisk);

export function clientById(id: string) {
  return clients.find((c) => c.id === id);
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

export function kpis() {
  const totalFacture = invoices.reduce((s, i) => s + i.montant, 0);
  const totalPaye = invoices.reduce((s, i) => s + i.montantPaye, 0);
  const impayes = invoices.filter((i) => i.statut === "en_retard" || i.statut === "impayee");
  const montantImpaye = impayes.reduce((s, i) => s + (i.montant - i.montantPaye), 0);
  return {
    totalFacture,
    totalPaye,
    montantImpaye,
    tauxRecouvrement: totalFacture ? (totalPaye / totalFacture) * 100 : 0,
    tauxImpaye: invoices.length ? (impayes.length / invoices.length) * 100 : 0,
    nbFactures: invoices.length,
    nbImpayees: impayes.length,
    nbClients: clients.length,
  };
}

export function monthlySeries() {
  const map = new Map<string, { mois: string; facture: number; paye: number }>();
  invoices.forEach((i) => {
    const key = i.dateEmission.slice(0, 7);
    const e = map.get(key) ?? { mois: key, facture: 0, paye: 0 };
    e.facture += i.montant;
    e.paye += i.montantPaye;
    map.set(key, e);
  });
  return [...map.values()].sort((a, b) => a.mois.localeCompare(b.mois)).slice(-12);
}

export function statusBreakdown() {
  return (Object.keys(statusLabels) as InvoiceStatus[]).map((s) => ({
    statut: statusLabels[s],
    key: s,
    valeur: invoices.filter((i) => i.statut === s).length,
  }));
}
