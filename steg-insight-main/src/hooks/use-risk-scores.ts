import { useQuery } from "@tanstack/react-query";
import { riskScoringApi } from "@/lib/api";

export function useRiskScores() {
  return useQuery({
    queryKey: ["risk-scores"],
    queryFn: () => riskScoringApi.findAll().then((r) => r.data),
  });
}
