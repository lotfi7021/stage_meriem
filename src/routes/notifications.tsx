import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Bell, BellOff, CheckCheck, AlertTriangle, Clock, FileText, Filter } from "lucide-react";
import { PageHeader } from "@/components/steg/kpi-card";
import { StatusBadge } from "@/components/steg/badges";
import { Pagination, PerPageSelect } from "@/components/steg/pagination";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { clientById, formatDate, formatTND, invoices, type InvoiceStatus } from "@/lib/steg-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — STEG FinTech" },
      {
        name: "description",
        content: "Centre de notifications et alertes de recouvrement STEG.",
      },
      { property: "og:title", content: "Notifications — STEG FinTech" },
    ],
  }),
  component: NotificationsPage,
});

interface Notification {
  id: string;
  type: "retard" | "impayee" | "echeance";
  invoiceId: string;
  clientId: string;
  message: string;
  montant: number;
  date: string;
  lu: boolean;
}

function buildNotifications(): Notification[] {
  const today = new Date("2026-08-24");
  const notifs: Notification[] = [];
  let n = 1;

  invoices.forEach((f) => {
    const client = clientById(f.clientId);
    if (!client) return;

    if (f.statut === "impayee") {
      const daysLate = Math.floor(
        (today.getTime() - new Date(f.dateEcheance).getTime()) / (1000 * 60 * 60 * 24),
      );
      notifs.push({
        id: `NOTIF-${String(n++).padStart(5, "0")}`,
        type: "impayee",
        invoiceId: f.id,
        clientId: f.clientId,
        message: `Facture ${f.id} impayée depuis ${daysLate} jours`,
        montant: f.montant - f.montantPaye,
        date: f.dateEcheance,
        lu: n % 3 === 0,
      });
    } else if (f.statut === "en_retard") {
      const daysLate = Math.floor(
        (today.getTime() - new Date(f.dateEcheance).getTime()) / (1000 * 60 * 60 * 24),
      );
      notifs.push({
        id: `NOTIF-${String(n++).padStart(5, "0")}`,
        type: "retard",
        invoiceId: f.id,
        clientId: f.clientId,
        message: `Facture ${f.id} en retard de ${daysLate} jours`,
        montant: f.montant - f.montantPaye,
        date: f.dateEcheance,
        lu: n % 4 === 0,
      });
    } else if (f.statut === "en_attente") {
      const daysUntil = Math.floor(
        (new Date(f.dateEcheance).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysUntil <= 7 && daysUntil > 0) {
        notifs.push({
          id: `NOTIF-${String(n++).padStart(5, "0")}`,
          type: "echeance",
          invoiceId: f.id,
          clientId: f.clientId,
          message: `Facture ${f.id} due dans ${daysUntil} jours`,
          montant: f.montant - f.montantPaye,
          date: f.dateEcheance,
          lu: false,
        });
      }
    }
  });

  return notifs.sort((a, b) => b.date.localeCompare(a.date));
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(buildNotifications);
  const [filterType, setFilterType] = useState<"tous" | "retard" | "impayee" | "echeance">("tous");
  const [filterLu, setFilterLu] = useState<"tous" | "lu" | "non_lu">("tous");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filterType !== "tous" && n.type !== filterType) return false;
      if (filterLu === "lu" && !n.lu) return false;
      if (filterLu === "non_lu" && n.lu) return false;
      return true;
    });
  }, [notifications, filterType, filterLu]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  const typeConfig = {
    retard: { icon: Clock, color: "text-warning-foreground", bg: "bg-warning/18", label: "Retard" },
    impayee: { icon: AlertTriangle, color: "text-danger", bg: "bg-danger/12", label: "Impayée" },
    echeance: { icon: FileText, color: "text-info", bg: "bg-info/12", label: "Échéance" },
  };

  const ok = useRequirePermission("notifications:view");
  if (!ok) return <UnauthorizedPage />;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} non lues · ${notifications.length} au total`}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as typeof filterType);
              setPage(1);
            }}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="tous">Tous les types</option>
            <option value="retard">Retards</option>
            <option value="impayee">Impayées</option>
            <option value="echeance">Échéances proches</option>
          </select>
          <select
            value={filterLu}
            onChange={(e) => {
              setFilterLu(e.target.value as typeof filterLu);
              setPage(1);
            }}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="tous">Tous</option>
            <option value="non_lu">Non lues</option>
            <option value="lu">Lues</option>
          </select>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50"
          >
            <CheckCheck className="size-4" />
            Tout marquer comme lu
          </button>
        )}
        <PerPageSelect
          value={perPage}
          onChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <BellOff className="size-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Aucune notification pour ce filtre.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {paginated.map((n) => {
              const config = typeConfig[n.type];
              const Icon = config.icon;
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-4 px-4 py-4 transition-colors hover:bg-secondary/30 ${
                    !n.lu ? "bg-primary/5" : ""
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${config.bg} ${config.color}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.lu ? "font-semibold" : "font-medium"}`}>
                        {n.message}
                      </p>
                      {!n.lu && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{clientById(n.clientId)?.nom}</span>
                      <span>·</span>
                      <span>{formatDate(n.date)}</span>
                      <span>·</span>
                      <span className="font-medium tabular-nums">{formatTND(n.montant)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={
                        n.type === "impayee"
                          ? "impayee"
                          : n.type === "retard"
                            ? "en_retard"
                            : "en_attente"
                      }
                    />
                    {!n.lu && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="rounded-md border border-input px-2 py-1 text-xs hover:bg-secondary"
                      >
                        Marquer lu
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} total={filtered.length} perPage={perPage} onPageChange={setPage} />
      </div>
    </>
  );
}
