import { api } from "../api-client";

export interface User {
  id: string;
  nom: string;
  email: string;
  role: "admin" | "agent";
}

export interface CreateUserDto {
  nom: string;
  email: string;
  motDePasse: string;
  role: "admin" | "agent";
}

export type UpdateUserDto = Partial<Omit<CreateUserDto, "motDePasse"> & { motDePasse: string }>;

export const usersApi = {
  findAll: () => api.get<User[]>("/users"),

  create: (data: CreateUserDto) => api.post<User>("/users", data),

  update: (id: string, data: UpdateUserDto) =>
    api.patch<User>(`/users/${id}`, data),

  remove: (id: string) => api.delete(`/users/${id}`),
};
