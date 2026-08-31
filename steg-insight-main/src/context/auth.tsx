import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, type SessionUser } from "@/lib/api";
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "@/lib/api-client";

export type Role = "admin" | "agent";

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

export const roleLabels: Record<Role, string> = {
  admin: "Administrateur",
  agent: "Agent",
};

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "dashboard:view",
    "clients:view",
    "factures:view",
    "paiements:view",
    "risques:view",
    "rapports:view",
    "notifications:view",
    "users:manage",
  ],
  agent: [
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
  ],
};

interface AuthValue {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, motDePasse: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (p: Permission) => boolean;
}

function getUserFromToken(): SessionUser | null {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.sub,
      nom: payload.email?.split("@")[0] ?? "User",
      email: payload.email,
      role: payload.role,
    };
  } catch {
    clearStoredToken();
    return null;
  }
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getUserFromToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((res) => {
        setUser({
          id: res.data.userId,
          nom: res.data.nom || res.data.email.split("@")[0] || res.data.email,
          email: res.data.email,
          role: res.data.role as Role,
        });
      })
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, motDePasse: string) => {
    const res = await authApi.login({ email, motDePasse });
    setStoredToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      hasPermission: (p: Permission) => {
        if (!user) return false;
        return rolePermissions[user.role]?.includes(p) ?? false;
      },
    }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
