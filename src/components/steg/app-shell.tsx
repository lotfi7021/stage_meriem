import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  ShieldAlert,
  BarChart3,
  Zap,
  Bell,
  BellDot,
  Sun,
  Moon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth, roleLabels, type Role, type Permission } from "@/context/auth";
import { useTheme } from "@/context/theme";
import { invoices } from "@/lib/steg-data";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
}

const nav: NavItem[] = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, permission: "dashboard:view" },
  { to: "/clients", label: "Clients", icon: Users, permission: "clients:view" },
  { to: "/factures", label: "Factures", icon: FileText, permission: "factures:view" },
  { to: "/paiements", label: "Paiements", icon: CreditCard, permission: "paiements:view" },
  { to: "/risques", label: "Analyse de risque", icon: ShieldAlert, permission: "risques:view" },
  { to: "/rapports", label: "Rapports", icon: BarChart3, permission: "rapports:view" },
  { to: "/notifications", label: "Notifications", icon: BellDot, permission: "notifications:view" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, setUser, hasPermission } = useAuth();
  const { resolved, toggle } = useTheme();
  const alertes = invoices.filter((i) => i.statut === "en_retard" || i.statut === "impayee").length;

  const visibleNav = nav.filter((item) => hasPermission(item.permission));

  const roleColors: Record<Role, string> = {
    admin: "bg-primary/10 text-primary",
    agent: "bg-success/12 text-success",
    direction: "bg-warning/18 text-warning-foreground",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">STEG FinTech</p>
            <p className="text-xs text-sidebar-foreground/60">Plateforme intelligente</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {visibleNav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
          Données simulées & anonymisées
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/90 px-6 py-3 backdrop-blur">
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {visibleNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            {hasPermission("notifications:view") && (
              <Link
                to="/notifications"
                className="relative grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                <Bell className="size-4" />
                {alertes > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
                    {alertes}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={toggle}
              aria-label="Changer de thème"
              className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              {resolved === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <span
              className={cn(
                "hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-block",
                roleColors[user.role],
              )}
            >
              {roleLabels[user.role]}
            </span>
            <div className="text-right">
              <p className="text-sm font-medium leading-tight text-foreground">{user.nom}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
            </div>
            <select
              aria-label="Changer de rôle"
              value={user.role}
              onChange={(e) => setUser({ ...user, role: e.target.value as Role })}
              className="rounded-md border border-input bg-card px-2 py-1.5 text-xs text-foreground"
            >
              {(Object.keys(roleLabels) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
