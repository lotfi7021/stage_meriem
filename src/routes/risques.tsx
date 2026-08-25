import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader, KpiCard } from "@/components/steg/kpi-card";
import { RiskBadge } from "@/components/steg/badges";
import { Pagination, PerPageSelect } from "@/components/steg/pagination";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { ShieldAlert, ShieldCheck, Shield, ChevronDown, ChevronUp, Search } from "lucide-react";
import { clientById, riskScores, typeLabels, type RiskCategory } from "@/lib/steg-data";

export const Route = createFileRoute("/risques")({
  head: () => ({
    meta: [
      { title: "Analyse de risque IA — STEG FinTech" },
      {
        name: "description",
        content:
          "Scoring de risque d'impayé par client, calculé par le module de Machine Learning (0-100).",
      },
      { property: "og:title", content: "Analyse de risque IA — STEG FinTech" },
      {
        property: "og:description",
        content: "Probabilité de retard de paiement et facteurs explicatifs du modèle.",
      },
    ],
  }),
  component: RiskPage,
});

const pieColors = {
  faible: "var(--success)",
  moyen: "var(--warning)",
  eleve: "var(--danger)",
};

function RiskPage() {
  const sorted = [...riskScores].sort((a, b) => b.score - a.score);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [filterCategorie, setFilterCategorie] = useState<RiskCategory | "tous">("tous");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const counts = {
    faible: sorted.filter((r) => r.categorie === "faible").length,
    moyen: sorted.filter((r) => r.categorie === "moyen").length,
    eleve: sorted.filter((r) => r.categorie === "eleve").length,
  };

  const filtered = useMemo(() => {
    let list = sorted;
    if (filterCategorie !== "tous") {
      list = list.filter((r) => r.categorie === filterCategorie);
    }
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((r) => {
        const c = clientById(r.clientId);
        return c?.nom.toLowerCase().includes(t) || r.clientId.toLowerCase().includes(t);
      });
    }
    return list;
  }, [sorted, filterCategorie, q]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

  const chart = sorted.slice(0, 10).map((r) => ({
    nom: (clientById(r.clientId)?.nom ?? "").slice(0, 16),
    score: r.score,
  }));

  const distribution = [
    { name: "Faible", value: counts.faible },
    { name: "Moyen", value: counts.moyen },
    { name: "Élevé", value: counts.eleve },
  ];

  const avgScore = sorted.length
    ? (sorted.reduce((s, r) => s + r.score, 0) / sorted.length).toFixed(1)
    : "0";

  const ok = useRequirePermission("risques:view");
  if (!ok) return <UnauthorizedPage />;

  return (
    <>
      <PageHeader
        title="Analyse de risque"
        subtitle="Score de risque d'impayé (0-100) issu du modèle de classification — features : historique de paiement, montant, ancienneté, type de client."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up stagger-1">
          <KpiCard
            label="Risque faible"
            value={String(counts.faible)}
            icon={ShieldCheck}
            tone="success"
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <KpiCard label="Risque moyen" value={String(counts.moyen)} icon={Shield} tone="warning" />
        </div>
        <div className="animate-slide-up stagger-3">
          <KpiCard
            label="Risque élevé"
            value={String(counts.eleve)}
            icon={ShieldAlert}
            tone="danger"
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <KpiCard label="Score moyen" value={avgScore} icon={Shield} hint="Sur 100" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold">Top 10 des scores de risque</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  type="category"
                  dataKey="nom"
                  width={130}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="score" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Répartition des risques</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={65}
                >
                  {distribution.map((entry, i) => (
                    <Cell key={i} fill={Object.values(pieColors)[i]} />
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
          <ul className="mt-2 space-y-1 text-sm">
            {distribution.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: Object.values(pieColors)[i] }}
                  />
                  {d.name}
                </span>
                <span className="font-semibold tabular-nums">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un client…"
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={filterCategorie}
          onChange={(e) => {
            setFilterCategorie(e.target.value as RiskCategory | "tous");
            setPage(1);
          }}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="tous">Toutes catégories</option>
          <option value="faible">Risque faible</option>
          <option value="moyen">Risque moyen</option>
          <option value="eleve">Risque élevé</option>
        </select>
        <PerPageSelect
          value={perPage}
          onChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
          options={[5, 10, 20, 50]}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Facteur dominant</th>
              <th className="px-4 py-3 text-right font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((r) => {
              const c = clientById(r.clientId)!;
              const top = [...r.facteurs].sort((a, b) => b.poids - a.poids)[0]!;
              const isExpanded = expandedClient === r.clientId;
              return (
                <>
                  <tr
                    key={r.clientId}
                    className="cursor-pointer transition-colors hover:bg-secondary/40"
                    onClick={() => setExpandedClient(isExpanded ? null : r.clientId)}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/clients/$clientId"
                        params={{ clientId: c.id }}
                        className="font-medium text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{typeLabels[c.type]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{top.label}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{r.score}</td>
                    <td className="px-4 py-3">
                      <RiskBadge categorie={r.categorie} />
                    </td>
                    <td className="px-4 py-3">
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${r.clientId}-detail`}>
                      <td colSpan={6} className="bg-secondary/20 px-4 py-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Détail des facteurs de risque
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {r.facteurs.map((f) => (
                            <div
                              key={f.label}
                              className="rounded-lg border border-border bg-card p-3"
                            >
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{f.label}</span>
                                <span className="font-medium tabular-nums">{f.poids} pts</span>
                              </div>
                              <div className="mt-2 h-2 rounded-full bg-secondary">
                                <div
                                  className={`h-2 rounded-full ${
                                    f.poids > 15
                                      ? "bg-danger"
                                      : f.poids > 8
                                        ? "bg-warning"
                                        : "bg-success"
                                  }`}
                                  style={{ width: `${Math.max(0, Math.min(100, f.poids * 2.5))}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Link
                            to="/clients/$clientId"
                            params={{ clientId: c.id }}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Voir la fiche complète →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Aucun client trouvé.</p>
        )}
        <Pagination page={page} total={filtered.length} perPage={perPage} onPageChange={setPage} />
      </div>
    </>
  );
}
