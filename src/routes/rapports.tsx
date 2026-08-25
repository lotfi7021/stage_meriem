import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  FileText,
  BellRing,
  TrendingUp,
  TrendingDown,
  Calendar,
  Printer,
} from "lucide-react";
import { PageHeader, KpiCard } from "@/components/steg/kpi-card";
import { StatusBadge } from "@/components/steg/badges";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { useRequirePermission } from "@/hooks/use-require-permission";
import {
  clientById,
  formatDate,
  formatTND,
  invoices,
  kpis,
  monthlySeries,
  payments,
} from "@/lib/steg-data";

export const Route = createFileRoute("/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports & notifications — STEG FinTech" },
      {
        name: "description",
        content:
          "Rapports financiers agrégés STEG et alertes sur les factures approchant l'échéance ou impayées.",
      },
      { property: "og:title", content: "Rapports & notifications — STEG FinTech" },
      {
        property: "og:description",
        content: "Exports PDF/Excel simulés, synthèse mensuelle et système d'alertes graduées.",
      },
    ],
  }),
  component: ReportsPage,
});

const pieColors = ["var(--success)", "var(--warning)", "var(--danger)", "var(--primary)"];

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportInvoicesCSV() {
  const headers = ["ID", "Client", "Montant", "Payé", "Reste dû", "Émission", "Échéance", "Statut"];
  const rows = invoices.map((f) => [
    f.id,
    clientById(f.clientId)?.nom ?? "",
    f.montant,
    f.montantPaye,
    f.montant - f.montantPaye,
    f.dateEmission,
    f.dateEcheance,
    f.statut,
  ]);
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  downloadCSV("factures_steg.csv", csv);
  toast.success("Export CSV généré", { description: `${invoices.length} factures exportées.` });
}

function exportPaymentsCSV() {
  const headers = ["ID", "Facture", "Client", "Montant", "Date", "Méthode"];
  const rows = payments.map((p) => {
    const f = invoices.find((i) => i.id === p.factureId);
    return [
      p.id,
      p.factureId,
      f ? (clientById(f.clientId)?.nom ?? "") : "",
      p.montant,
      p.datePaiement,
      p.methode,
    ];
  });
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  downloadCSV("paiements_steg.csv", csv);
  toast.success("Export CSV généré", { description: `${payments.length} paiements exportés.` });
}

function exportMonthlyReportCSV() {
  const series = monthlySeries();
  const headers = ["Mois", "Facturé", "Encaissé", "Écart", "Taux recouvrement"];
  const rows = series.map((s) => [
    s.mois,
    s.facture,
    s.paye,
    s.facture - s.paye,
    s.facture ? ((s.paye / s.facture) * 100).toFixed(1) + "%" : "0%",
  ]);
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  downloadCSV("rapport_mensuel_steg.csv", csv);
  toast.success("Rapport mensuel exporté", { description: "Synthèse mensuelle générée en CSV." });
}

function ReportsPage() {
  const k = kpis();
  const series = monthlySeries();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const alertes = useMemo(() => {
    let list = invoices
      .filter((i) => i.statut === "en_retard" || i.statut === "impayee")
      .sort((a, b) => a.dateEcheance.localeCompare(b.dateEcheance));
    if (dateFrom) list = list.filter((i) => i.dateEcheance >= dateFrom);
    if (dateTo) list = list.filter((i) => i.dateEcheance <= dateTo);
    return list;
  }, [dateFrom, dateTo]);

  const pieData = [
    { name: "Payées", value: invoices.filter((i) => i.statut === "payee").length },
    { name: "En attente", value: invoices.filter((i) => i.statut === "en_attente").length },
    { name: "En retard", value: invoices.filter((i) => i.statut === "en_retard").length },
    { name: "Impayées", value: invoices.filter((i) => i.statut === "impayee").length },
  ];

  const paymentMethods = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((p) => map.set(p.methode, (map.get(p.methode) ?? 0) + p.montant));
    return [...map.entries()]
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total);
  }, []);

  const methodLabels: Record<string, string> = {
    virement: "Virement",
    especes: "Espèces",
    cheque: "Chèque",
    en_ligne: "En ligne",
  };

  const ok = useRequirePermission("rapports:view");
  if (!ok) return <UnauthorizedPage />;

  return (
    <>
      <PageHeader
        title="Rapports & notifications"
        subtitle="Synthèse financière agrégée et alertes de recouvrement."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up stagger-1">
          <KpiCard
            label="Total facturé"
            value={formatTND(k.totalFacture)}
            icon={TrendingUp}
            hint={`${k.nbFactures} factures`}
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <KpiCard
            label="Total encaissé"
            value={formatTND(k.totalPaye)}
            icon={TrendingUp}
            tone="success"
            hint={`Recouvrement ${k.tauxRecouvrement.toFixed(1)}%`}
          />
        </div>
        <div className="animate-slide-up stagger-3">
          <KpiCard
            label="Reste à recouvrer"
            value={formatTND(k.montantImpaye)}
            icon={TrendingDown}
            tone="danger"
            hint={`${k.nbImpayees} factures`}
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <KpiCard
            label="Taux d'impayés"
            value={`${k.tauxImpaye.toFixed(1)}%`}
            icon={Calendar}
            tone="warning"
            hint="Factures en retard + impayées"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={() => window.print()}
          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 no-print"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground transition-transform duration-200 group-hover:scale-110">
            <Printer className="size-5" />
          </span>
          <div>
            <span className="text-sm font-medium">Imprimer le rapport</span>
            <p className="text-xs text-muted-foreground">Vue imprimable PDF</p>
          </div>
        </button>
        <button
          onClick={exportInvoicesCSV}
          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
            <FileText className="size-5" />
          </span>
          <div>
            <span className="text-sm font-medium">Export factures CSV</span>
            <p className="text-xs text-muted-foreground">{invoices.length} factures</p>
          </div>
          <Download className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
        </button>
        <button
          onClick={exportPaymentsCSV}
          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-success/12 text-success transition-transform duration-200 group-hover:scale-110">
            <FileSpreadsheet className="size-5" />
          </span>
          <div>
            <span className="text-sm font-medium">Export paiements CSV</span>
            <p className="text-xs text-muted-foreground">{payments.length} paiements</p>
          </div>
          <Download className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
        </button>
        <button
          onClick={() =>
            toast.success("Relances envoyées", {
              description: `${alertes.length} clients notifiés (rappel amiable).`,
            })
          }
          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-warning/18 text-warning-foreground transition-transform duration-200 group-hover:scale-110">
            <BellRing className="size-5" />
          </span>
          <div>
            <span className="text-sm font-medium">Lancer les relances</span>
            <p className="text-xs text-muted-foreground">{alertes.length} clients concernés</p>
          </div>
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Facturé vs encaissé par mois</h2>
            <button
              onClick={exportMonthlyReportCSV}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-secondary"
            >
              <Download className="size-3" />
              Exporter
            </button>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: number) => formatTND(v)}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="facture" name="Facturé" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paye" name="Encaissé" fill="var(--success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Synthèse</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Total facturé", formatTND(k.totalFacture)],
                ["Total encaissé", formatTND(k.totalPaye)],
                ["Reste à recouvrer", formatTND(k.montantImpaye)],
                ["Taux de recouvrement", `${k.tauxRecouvrement.toFixed(1)} %`],
                ["Taux d'impayés", `${k.tauxImpaye.toFixed(1)} %`],
                ["Factures émises", String(k.nbFactures)],
              ].map(([label, v]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Répartition statuts</h2>
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={35}
                    outerRadius={60}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Méthodes de paiement</h2>
            <ul className="mt-3 space-y-2">
              {paymentMethods.map((pm) => (
                <li key={pm.method} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {methodLabels[pm.method] ?? pm.method}
                  </span>
                  <span className="font-medium tabular-nums">{formatTND(pm.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications de recouvrement</h2>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Du"
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Au"
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
          </div>
        </div>
        <ul className="divide-y divide-border">
          {alertes.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
            >
              <div>
                <p className="text-sm font-medium">{clientById(f.clientId)?.nom}</p>
                <p className="text-xs text-muted-foreground">
                  {f.id} · échéance dépassée le {formatDate(f.dateEcheance)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold tabular-nums">
                  {formatTND(f.montant - f.montantPaye)}
                </span>
                <StatusBadge status={f.statut} />
              </div>
            </li>
          ))}
          {alertes.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">
              Aucune notification pour cette période.
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
