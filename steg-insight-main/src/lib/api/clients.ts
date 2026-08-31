import { api } from "../api-client";

export interface Client {
  id: string;
  nom: string;
  type: "particulier" | "entreprise" | "administration";
  secteur: string;
  adresse: string;
  ancienneteMois: number;
  retardsPasses: number;
  delaiMoyenJours: number;
}

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

  findOne: (id: string) => api.get<Client>(`/clients/${id}`),

  create: (data: CreateClientDto) => api.post<Client>("/clients", data),

  update: (id: string, data: UpdateClientDto) =>
    api.patch<Client>(`/clients/${id}`, data),

  remove: (id: string) => api.delete(`/clients/${id}`),
};
