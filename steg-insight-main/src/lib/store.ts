import type { RiskCategory } from "./steg-data";

export const methodLabels: Record<string, string> = {
  virement: "Virement",
  especes: "Espèces",
  cheque: "Chèque",
  en_ligne: "En ligne",
};

export const DEFAULT_PER_PAGE = 15;

export const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

export const PIE_COLORS = [
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--primary)",
] as const;

export function riskBarColor(categorie: RiskCategory): string {
  if (categorie === "eleve") return "bg-danger";
  if (categorie === "moyen") return "bg-warning";
  return "bg-success";
}

export { formatTND, formatDate, statusLabels, typeLabels, clientById } from "./steg-data";
export type { Client, Invoice, Payment, RiskScore, ClientType, InvoiceStatus } from "./steg-data";
