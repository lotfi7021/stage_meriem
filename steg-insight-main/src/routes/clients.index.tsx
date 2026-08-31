import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/use-clients";
import { useInvoices } from "@/hooks/use-invoices";
import { useRiskScores } from "@/hooks/use-risk-scores";
import { toast } from "sonner";
import {
  Search,
  LayoutGrid,
  List,
  Building2,
  User,
  Landmark,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { PageHeader, KpiCard } from "@/components/steg/kpi-card";
import { RiskBadge } from "@/components/steg/badges";
import { Pagination, PerPageSelect } from "@/components/steg/pagination";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { ClientForm } from "@/components/steg/client-form";
import { ConfirmDialog } from "@/components/steg/confirm-dialog";
import { useAuth } from "@/context/auth";
import { requireRoutePermission } from "@/lib/route-guard";
import { formatTND, typeLabels, DEFAULT_PER_PAGE, riskBarColor } from "@/lib/store";
import type { Client, ClientType } from "@/lib/api";

export const Route = createFileRoute("/clients/")({
  beforeLoad: () => {
    requireRoutePermission("clients:view");
  },
  head: () => ({
    meta: [
      { title: "Gestion des clients — STEG FinTech" },
      {
        name: "description",
        content:
          "Répertoire des clients STEG : type, secteur, encours de facturation et score de risque IA.",
      },
      { property: "og:title", content: "Gestion des clients — STEG FinTech" },
      {
        property: "og:description",
        content: "Fiches clients, historique de paiement et scoring de risque.",
      },
    ],
  }),
  component: ClientsPage,
});

const typeIcons: Record<ClientType, typeof Building2> = {
  particulier: User,
  entreprise: Building2,
  administration: Landmark,
};

function ClientsPage() {
  const ok = useRequirePermission("clients:view");
  const { hasPermission } = useAuth();
  const canManage = hasPermission("clients:manage");
  const [q, setQ] = useState("");
  const [type, setType] = useState<ClientType | "tous">("tous");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useClients();
  const { data: invoices = [] } = useInvoices();
  const { data: riskScores = [] } = useRiskScores();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const rows = useMemo(
    () =>
      clients.filter(
        (c) =>
          (type === "tous" || c.type === type) &&
          c.nom.toLowerCase().includes(q.toLowerCase().trim()),
      ),
    [q, type, clients],
  );

  const paginatedRows = rows.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(
    () => ({
      particulier: clients.filter((c) => c.type === "particulier").length,
      entreprise: clients.filter((c) => c.type === "entreprise").length,
      administration: clients.filter((c) => c.type === "administration").length,
    }),
    [clients],
  );

  if (!ok) return <UnauthorizedPage />;

  function handleCreate(data: Omit<Client, "id">) {
    createClient.mutateAsync(data).then(() => {
      setShowForm(false);
      toast.success("Client créé", { description: `${data.nom} a été ajouté.` });
    });
  }

  function handleUpdate(data: Omit<Client, "id">) {
    if (!editClient) return;
    updateClient.mutateAsync({ id: editClient.id, data }).then(() => {
      setEditClient(null);
      toast.success("Client modifié", { description: `${data.nom} a été mis à jour.` });
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteClient.mutateAsync(deleteTarget.id).then(() => {
      setDeleteTarget(null);
      toast.success("Client supprimé", { description: `${deleteTarget.nom} a été supprimé.` });
    });
  }

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Répertoire clients avec encours et score de risque calculé par le module IA."
        action={
          canManage
            ? {
                label: "Nouveau client",
                icon: Plus,
                onClick: () => setShowForm(true),
              }
            : undefined
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="animate-slide-up stagger-1">
          <KpiCard
            label="Particuliers"
            value={String(stats.particulier)}
            icon={User}
            tone="primary"
            hint={`${clients.length ? ((stats.particulier / clients.length) * 100).toFixed(0) : 0}% du portefeuille`}
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <KpiCard
            label="Entreprises"
            value={String(stats.entreprise)}
            icon={Building2}
            tone="success"
            hint={`${clients.length ? ((stats.entreprise / clients.length) * 100).toFixed(0) : 0}% du portefeuille`}
          />
        </div>
        <div className="animate-slide-up stagger-3">
          <KpiCard
            label="Administrations"
            value={String(stats.administration)}
            icon={Landmark}
            tone="warning"
            hint={`${clients.length ? ((stats.administration / clients.length) * 100).toFixed(0) : 0}% du portefeuille`}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un client…"
            aria-label="Rechercher un client"
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as ClientType | "tous");
            setPage(1);
          }}
          aria-label="Filtrer par type de client"
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="tous">Tous les types</option>
          <option value="particulier">Particulier</option>
          <option value="entreprise">Entreprise</option>
          <option value="administration">Administration</option>
        </select>
        <div className="flex rounded-lg border border-input bg-card">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 rounded-l-lg px-3 py-2 text-sm transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`}
          >
            <List className="size-4" />
          </button>
          <button
            onClick={() => setView("cards")}
            className={`flex items-center gap-1.5 rounded-r-lg px-3 py-2 text-sm transition-colors ${view === "cards" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"}`}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
        <PerPageSelect
          value={perPage}
          onChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
          options={[6, 12, 20, 50]}
        />
      </div>

      {view === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Client
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Secteur
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Ancienneté
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Encours
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Risque
                </th>
                {canManage && (
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedRows.map((c) => {
                const inv = invoices.filter((i) => i.clientId === c.id);
                const encours = inv.reduce((s, i) => s + (i.montant - i.montantPaye), 0);
                const risk = riskScores.find((r) => r.clientId === c.id);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link
                        to="/clients/$clientId"
                        params={{ clientId: c.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.nom}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.id}</p>
                    </td>
                    <td className="px-4 py-3">{typeLabels[c.type]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.secteur}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {Math.floor(c.ancienneteMois / 12)} ans
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatTND(encours)}
                    </td>
                    <td className="px-4 py-3">
                      {risk ? <RiskBadge categorie={risk.categorie} score={risk.score} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditClient(c)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            title="Modifier"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
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
          {rows.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Aucun client trouvé.</p>
          )}
          <Pagination page={page} total={rows.length} perPage={perPage} onPageChange={setPage} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedRows.map((c) => {
              const inv = invoices.filter((i) => i.clientId === c.id);
              const encours = inv.reduce((s, i) => s + (i.montant - i.montantPaye), 0);
              const risk = riskScores.find((r) => r.clientId === c.id)!;
              const paidCount = inv.filter((i) => i.statut === "payee").length;
              const Icon = typeIcons[c.type];
              return (
                <div
                  key={c.id}
                  className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between">
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: c.id }}
                      className="flex items-center gap-3"
                    >
                      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                        {Icon && <Icon className="size-5" />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.id} · {typeLabels[c.type]}
                        </p>
                      </div>
                    </Link>
                    <RiskBadge categorie={risk.categorie} score={risk.score} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Secteur</p>
                      <p className="font-medium">{c.secteur}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ancienneté</p>
                      <p className="font-medium">{Math.floor(c.ancienneteMois / 12)} ans</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Encours</p>
                      <p className="font-semibold tabular-nums">{formatTND(encours)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Factures payées</p>
                      <p className="font-medium">
                        {paidCount}/{inv.length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className={`h-1.5 rounded-full ${riskBarColor(risk.categorie)}`}
                        style={{ width: `${risk.score}%` }}
                      />
                    </div>
                  </div>
                  {canManage && (
                    <div className="mt-3 flex justify-end gap-1 border-t border-border pt-3">
                      <button
                        onClick={() => setEditClient(c)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title="Modifier"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/12 hover:text-danger"
                        title="Supprimer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {rows.length === 0 && (
              <p className="col-span-full p-6 text-center text-sm text-muted-foreground">
                Aucun client trouvé.
              </p>
            )}
          </div>
          <Pagination
            page={page}
            total={rows.length}
            perPage={perPage}
            onPageChange={setPage}
            className="rounded-xl border border-border bg-card shadow-card"
          />
        </>
      )}

      {showForm && <ClientForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
      {editClient && (
        <ClientForm
          client={editClient}
          onSubmit={handleUpdate}
          onCancel={() => setEditClient(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer le client"
          description={`Voulez-vous vraiment supprimer ${deleteTarget.nom} ? Toutes les factures associées seront également supprimées. Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
