import { useAuth, type Permission } from "@/context/auth";

export function useRequirePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}
