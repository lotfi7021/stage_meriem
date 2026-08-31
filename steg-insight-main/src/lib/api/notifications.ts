import { api } from "../api-client";

export interface Notification {
  id: string;
  type: "impayee" | "en_retard" | "echeance_proche";
  message: string;
  clientId: string;
  clientNom: string;
  factureId: string;
  montant: number;
  date: string;
  joursRetard?: number;
}

export const notificationsApi = {
  findAll: () => api.get<Notification[]>("/notifications"),
};
