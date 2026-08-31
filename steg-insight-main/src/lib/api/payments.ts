import { api } from "../api-client";

export interface Payment {
  id: string;
  factureId: string;
  montant: number;
  datePaiement: string;
  methode: "virement" | "especes" | "cheque" | "en_ligne";
}

export interface CreatePaymentDto {
  factureId: string;
  montant: number;
  datePaiement: string;
  methode: "virement" | "especes" | "cheque" | "en_ligne";
}

export type UpdatePaymentDto = Partial<CreatePaymentDto>;

export const paymentsApi = {
  findAll: () => api.get<Payment[]>("/payments"),

  findOne: (id: string) => api.get<Payment>(`/payments/${id}`),

  create: (data: CreatePaymentDto) => api.post<Payment>("/payments", data),

  update: (id: string, data: UpdatePaymentDto) =>
    api.patch<Payment>(`/payments/${id}`, data),

  remove: (id: string) => api.delete(`/payments/${id}`),
};
