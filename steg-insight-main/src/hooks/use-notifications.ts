import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.findAll().then((r) => r.data),
  });
}
