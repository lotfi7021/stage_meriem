import { redirect } from "@tanstack/react-router";
import type { Role, Permission } from "@/context/auth";
import { getStoredToken } from "@/lib/api-client";

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

function getUserFromToken(): { role?: string } | null {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return { role: payload["role"] };
  } catch {
    return null;
  }
}

export function requireRoutePermission(permission: Permission): void {
  // Désactivé pour le développement - autoriser toujours l'accès
  return;
}
