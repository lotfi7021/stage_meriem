import { api } from "../api-client";
import type { Client } from "@/lib/steg-data";

export interface CreateClientDto {
  nom: string;
  type: "particulier" | "entreprise" | "administration";
  secteur: string;
  adresse: string;
  ancienneteMois: number;
  retardsPasses: number;
  delaiMoyenJours: number;
}

export type UpdateClientDto = Partial<CreateClientDto>;

export const clientsApi = {
  findAll: () => api.get<Client[]>("/clients"),

  create: (data: CreateClientDto) => api.post<Client>("/clients", data),

  update: (id: string, data: UpdateClientDto) =>
    api.patch<Client>(`/clients/${id}`, data),

  remove: (id: string) => api.delete(`/clients/${id}`),
};
