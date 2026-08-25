import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, CreditCard, Banknote, Smartphone, Wallet } from "lucide-react";
import { PageHeader, KpiCard } from "@/components/steg/kpi-card";
import { Pagination, PerPageSelect } from "@/components/steg/pagination";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { clientById, formatDate, formatTND, invoices, payments } from "@/lib/steg-data";

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

const methodLabels: Record<string, string> = {
  virement: "Virement",
  especes: "Espèces",
  cheque: "Chèque",
  en_ligne: "En ligne",
};

const methodIcons: Record<string, typeof CreditCard> = {
  virement: Banknote,
  especes: Wallet,
  cheque: CreditCard,
  en_ligne: Smartphone,
};

function PaymentsPage() {
  const [locaux, setLocaux] = useState<typeof payments>([]);
  const [factureId, setFactureId] = useState("");
  const [montant, setMontant] = useState("");
  const [methode, setMethode] = useState("virement");
  const [q, setQ] = useState("");
  const [filterMethode, setFilterMethode] = useState<string>("tous");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const allPayments = useMemo(() => [...locaux, ...payments], [locaux]);

  const allFiltered = useMemo(() => {
    let filtered = allPayments;
    if (filterMethode !== "tous") {
      filtered = filtered.filter((p) => p.methode === filterMethode);
    }
    if (q.trim()) {
      const t = q.toLowerCase();
      filtered = filtered.filter((p) => {
        const f = invoices.find((i) => i.id === p.factureId);
        const clientName = f ? (clientById(f.clientId)?.nom ?? "") : "";
        return (
          p.id.toLowerCase().includes(t) ||
          p.factureId.toLowerCase().includes(t) ||
          clientName.toLowerCase().includes(t)
        );
      });
    }
    return filtered.sort((a, b) => b.datePaiement.localeCompare(a.datePaiement));
  }, [allPayments, q, filterMethode]);

  const liste = useMemo(
    () => allFiltered.slice((page - 1) * perPage, page * perPage),
    [allFiltered, page, perPage],
  );

  const total = allPayments.reduce((s, p) => s + p.montant, 0);

  const methodStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    allPayments.forEach((p) => {
      const existing = map.get(p.methode) ?? { count: 0, total: 0 };
      map.set(p.methode, { count: existing.count + 1, total: existing.total + p.montant });
    });
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [allPayments]);

  const ok = useRequirePermission("paiements:view");
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
      toast.error("Montant exceeds le reste dû", {
        description: `Reste dû : ${formatTND(facture.montant - facture.montantPaye)}`,
      });
      return;
    }
    setLocaux((l) => [
      {
        id: `PAY-L${l.length + 1}`,
        factureId: facture.id,
        montant: m,
        datePaiement: new Date().toISOString().slice(0, 10),
        methode: methode as (typeof payments)[number]["methode"],
      },
      ...l,
    ]);
    toast.success("Paiement enregistré", {
      description: `${formatTND(m)} rapproché de la facture ${facture.id}.`,
    });
    setFactureId("");
    setMontant("");
  };

  return (
    <>
      <PageHeader
        title="Paiements"
        subtitle={`${allPayments.length} encaissements enregistrés · ${formatTND(total)}`}
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
                value={factureId}
                onChange={(e) => setFactureId(e.target.value)}
                placeholder="FAC-00012"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Montant (TND)</span>
              <input
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
                <th className="px-4 py-3 font-medium">Paiement</th>
                <th className="px-4 py-3 font-medium">Facture</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Méthode</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th>
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
                      {f ? clientById(f.clientId)?.nom : "—"}
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
    </>
  );
}
