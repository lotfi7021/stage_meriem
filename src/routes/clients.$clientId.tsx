import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, TrendingUp, AlertTriangle, FileText, Clock } from "lucide-react";
import { PageHeader, KpiCard } from "@/components/steg/kpi-card";
import { RiskBadge, StatusBadge } from "@/components/steg/badges";
import { Pagination, PerPageSelect } from "@/components/steg/pagination";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { useRequirePermission } from "@/hooks/use-require-permission";
import {
  useStegStore,
  computeRiskScores,
  formatTND,
  formatDate,
  typeLabels,
  riskBarColor,
  clientById,
} from "@/lib/store";

export const Route = createFileRoute("/clients/$clientId")({
  head: () => ({
    meta: [
      { title: "Fiche client — STEG FinTech" },
      {
        name: "description",
        content: "Historique de facturation, paiements et score de risque IA d'un client STEG.",
      },
      { property: "og:title", content: "Fiche client — STEG FinTech" },
      {
        property: "og:description",
        content: "Détail des factures, encours et facteurs de risque du client.",
      },
    ],
  }),
  component: ClientDetail,
});

function ClientDetail() {
  const { clientId } = Route.useParams();
  const { clients, invoices, payments } = useStegStore();

  const ok = useRequirePermission("clients:view");
  if (!ok) return <UnauthorizedPage />;

  const client = clientById(clientId, clients);

  const riskScores = useMemo(
    () => computeRiskScores({ clients, invoices }),
    [clients, invoices],
  );

  const risk = client ? riskScores.find((r) => r.clientId === client.id) : null;

  const [invPage, setInvPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const perPage = 8;

  const inv = useMemo(
    () =>
      client
        ? invoices
            .filter((i) => i.clientId === client.id)
            .sort((a, b) => b.dateEmission.localeCompare(a.dateEmission))
        : [],
    [client, invoices],
  );
  const encours = inv.reduce((s, i) => s + (i.montant - i.montantPaye), 0);

  const clientPayments = useMemo(() => {
    const invoiceIds = new Set(inv.map((i) => i.id));
    return payments.filter((p) => invoiceIds.has(p.factureId));
  }, [inv, payments]);

  const stats = useMemo(
    () => ({
      totalFacture: inv.reduce((s, i) => s + i.montant, 0),
      totalPaye: inv.reduce((s, i) => s + i.montantPaye, 0),
      nbPayees: inv.filter((i) => i.statut === "payee").length,
      nbImpayees: inv.filter((i) => i.statut === "en_retard" || i.statut === "impayee").length,
    }),
    [inv],
  );

  const tauxRecouvrement =
    stats.totalFacture > 0 ? (stats.totalPaye / stats.totalFacture) * 100 : 0;

  const paginatedInv = inv.slice((invPage - 1) * perPage, invPage * perPage);
  const paginatedPayments = clientPayments.slice((payPage - 1) * perPage, payPage * perPage);

  if (!client || !risk) {
    return <p className="text-sm text-muted-foreground">Client introuvable.</p>;
  }

  return (
    <>
      <Link
        to="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux clients
      </Link>
      <PageHeader
        title={client.nom}
        subtitle={`${client.id} · ${typeLabels[client.type]} · ${client.secteur}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up stagger-1">
          <KpiCard
            label="Total facturé"
            value={formatTND(stats.totalFacture)}
            icon={FileText}
            hint={`${inv.length} factures`}
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <KpiCard
            label="Total encaissé"
            value={formatTND(stats.totalPaye)}
            icon={TrendingUp}
            tone="success"
            hint={`${tauxRecouvrement.toFixed(1)}% recouvré`}
          />
        </div>
        <div className="animate-slide-up stagger-3">
          <KpiCard
            label="Reste à recouvrer"
            value={formatTND(encours)}
            icon={AlertTriangle}
            tone={encours > 0 ? "danger" : "success"}
            hint={`${stats.nbImpayees} factures en retard`}
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <KpiCard
            label="Score de risque"
            value={`${risk.score}/100`}
            icon={Clock}
            tone={
              risk.categorie === "eleve"
                ? "danger"
                : risk.categorie === "moyen"
                  ? "warning"
                  : "success"
            }
            hint={
              risk.categorie === "eleve"
                ? "Risque élevé"
                : risk.categorie === "moyen"
                  ? "Risque moyen"
                  : "Risque faible"
            }
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="animate-slide-up stagger-3 rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Informations</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            {[
              ["Secteur", client.secteur],
              ["Adresse", client.adresse],
              [
                "Ancienneté",
                `${Math.floor(client.ancienneteMois / 12)} ans (${client.ancienneteMois} mois)`,
              ],
              ["Retards passés", String(client.retardsPasses)],
              ["Délai moyen", `${client.delaiMoyenJours} jours`],
              ["Encours", formatTND(encours)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-slide-up stagger-4 rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Score de risque IA</h2>
            <RiskBadge categorie={risk.categorie} score={risk.score} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Modèle de classification (régression logistique) · calculé le{" "}
            {formatDate(risk.dateCalcul)}
          </p>

          <div className="mt-4 h-4 rounded-full bg-secondary">
            <div
              className={`h-4 rounded-full transition-all ${riskBarColor(risk.categorie)}`}
              style={{ width: `${risk.score}%` }}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {risk.facteurs.map((f) => (
              <div key={f.label} className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium tabular-nums">{f.poids} pts</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary">
                  <div
                    className={`h-1.5 rounded-full ${
                      f.poids > 15 ? "bg-danger" : f.poids > 8 ? "bg-warning" : "bg-success"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, f.poids * 2.5))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            Historique de facturation ({inv.length} factures)
          </h2>
          <span className="text-xs text-muted-foreground">
            {stats.nbPayees} payées · {stats.nbImpayees} en retard
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Facture</th>
              <th scope="col" className="px-4 py-3 font-medium">Émission</th>
              <th scope="col" className="px-4 py-3 font-medium">Échéance</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Montant</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Payé</th>
              <th scope="col" className="px-4 py-3 font-medium">Progression</th>
              <th scope="col" className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedInv.map((f) => {
              const pct = f.montant > 0 ? (f.montantPaye / f.montant) * 100 : 0;
              return (
                <tr key={f.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{f.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(f.dateEmission)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(f.dateEcheance)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTND(f.montant)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTND(f.montantPaye)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-secondary">
                        <div
                          className={`h-1.5 rounded-full ${pct >= 100 ? "bg-success" : pct > 0 ? "bg-warning" : "bg-danger"}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.statut} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={invPage} total={inv.length} perPage={perPage} onPageChange={setInvPage} />
      </div>

      {clientPayments.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
            Historique des paiements ({clientPayments.length})
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Paiement</th>
                <th scope="col" className="px-4 py-3 font-medium">Facture</th>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Méthode</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPayments.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{p.id}</td>
                  <td className="px-4 py-3">{p.factureId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.datePaiement)}</td>
                  <td className="px-4 py-3">{p.methode}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-success">
                    +{formatTND(p.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={payPage}
            total={clientPayments.length}
            perPage={perPage}
            onPageChange={setPayPage}
          />
        </div>
      )}
    </>
  );
}
