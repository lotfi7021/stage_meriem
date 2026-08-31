import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type CreateUserDto, type UpdateUserDto } from "@/lib/api";
import { toast } from "sonner";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.findAll().then((r) => r.data),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur créé");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
