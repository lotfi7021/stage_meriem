import { api } from "../api-client";
import type { RiskScore } from "@/lib/steg-data";

export const riskScoringApi = {
  findAll: () => api.get<RiskScore[]>("/risk-scores"),
};
