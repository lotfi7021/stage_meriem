import { useAuth, type Permission } from "@/context/auth";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

interface ProtectedRouteProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ permission, children, fallback }: ProtectedRouteProps) {
  const { hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasPermission(permission)) {
      router.navigate({ to: "/" });
    }
  }, [hasPermission, permission, router]);

  if (!hasPermission(permission)) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
