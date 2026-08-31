import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, type CreatePaymentDto, type UpdatePaymentDto } from "@/lib/api";
import { toast } from "sonner";

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsApi.findAll().then((r) => r.data),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentDto) => paymentsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Paiement enregistré");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement du paiement"),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentDto }) =>
      paymentsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Paiement mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Paiement supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
