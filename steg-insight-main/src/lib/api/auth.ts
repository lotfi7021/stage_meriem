import { api } from "../api-client";

export interface LoginPayload {
  email: string;
  motDePasse: string;
}

export interface SessionUser {
  id: string;
  nom: string;
  email: string;
  role: "admin" | "agent";
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<{ accessToken: string; user: SessionUser }>("/auth/login", data),

  logout: () => api.post<{ loggedOut: boolean }>("/auth/logout"),

  me: () => api.get<{ userId: string; email: string; role: string }>("/auth/me"),
};
