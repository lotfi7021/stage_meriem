import { cn } from "@/lib/utils";
import { statusLabels, type InvoiceStatus, type RiskCategory } from "@/lib/steg-data";

const statusClasses: Record<InvoiceStatus, string> = {
  payee: "bg-success/12 text-success border-success/30",
  en_attente: "bg-warning/15 text-warning-foreground border-warning/40",
  en_retard: "bg-danger/12 text-danger border-danger/30",
  impayee: "bg-danger/20 text-danger border-danger/50",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusClasses[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

const riskClasses: Record<RiskCategory, string> = {
  faible: "bg-success/12 text-success border-success/30",
  moyen: "bg-warning/15 text-warning-foreground border-warning/40",
  eleve: "bg-danger/12 text-danger border-danger/30",
};

const riskLabels: Record<RiskCategory, string> = {
  faible: "Risque faible",
  moyen: "Risque moyen",
  eleve: "Risque élevé",
};

export function RiskBadge({ categorie, score }: { categorie: RiskCategory; score?: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        riskClasses[categorie],
      )}
    >
      {riskLabels[categorie]}
      {score !== undefined && <span className="font-semibold tabular-nums">{score}</span>}
    </span>
  );
}
