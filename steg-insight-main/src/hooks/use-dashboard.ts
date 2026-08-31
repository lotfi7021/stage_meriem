import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";

export function useKpis() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => dashboardApi.kpis().then((r) => r.data),
  });
}

export function useMonthlySeries() {
  return useQuery({
    queryKey: ["dashboard", "monthly-series"],
    queryFn: () => dashboardApi.monthlySeries().then((r) => r.data),
  });
}

export function useStatusBreakdown() {
  return useQuery({
    queryKey: ["dashboard", "status-breakdown"],
    queryFn: () => dashboardApi.statusBreakdown().then((r) => r.data),
  });
}
