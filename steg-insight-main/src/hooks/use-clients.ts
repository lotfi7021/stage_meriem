import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi, type CreateClientDto, type UpdateClientDto } from "@/lib/api";
import { toast } from "sonner";

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsApi.findAll().then((r) => r.data),
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientDto) => clientsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client créé avec succès");
    },
    onError: () => toast.error("Erreur lors de la création du client"),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      clientsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Client supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
