import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, CreditCard, Banknote, Smartphone, Wallet, Pencil, Trash2 } from "lucide-react";
import { PageHeader, KpiCard } from "@/components/steg/kpi-card";
import { Pagination, PerPageSelect } from "@/components/steg/pagination";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { useAuth } from "@/context/auth";
import { PaymentForm } from "@/components/steg/payment-form";
import { ConfirmDialog } from "@/components/steg/confirm-dialog";
import {
  useStegStore,
  methodLabels,
  formatTND,
  formatDate,
  clientById,
  DEFAULT_PER_PAGE,
  type Payment,
  type PaymentMethod,
} from "@/lib/store";

export const Route = createFileRoute("/paiements")({
  head: () => ({
    meta: [
      { title: "Paiements & rapprochement — STEG FinTech" },
      {
        name: "description",
        content:
          "Enregistrement des paiements clients STEG et rapprochement automatique avec les factures.",
      },
      { property: "og:title", content: "Paiements & rapprochement — STEG FinTech" },
      {
        property: "og:description",
        content: "Historique des encaissements par méthode et saisie d'un nouveau paiement.",
      },
    ],
  }),
  component: PaymentsPage,
});

const methodIcons: Record<string, typeof CreditCard> = {
  virement: Banknote,
  especes: Wallet,
  cheque: CreditCard,
  en_ligne: Smartphone,
};

function PaymentsPage() {
  const ok = useRequirePermission("paiements:view");
  const { hasPermission } = useAuth();
  const canManage = hasPermission("paiements:manage");

  const clients = useStegStore((s) => s.clients);
  const invoices = useStegStore((s) => s.invoices);
  const payments = useStegStore((s) => s.payments);
  const addPayment = useStegStore((s) => s.addPayment);
  const updatePayment = useStegStore((s) => s.updatePayment);
  const deletePayment = useStegStore((s) => s.deletePayment);

  const [factureId, setFactureId] = useState("");
  const [montant, setMontant] = useState("");
  const [methode, setMethode] = useState("virement");
  const [q, setQ] = useState("");
  const [filterMethode, setFilterMethode] = useState<string>("tous");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  const allFiltered = useMemo(() => {
    let filtered = payments;
    if (filterMethode !== "tous") {
      filtered = filtered.filter((p) => p.methode === filterMethode);
    }
    if (q.trim()) {
      const t = q.toLowerCase();
      filtered = filtered.filter((p) => {
        const f = invoices.find((i) => i.id === p.factureId);
        const clientName = f ? (clientById(f.clientId, clients)?.nom ?? "") : "";
        return (
          p.id.toLowerCase().includes(t) ||
          p.factureId.toLowerCase().includes(t) ||
          clientName.toLowerCase().includes(t)
        );
      });
    }
    return filtered.sort((a, b) => b.datePaiement.localeCompare(a.datePaiement));
  }, [payments, q, filterMethode, invoices, clients]);

  const liste = useMemo(
    () => allFiltered.slice((page - 1) * perPage, page * perPage),
    [allFiltered, page, perPage],
  );

  const total = payments.reduce((s, p) => s + p.montant, 0);

  const methodStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    payments.forEach((p) => {
      const existing = map.get(p.methode) ?? { count: 0, total: 0 };
      map.set(p.methode, { count: existing.count + 1, total: existing.total + p.montant });
    });
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [payments]);

  if (!ok) return <UnauthorizedPage />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const facture = invoices.find((i) => i.id === factureId.trim().toUpperCase());
    if (!facture) {
      toast.error("Facture introuvable", { description: "Vérifiez la référence (ex. FAC-00012)." });
      return;
    }
    const m = Number(montant);
    if (!m || m <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (m > facture.montant - facture.montantPaye) {
      toast.error("Montant dépasse le reste dû", {
        description: `Reste dû : ${formatTND(facture.montant - facture.montantPaye)}`,
      });
      return;
    }
    addPayment({
      factureId: facture.id,
      montant: m,
      datePaiement: new Date().toISOString().slice(0, 10),
      methode: methode as Payment["methode"],
    });
    toast.success("Paiement enregistré", {
      description: `${formatTND(m)} rapproché de la facture ${facture.id}.`,
    });
    setFactureId("");
    setMontant("");
  };

  function handleUpdate(data: Omit<Payment, "id">) {
    if (!editPayment) return;
    updatePayment(editPayment.id, data);
    setEditPayment(null);
    toast.success("Paiement modifié", { description: `Le paiement a été mis à jour.` });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deletePayment(deleteTarget.id);
    setDeleteTarget(null);
    toast.success("Paiement supprimé", { description: `Le paiement a été supprimé.` });
  }

  return (
    <>
      <PageHeader
        title="Paiements"
        subtitle={`${payments.length} encaissements enregistrés · ${formatTND(total)}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {methodStats.map(([method, stats]) => {
          const Icon = methodIcons[method] ?? CreditCard;
          return (
            <div key={method} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{methodLabels[method]}</p>
                  <p className="text-sm font-semibold tabular-nums">{formatTND(stats.total)}</p>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{stats.count} paiements</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <form
          onSubmit={submit}
          className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-1"
        >
          <h2 className="text-sm font-semibold">Enregistrer un paiement</h2>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block">
              <span className="text-xs text-muted-foreground">Référence facture</span>
              <input
                aria-label="Référence facture"
                value={factureId}
                onChange={(e) => setFactureId(e.target.value)}
                placeholder="FAC-00012"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Montant (TND)</span>
              <input
                aria-label="Montant en TND"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                inputMode="decimal"
                placeholder="1500"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Méthode</span>
              <select
                aria-label="Méthode de paiement"
                value={methode}
                onChange={(e) => setMethode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
              >
                {Object.entries(methodLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Enregistrer le paiement
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Historique des encaissements</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-label="Rechercher"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Rechercher…"
                  className="rounded-md border border-input bg-background py-1.5 pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <select
                aria-label="Filtrer par méthode"
                value={filterMethode}
                onChange={(e) => {
                  setFilterMethode(e.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              >
                <option value="tous">Toutes méthodes</option>
                {Object.entries(methodLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Paiement</th>
                <th scope="col" className="px-4 py-3 font-medium">Facture</th>
                <th scope="col" className="px-4 py-3 font-medium">Client</th>
                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                <th scope="col" className="px-4 py-3 font-medium">Méthode</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Montant</th>
                {canManage && <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {liste.map((p) => {
                const f = invoices.find((i) => i.id === p.factureId);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{p.id}</td>
                    <td className="px-4 py-3">{p.factureId}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {f ? clientById(f.clientId, clients)?.nom : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(p.datePaiement)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-xs">
                        {methodLabels[p.methode]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-success">
                      +{formatTND(p.montant)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditPayment(p)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            title="Modifier"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
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
          {liste.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Aucun paiement trouvé.</p>
          )}
          <Pagination
            page={page}
            total={allFiltered.length}
            perPage={perPage}
            onPageChange={setPage}
          />
        </div>
      </div>

      {editPayment && (
        <PaymentForm
          payment={editPayment}
          onSubmit={handleUpdate}
          onCancel={() => setEditPayment(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer le paiement"
          description={`Voulez-vous vraiment supprimer le paiement ${deleteTarget.id} ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
