import { api } from "../api-client";

export interface RiskScore {
  clientId: string;
  score: number;
  categorie: "faible" | "moyen" | "eleve";
  dateCalcul: string;
  facteurs: { label: string; poids: number }[];
}

export const riskScoringApi = {
  findAll: () => api.get<RiskScore[]>("/risk-scores"),

  findOne: (clientId: string) => api.get<RiskScore>(`/risk-scores/${clientId}`),
};
