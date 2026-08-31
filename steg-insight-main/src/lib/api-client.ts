import axios from "axios";

const API_BASE = import.meta.env["VITE_API_URL"] ?? "http://localhost:3002";

const TOKEN_KEY = "steg_access_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getStoredToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      isBrowser() &&
      err.response?.status === 401 &&
      !window.location.pathname.startsWith("/login")
    ) {
      clearStoredToken();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);
