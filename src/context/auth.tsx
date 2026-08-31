import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "admin" | "agent" | "direction";

export type Permission =
  | "dashboard:view"
  | "clients:view"
  | "clients:manage"
  | "factures:view"
  | "factures:manage"
  | "paiements:view"
  | "paiements:manage"
  | "risques:view"
  | "rapports:view"
  | "rapports:manage"
  | "notifications:view"
  | "notifications:manage"
  | "users:manage";

export interface SessionUser {
  nom: string;
  email: string;
  role: Role;
}

export const roleLabels: Record<Role, string> = {
  admin: "Administrateur",
  agent: "Agent financier",
  direction: "Direction",
};

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "dashboard:view",
    "clients:view",
    "clients:manage",
    "factures:view",
    "factures:manage",
    "paiements:view",
    "paiements:manage",
    "risques:view",
    "rapports:view",
    "rapports:manage",
    "notifications:view",
    "notifications:manage",
    "users:manage",
  ],
  agent: [
    "dashboard:view",
    "clients:view",
    "factures:view",
    "factures:manage",
    "paiements:view",
    "paiements:manage",
    "notifications:view",
    "notifications:manage",
  ],
  direction: [
    "dashboard:view",
    "clients:view",
    "risques:view",
    "rapports:view",
    "rapports:manage",
    "notifications:view",
  ],
};

const DEFAULT_USER: SessionUser = {
  nom: "Lotfi Makhlouf",
  email: "l.makhlouf@steg.com.tn",
  role: "admin",
};

interface AuthValue {
  user: SessionUser;
  setUser: (u: SessionUser) => void;
  signOut: () => void;
  hasPermission: (p: Permission) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

const STORAGE_KEY = "steg-fintech-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SessionUser>(DEFAULT_USER);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUserState(JSON.parse(raw) as SessionUser);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      setUser: (u) => {
        setUserState(u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      },
      signOut: () => {
        setUserState(DEFAULT_USER);
        localStorage.removeItem(STORAGE_KEY);
      },
      hasPermission: (p: Permission) => {
        return rolePermissions[user.role]?.includes(p) ?? false;
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
