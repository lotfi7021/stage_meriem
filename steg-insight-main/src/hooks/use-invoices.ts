import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, type CreateInvoiceDto, type UpdateInvoiceDto, type InvoiceFilters } from "@/lib/api";
import { toast } from "sonner";

export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => invoicesApi.findAll(filters).then((r) => r.data),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesApi.findOne(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceDto) => invoicesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Facture créée avec succès");
    },
    onError: () => toast.error("Erreur lors de la création de la facture"),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceDto }) =>
      invoicesApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Facture mise à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Facture supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
