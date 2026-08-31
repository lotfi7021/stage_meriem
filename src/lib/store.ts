import { create } from "zustand";
import type { Client, Invoice, Payment, RiskScore, ClientType, InvoiceStatus } from "./steg-data";

// ── Named types for Payment methods ──
export type PaymentMethod = Payment["methode"];

export type MethodLabels = Record<PaymentMethod, string> & Record<string, string>;

export const methodLabels: MethodLabels = {
  virement: "Virement",
  especes: "Espèces",
  cheque: "Chèque",
  en_ligne: "En ligne",
};

// ── Default per-page ──
export const DEFAULT_PER_PAGE = 15;

// ── Chart tooltip style (reused across pages) ──
export const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

// ── Pie chart colors ──
export const PIE_COLORS = [
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--primary)",
] as const;

// ── Risk score bar color helper ──
export function riskBarColor(categorie: RiskCategory): string {
  if (categorie === "eleve") return "bg-danger";
  if (categorie === "moyen") return "bg-warning";
  return "bg-success";
}

export type RiskCategory = "faible" | "moyen" | "eleve";

// ── Store interface ──
interface StegState {
  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];

  addClient: (data: Omit<Client, "id">) => Client;
  updateClient: (id: string, data: Partial<Omit<Client, "id">>) => Client | null;
  deleteClient: (id: string) => boolean;

  addInvoice: (data: Omit<Invoice, "id">) => Invoice;
  updateInvoice: (id: string, data: Partial<Omit<Invoice, "id">>) => Invoice | null;
  deleteInvoice: (id: string) => boolean;

  addPayment: (data: Omit<Payment, "id">) => Payment;
  updatePayment: (id: string, data: Partial<Omit<Payment, "id">>) => Payment | null;
  deletePayment: (id: string) => boolean;
}

// ── Helpers ──
function nextId(prefix: string, list: { id: string }[]) {
  const nums = list.map((i) => parseInt(i.id.split("-")[1] ?? "0", 10));
  const next = Math.max(0, ...nums) + 1;
  return `${prefix}-${String(next).padStart(5, "0")}` as string;
}

function computeRiskForClient(
  client: Client,
  invoices: Invoice[],
): RiskScore {
  const inv = invoices.filter((i) => i.clientId === client.id);
  const impayes = inv.filter(
    (i) => i.statut === "en_retard" || i.statut === "impayee",
  ).length;
  const tauxImpaye = inv.length ? impayes / inv.length : 0;

  const facteurs = [
    {
      label: "Taux d'impayés historique",
      poids: Math.round(tauxImpaye * 45),
    },
    {
      label: "Nombre de retards passés",
      poids: Math.min(20, client.retardsPasses * 2.5),
    },
    {
      label: "Délai moyen de paiement",
      poids: Math.min(20, client.delaiMoyenJours / 3),
    },
    {
      label: "Ancienneté du contrat",
      poids: Math.max(-10, 10 - client.ancienneteMois / 12),
    },
    {
      label: "Type de client",
      poids:
        client.type === "particulier" ? 8 : client.type === "entreprise" ? 4 : 0,
    },
  ].map((f) => ({ ...f, poids: Math.round(f.poids) }));

  const score = Math.max(
    3,
    Math.min(98, facteurs.reduce((s, f) => s + f.poids, 0)),
  );
  const categorie: RiskCategory =
    score >= 60 ? "eleve" : score >= 32 ? "moyen" : "faible";

  return {
    clientId: client.id,
    score,
    categorie,
    dateCalcul: new Date().toISOString().split("T")[0],
    facteurs,
  };
}

// ── Initial data ──
const INITIAL_CLIENTS: Client[] = [
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

const INITIAL_INVOICES: Invoice[] = [
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

const INITIAL_PAYMENTS: Payment[] = [
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

// ── Helper to compute invoice status from montantPaye ──
function computeInvoiceStatus(
  montant: number,
  montantPaye: number,
  dateEcheance: string,
): InvoiceStatus {
  if (montantPaye >= montant) return "payee";
  const today = new Date();
  const echeance = new Date(dateEcheance);
  if (today > echeance) {
    return montantPaye > 0 ? "en_retard" : "impayee";
  }
  return "en_attente";
}

// ── Store ──
export const useStegStore = create<StegState>()((set, get) => ({
  clients: INITIAL_CLIENTS,
  invoices: INITIAL_INVOICES,
  payments: INITIAL_PAYMENTS,

  // ── Client CRUD ──
  addClient: (data) => {
    const state = get();
    const client: Client = { ...data, id: nextId("CLI", state.clients) };
    set((s) => ({ clients: [...s.clients, client] }));
    return client;
  },

  updateClient: (id, data) => {
    const state = get();
    const idx = state.clients.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    return get().clients[idx] ?? null;
  },

  deleteClient: (id) => {
    const state = get();
    const before = state.clients.length;
    const invoiceIds = state.invoices
      .filter((i) => i.clientId === id)
      .map((i) => i.id);
    set((s) => ({
      clients: s.clients.filter((c) => c.id !== id),
      invoices: s.invoices.filter((i) => i.clientId !== id),
      payments: s.payments.filter((p) => !invoiceIds.includes(p.factureId)),
    }));
    return get().clients.length < before;
  },

  // ── Invoice CRUD ──
  addInvoice: (data) => {
    const state = get();
    const invoice: Invoice = { ...data, id: nextId("FAC", state.invoices) };
    set((s) => ({ invoices: [...s.invoices, invoice] }));
    return invoice;
  },

  updateInvoice: (id, data) => {
    const state = get();
    const idx = state.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    set((s) => ({
      invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
    return get().invoices[idx] ?? null;
  },

  deleteInvoice: (id) => {
    const state = get();
    const before = state.invoices.length;
    set((s) => ({
      invoices: s.invoices.filter((i) => i.id !== id),
      payments: s.payments.filter((p) => p.factureId !== id),
    }));
    return get().invoices.length < before;
  },

  // ── Payment CRUD (auto-updates invoice montantPaye + statut) ──
  addPayment: (data) => {
    const state = get();
    const payment: Payment = { ...data, id: nextId("PAY", state.payments) };

    set((s) => {
      const updatedInvoices = s.invoices.map((inv) => {
        if (inv.id !== data.factureId) return inv;
        const newMontantPaye = inv.montantPaye + data.montant;
        const newStatut = computeInvoiceStatus(
          inv.montant,
          newMontantPaye,
          inv.dateEcheance,
        );
        return { ...inv, montantPaye: newMontantPaye, statut: newStatut };
      });
      return {
        payments: [...s.payments, payment],
        invoices: updatedInvoices,
      };
    });

    return payment;
  },

  updatePayment: (id, data) => {
    const state = get();
    const idx = state.payments.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const oldPayment = state.payments[idx];
    if (!oldPayment) return null;
    const diff = data.montant !== undefined ? data.montant - oldPayment.montant : 0;

    set((s) => {
      let updatedInvoices = s.invoices;
      if (diff !== 0) {
        updatedInvoices = s.invoices.map((inv) => {
          if (inv.id !== oldPayment.factureId) return inv;
          const newMontantPaye = Math.max(0, inv.montantPaye + diff);
          const newStatut = computeInvoiceStatus(
            inv.montant,
            newMontantPaye,
            inv.dateEcheance,
          );
          return { ...inv, montantPaye: newMontantPaye, statut: newStatut };
        });
      }
      return {
        payments: s.payments.map((p) => (p.id === id ? { ...p, ...data } : p)),
        invoices: updatedInvoices,
      };
    });

    return get().payments[idx] ?? null;
  },

  deletePayment: (id) => {
    const state = get();
    const payment = state.payments.find((p) => p.id === id);
    if (!payment) return false;

    const before = state.payments.length;

    set((s) => {
      const updatedInvoices = s.invoices.map((inv) => {
        if (inv.id !== payment.factureId) return inv;
        const newMontantPaye = Math.max(0, inv.montantPaye - payment.montant);
        const newStatut = computeInvoiceStatus(
          inv.montant,
          newMontantPaye,
          inv.dateEcheance,
        );
        return { ...inv, montantPaye: newMontantPaye, statut: newStatut };
      });
      return {
        payments: s.payments.filter((p) => p.id !== id),
        invoices: updatedInvoices,
      };
    });

    return get().payments.length < before;
  },
}));

// ── Derived selectors ──
export function computeRiskScores(state: { clients: Client[]; invoices: Invoice[] }): RiskScore[] {
  return state.clients.map((c) => computeRiskForClient(c, state.invoices));
}

export function computeKpis(state: { clients: Client[]; invoices: Invoice[] }) {
  const { invoices, clients } = state;
  const totalFacture = invoices.reduce((s, i) => s + i.montant, 0);
  const totalPaye = invoices.reduce((s, i) => s + i.montantPaye, 0);
  const impayes = invoices.filter(
    (i) => i.statut === "en_retard" || i.statut === "impayee",
  );
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

export function computeMonthlySeries(invoices: Invoice[]) {
  const map = new Map<string, { mois: string; facture: number; paye: number }>();
  invoices.forEach((i) => {
    const key = i.dateEmission.slice(0, 7);
    const e = map.get(key) ?? { mois: key, facture: 0, paye: 0 };
    e.facture += i.montant;
    e.paye += i.montantPaye;
    map.set(key, e);
  });
  return [...map.values()]
    .sort((a, b) => a.mois.localeCompare(b.mois))
    .slice(-12);
}

export function computeStatusBreakdown(invoices: Invoice[]) {
  const statusLabels: Record<InvoiceStatus, string> = {
    payee: "Payée",
    en_attente: "En attente",
    en_retard: "En retard",
    impayee: "Impayée",
  };
  return (Object.keys(statusLabels) as InvoiceStatus[]).map((s) => ({
    statut: statusLabels[s],
    key: s,
    valeur: invoices.filter((i) => i.statut === s).length,
  }));
}

// ── Re-export steg-data types and utils ──
export {
  formatTND,
  formatDate,
  statusLabels,
  typeLabels,
} from "./steg-data";
export { clientById } from "./steg-data";
export type { Client, Invoice, Payment, RiskScore, ClientType, InvoiceStatus } from "./steg-data";
