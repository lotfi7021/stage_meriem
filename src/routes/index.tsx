import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowRight,
  Clock,
  FileText,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { KpiCard, PageHeader } from "@/components/steg/kpi-card";
import { StatusBadge, RiskBadge } from "@/components/steg/badges";
import {
  useStegStore,
  computeKpis,
  computeMonthlySeries,
  computeStatusBreakdown,
  computeRiskScores,
  formatTND,
  formatDate,
  clientById,
  PIE_COLORS,
  tooltipStyle,
} from "@/lib/store";
import type { Invoice, Payment, RiskScore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord financier — STEG FinTech" },
      {
        name: "description",
        content:
          "KPIs de facturation et de recouvrement STEG : total facturé, encaissé, taux d'impayés et évolution mensuelle.",
      },
      { property: "og:title", content: "Tableau de bord financier — STEG FinTech" },
      {
        property: "og:description",
        content: "Suivi centralisé des factures, paiements et risques clients de la STEG.",
      },
    ],
  }),
  component: Dashboard,
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function Dashboard() {
  const clients = useStegStore((s) => s.clients);
  const invoices = useStegStore((s) => s.invoices);
  const payments = useStegStore((s) => s.payments);

  const riskScores = useMemo(() => computeRiskScores({ clients, invoices }), [clients, invoices]);
  const k = useMemo(() => computeKpis({ clients, invoices }), [clients, invoices]);
  const series = useMemo(() => computeMonthlySeries(invoices), [invoices]);
  const pie = useMemo(() => computeStatusBreakdown(invoices), [invoices]);

  const retards = useMemo(
    () =>
      invoices
        .filter((i) => i.statut === "en_retard" || i.statut === "impayee")
        .sort((a, b) => a.dateEcheance.localeCompare(b.dateEcheance))
        .slice(0, 6),
    [invoices],
  );

  const topRisk = useMemo(
    () => [...riskScores].sort((a, b) => b.score - a.score).slice(0, 5),
    [riskScores],
  );

  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => b.datePaiement.localeCompare(a.datePaiement))
        .slice(0, 5),
    [payments],
  );

  const lastMonth = series[series.length - 2];
  const currentMonth = series[series.length - 1];
  const evolutionFacture =
    lastMonth && currentMonth
      ? ((currentMonth.facture - lastMonth.facture) / lastMonth.facture) * 100
      : 0;
  const evolutionPaye =
    lastMonth && currentMonth ? ((currentMonth.paye - lastMonth.paye) / lastMonth.paye) * 100 : 0;

  return (
    <>
      <div className="animate-fade-in">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{getGreeting()},</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Tableau de bord financier
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Vue consolidée de la facturation, des encaissements et des risques clients.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/factures"
              className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50"
            >
              <FileText className="size-4" />
              Factures
              <ArrowRight className="size-3" />
            </Link>
            <Link
              to="/paiements"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <CreditCard className="size-4" />
              Paiements
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="animate-slide-up stagger-1">
          <KpiCard
            label="Total facturé"
            value={formatTND(k.totalFacture)}
            icon={Banknote}
            hint={`${k.nbFactures} factures`}
            trend={evolutionFacture}
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <KpiCard
            label="Total encaissé"
            value={formatTND(k.totalPaye)}
            icon={TrendingUp}
            tone="success"
            hint={`Taux de recouvrement ${k.tauxRecouvrement.toFixed(1)} %`}
            trend={evolutionPaye}
          />
        </div>
        <div className="animate-slide-up stagger-3">
          <KpiCard
            label="Montant impayé"
            value={formatTND(k.montantImpaye)}
            icon={AlertTriangle}
            tone="danger"
            hint={`${k.nbImpayees} factures en retard / impayées`}
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <KpiCard
            label="Clients actifs"
            value={String(k.nbClients)}
            icon={Users}
            tone="warning"
            hint={`Taux d'impayés ${k.tauxImpaye.toFixed(1)} %`}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="animate-slide-up stagger-3 rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Évolution mensuelle (12 mois)</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                Facturé
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" />
                Encaissé
              </span>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gFact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPaye" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: number) => formatTND(v)}
                  contentStyle={tooltipStyle}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="facture"
                  name="Facturé"
                  stroke="var(--primary)"
                  fill="url(#gFact)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="paye"
                  name="Encaissé"
                  stroke="var(--success)"
                  fill="url(#gPaye)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="animate-slide-up stagger-4 rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">Répartition des statuts</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="valeur" nameKey="statut" innerRadius={55} outerRadius={90}>
                  {pie.map((entry, i) => (
                    <Cell key={entry.key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="animate-slide-up stagger-5 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Retards de paiement</h2>
            <Link to="/factures" className="text-xs font-medium text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {retards.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {clientById(f.clientId, clients)?.nom}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {f.id} · échéance {formatDate(f.dateEcheance)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums">{formatTND(f.montant)}</span>
                  <StatusBadge status={f.statut} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-slide-up stagger-5 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Derniers paiements</h2>
            <Link to="/paiements" className="text-xs font-medium text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {recentPayments.map((p) => {
              const f = invoices.find((i) => i.id === p.factureId);
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {f ? clientById(f.clientId, clients)?.nom : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.id} · {formatDate(p.datePaiement)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-success">
                    +{formatTND(p.montant)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="animate-slide-up stagger-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Clients les plus à risque</h2>
            <Link to="/risques" className="text-xs font-medium text-primary hover:underline">
              Analyse IA
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {topRisk.map((r) => (
              <li key={r.clientId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {clientById(r.clientId, clients)?.nom}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.clientId}</p>
                </div>
                <RiskBadge categorie={r.categorie} score={r.score} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
