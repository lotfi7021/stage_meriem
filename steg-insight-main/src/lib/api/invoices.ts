import { api } from "../api-client";
import type { Invoice } from "@/lib/steg-data";

export interface CreateInvoiceDto {
  clientId: string;
  montant: number;
  dateEmission: string;
  dateEcheance: string;
  montantPaye?: number;
}

export type UpdateInvoiceDto = Partial<CreateInvoiceDto>;

export interface InvoiceFilters {
  statut?: string;
  clientId?: string;
  dateDebut?: string;
  dateFin?: string;
}

export const invoicesApi = {
  findAll: (filters?: InvoiceFilters) =>
    api.get<Invoice[]>("/invoices", { params: filters }),

  create: (data: CreateInvoiceDto) => api.post<Invoice>("/invoices", data),

  update: (id: string, data: UpdateInvoiceDto) =>
    api.patch<Invoice>(`/invoices/${id}`, data),

  remove: (id: string) => api.delete(`/invoices/${id}`),
};
