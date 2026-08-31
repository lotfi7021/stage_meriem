import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { ArrowUpDown, ArrowUp, ArrowDown, X, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/steg/kpi-card";
import { StatusBadge } from "@/components/steg/badges";
import { Pagination, PerPageSelect } from "@/components/steg/pagination";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { useAuth } from "@/context/auth";
import { InvoiceForm } from "@/components/steg/invoice-form";
import { ConfirmDialog } from "@/components/steg/confirm-dialog";
import {
  useStegStore,
  computeRiskScores,
  formatTND,
  formatDate,
  clientById,
  statusLabels,
  DEFAULT_PER_PAGE,
  tooltipStyle,
  riskBarColor,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/store";

export const Route = createFileRoute("/factures")({
  head: () => ({
    meta: [
      { title: "Gestion des factures — STEG FinTech" },
      {
        name: "description",
        content:
          "Suivi des factures STEG par statut et période : payées, en attente, en retard et impayées.",
      },
      { property: "og:title", content: "Gestion des factures — STEG FinTech" },
      {
        property: "og:description",
        content: "Filtres par statut et période, détection automatique des retards de paiement.",
      },
    ],
  }),
  component: InvoicesPage,
});

type SortKey = "id" | "dateEmission" | "dateEcheance" | "montant" | "reste";
type SortDir = "asc" | "desc";

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="size-3 opacity-40" />;
  return sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
}

function InvoicesPage() {
  const ok = useRequirePermission("factures:view");
  const { hasPermission } = useAuth();
  const canManage = hasPermission("factures:manage");

  const { clients, invoices, addInvoice, updateInvoice, deleteInvoice } = useStegStore();

  const [statut, setStatut] = useState<InvoiceStatus | "tous">("tous");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dateEmission");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const riskScores = useMemo(() => computeRiskScores({ clients, invoices }), [clients, invoices]);

  const rows = useMemo(() => {
    const filtered = invoices
      .filter((i) => statut === "tous" || i.statut === statut)
      .filter((i) => {
        const t = q.toLowerCase().trim();
        if (!t) return true;
        return (
          i.id.toLowerCase().includes(t) ||
          (clientById(i.clientId, clients)?.nom ?? "").toLowerCase().includes(t)
        );
      });

    return filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id":
          cmp = a.id.localeCompare(b.id);
          break;
        case "dateEmission":
          cmp = a.dateEmission.localeCompare(b.dateEmission);
          break;
        case "dateEcheance":
          cmp = a.dateEcheance.localeCompare(b.dateEcheance);
          break;
        case "montant":
          cmp = a.montant - b.montant;
          break;
        case "reste":
          cmp = a.montant - a.montantPaye - (b.montant - b.montantPaye);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [statut, q, sortKey, sortDir, invoices, clients]);

  const total = rows.reduce((s, i) => s + i.montant, 0);
  const totalReste = rows.reduce((s, i) => s + (i.montant - i.montantPaye), 0);

  const paginatedRows = rows.slice((page - 1) * perPage, page * perPage);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir(sortDir === "asc" ? "desc" : "asc");
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey, sortDir],
  );

  const detail = selectedInvoice ? invoices.find((i) => i.id === selectedInvoice) : null;

  const stats = useMemo(
    () => ({
      payee: invoices.filter((i) => i.statut === "payee").length,
      en_attente: invoices.filter((i) => i.statut === "en_attente").length,
      en_retard: invoices.filter((i) => i.statut === "en_retard").length,
      impayee: invoices.filter((i) => i.statut === "impayee").length,
    }),
    [invoices],
  );

  function handleCreate(data: Omit<Invoice, "id">) {
    addInvoice(data);
    setShowForm(false);
    toast.success("Facture créée", { description: "La facture a été ajoutée." });
  }

  function handleUpdate(data: Omit<Invoice, "id">) {
    if (!editInvoice) return;
    updateInvoice(editInvoice.id, data);
    setEditInvoice(null);
    toast.success("Facture modifiée", { description: "La facture a été mise à jour." });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteInvoice(deleteTarget.id);
    setDeleteTarget(null);
    setSelectedInvoice(null);
    toast.success("Facture supprimée", { description: "La facture a été supprimée." });
  }

  if (!ok) return <UnauthorizedPage />;

  return (
    <>
      <PageHeader
        title="Factures"
        subtitle={`${rows.length} factures · ${formatTND(total)} facturés · ${formatTND(totalReste)} reste dû`}
        action={
          canManage
            ? { label: "Nouvelle facture", icon: Plus, onClick: () => setShowForm(true) }
            : undefined
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
          <p className="text-lg font-semibold text-success">{stats.payee}</p>
          <p className="text-xs text-muted-foreground">Payées</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
          <p className="text-lg font-semibold text-warning-foreground">{stats.en_attente}</p>
          <p className="text-xs text-muted-foreground">En attente</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
          <p className="text-lg font-semibold text-danger">{stats.en_retard}</p>
          <p className="text-xs text-muted-foreground">En retard</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center shadow-card">
          <p className="text-lg font-semibold text-danger">{stats.impayee}</p>
          <p className="text-xs text-muted-foreground">Impayées</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher une facture ou un client…"
          aria-label="Rechercher une facture ou un client"
          className="min-w-56 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        <select
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value as InvoiceStatus | "tous");
            setPage(1);
          }}
          aria-label="Filtrer par statut"
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="tous">Tous les statuts</option>
          {(Object.keys(statusLabels) as InvoiceStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <PerPageSelect
          value={perPage}
          onChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {(
                [
                  ["id", "Facture"],
                  ["", "Client"],
                  ["dateEmission", "Émission"],
                  ["dateEcheance", "Échéance"],
                  ["montant", "Montant"],
                  ["reste", "Reste dû"],
                  ["", "Progression"],
                  ["", "Statut"],
                ] as const
              ).map(([key, label]) => (
                <th
                  key={label}
                  scope="col"
                  className={`px-4 py-3 font-medium ${key ? "cursor-pointer select-none hover:text-foreground" : ""} ${key === "montant" || key === "reste" ? "text-right" : ""}`}
                  onClick={() => key && toggleSort(key as SortKey)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {key && <SortIcon column={key as SortKey} sortKey={sortKey} sortDir={sortDir} />}
                  </span>
                </th>
              ))}
              {canManage && <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedRows.map((f) => {
              const reste = f.montant - f.montantPaye;
              const pct = f.montant > 0 ? (f.montantPaye / f.montant) * 100 : 0;
              return (
                <tr
                  key={f.id}
                  className="cursor-pointer transition-colors hover:bg-secondary/40"
                  onClick={() => setSelectedInvoice(f.id)}
                >
                  <td className="px-4 py-3 font-medium">{f.id}</td>
                  <td className="px-4 py-3">{clientById(f.clientId, clients)?.nom}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(f.dateEmission)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(f.dateEcheance)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTND(f.montant)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {reste > 0 ? formatTND(reste) : <span className="text-success">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-secondary">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            pct >= 100 ? "bg-success" : pct > 0 ? "bg-warning" : "bg-danger"
                          }`}
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
                  {canManage && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditInvoice(f)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Modifier"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(f)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/12 hover:text-danger"
                          title="Supprimer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={page} total={rows.length} perPage={perPage} onPageChange={setPage} />
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{detail.id}</h2>
                <p className="text-sm text-muted-foreground">
                  {clientById(detail.clientId, clients)?.nom}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedInvoice(null);
                        setEditInvoice(detail);
                      }}
                      className="grid size-8 place-items-center rounded-lg hover:bg-secondary"
                      title="Modifier"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInvoice(null);
                        setDeleteTarget(detail);
                      }}
                      className="grid size-8 place-items-center rounded-lg hover:bg-danger/12 hover:text-danger"
                      title="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="grid size-8 place-items-center rounded-lg hover:bg-secondary"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Montant total</p>
                <p className="text-lg font-semibold tabular-nums">{formatTND(detail.montant)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Montant payé</p>
                <p className="text-lg font-semibold tabular-nums text-success">
                  {formatTND(detail.montantPaye)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reste dû</p>
                <p className="text-lg font-semibold tabular-nums text-danger">
                  {formatTND(detail.montant - detail.montantPaye)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Statut</p>
                <StatusBadge status={detail.statut} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date d'émission</p>
                <p className="font-medium">{formatDate(detail.dateEmission)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date d'échéance</p>
                <p className="font-medium">{formatDate(detail.dateEcheance)}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1 text-xs text-muted-foreground">Progression du paiement</p>
              <div className="h-3 rounded-full bg-secondary">
                <div
                  className={`h-3 rounded-full transition-all ${
                    detail.montantPaye >= detail.montant
                      ? "bg-success"
                      : detail.montantPaye > 0
                        ? "bg-warning"
                        : "bg-danger"
                  }`}
                  style={{
                    width: `${detail.montant > 0 ? Math.min(100, (detail.montantPaye / detail.montant) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {detail.montant > 0 ? Math.round((detail.montantPaye / detail.montant) * 100) : 0}%
                payé
              </p>
            </div>

            {(() => {
              const risk = riskScores.find((r) => r.clientId === detail.clientId);
              if (!risk) return null;
              return (
                <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground">Score de risque du client</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-secondary">
                      <div
                        className={`h-2 rounded-full ${riskBarColor(risk.categorie)}`}
                        style={{ width: `${risk.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{risk.score}/100</span>
                  </div>
                </div>
              );
            })()}

            <div className="mt-4 flex justify-end gap-2">
              <Link
                to="/clients/$clientId"
                params={{ clientId: detail.clientId }}
                className="rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                Voir le client
              </Link>
              <Link
                to="/paiements"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Enregistrer un paiement
              </Link>
            </div>
          </div>
        </div>
      )}

      {showForm && <InvoiceForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
      {editInvoice && (
        <InvoiceForm
          invoice={editInvoice}
          onSubmit={handleUpdate}
          onCancel={() => setEditInvoice(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer la facture"
          description={`Voulez-vous vraiment supprimer la facture ${deleteTarget.id} ? Tous les paiements associés seront également supprimés. Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
