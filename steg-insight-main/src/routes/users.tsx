import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { requireRoutePermission } from "@/lib/route-guard";
import { PageHeader } from "@/components/steg/kpi-card";
import { ConfirmDialog } from "@/components/steg/confirm-dialog";
import { UnauthorizedPage } from "@/components/steg/unauthorized-page";
import { Pagination, PerPageSelect } from "@/components/steg/pagination";
import { roleLabels, type Role } from "@/context/auth";
import { Search, Plus, Pencil, Trash2, Users as UsersIcon } from "lucide-react";
import { DEFAULT_PER_PAGE } from "@/lib/store";
import type { User } from "@/lib/api";

export const Route = createFileRoute("/users")({
  beforeLoad: () => {
    requireRoutePermission("users:manage");
  },
  head: () => ({
    meta: [
      { title: "Gestion des utilisateurs — STEG FinTech" },
      {
        name: "description",
        content:
          "Administration des utilisateurs de la plateforme STEG FinTech : comptes, rôles et permissions.",
      },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const ok = useRequirePermission("users:manage");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const rows = useMemo(
    () =>
      users.filter(
        (u) =>
          u.nom.toLowerCase().includes(q.toLowerCase().trim()) ||
          u.email.toLowerCase().includes(q.toLowerCase().trim()),
      ),
    [q, users],
  );

  const paginatedRows = rows.slice((page - 1) * perPage, page * perPage);

  if (!ok) return <UnauthorizedPage />;

  function handleCreate(data: { nom: string; email: string; motDePasse: string; role: Role }) {
    createUser.mutateAsync(data).then(() => {
      setShowForm(false);
    });
  }

  function handleUpdate(data: { nom: string; email: string; role: Role; motDePasse?: string }) {
    if (!editUser) return;
    updateUser.mutateAsync({ id: editUser.id, data }).then(() => {
      setEditUser(null);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteUser.mutateAsync(deleteTarget.id).then(() => {
      setDeleteTarget(null);
    });
  }

  const roleBadge: Record<Role, string> = {
    admin: "bg-primary/10 text-primary",
    agent: "bg-success/12 text-success",
  };

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes et des rôles de la plateforme."
        action={{
          label: "Nouvel utilisateur",
          icon: Plus,
          onClick: () => setShowForm(true),
        }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un utilisateur…"
            aria-label="Rechercher un utilisateur"
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <PerPageSelect
          value={perPage}
          onChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
          options={[10, 20, 50]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Nom
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Rôle
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedRows.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                      {u.nom
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span className="font-medium text-foreground">{u.nom}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadge[u.role]}`}
                  >
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditUser(u)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="Modifier"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/12 hover:text-danger"
                      title="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
        )}
        <Pagination page={page} total={rows.length} perPage={perPage} onPageChange={setPage} />
      </div>

      {showForm && <UserForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
      {editUser && (
        <UserForm user={editUser} onSubmit={handleUpdate} onCancel={() => setEditUser(null)} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer l'utilisateur"
          description={`Voulez-vous vraiment supprimer ${deleteTarget.nom} (${deleteTarget.email}) ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

function UserForm({
  user,
  onSubmit,
  onCancel,
}: {
  user?: User;
  onSubmit: (data: { nom: string; email: string; motDePasse?: string; role: Role }) => void;
  onCancel: () => void;
}) {
  const [nom, setNom] = useState(user?.nom ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "agent");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user && motDePasse.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setError("");
    onSubmit({ nom, email, role, ...(motDePasse ? { motDePasse } : {}) });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-scale-in">
        <h3 className="text-lg font-semibold text-foreground">
          {user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-foreground">
              Nom
            </label>
            <input
              id="nom"
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {!user && (
            <div>
              <label htmlFor="motDePasse" className="block text-sm font-medium text-foreground">
                Mot de passe
              </label>
              <input
                id="motDePasse"
                type="password"
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Min. 8 caractères"
              />
            </div>
          )}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-foreground">
              Rôle
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="admin">Administrateur</option>
              <option value="agent">Agent</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {user ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
