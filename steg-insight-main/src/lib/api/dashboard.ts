import { api } from "../api-client";

export interface Kpis {
  totalFacture: number;
  totalPaye: number;
  montantImpaye: number;
  tauxRecouvrement: number;
  tauxImpaye: number;
  nbFactures: number;
  nbImpayees: number;
  nbClients: number;
}

export interface MonthlySeries {
  mois: string;
  facture: number;
  paye: number;
}

export interface StatusBreakdown {
  statut: string;
  key: string;
  valeur: number;
}

export const dashboardApi = {
  kpis: () => api.get<Kpis>("/dashboard/kpis"),

  monthlySeries: () => api.get<MonthlySeries[]>("/dashboard/monthly-series"),

  statusBreakdown: () => api.get<StatusBreakdown[]>("/dashboard/status-breakdown"),
};
