import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeValue {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

const STORAGE_KEY = "steg-fintech-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (raw && ["light", "dark", "system"].includes(raw)) {
      setThemeState(raw);
    }
  }, []);

  useEffect(() => {
    const r = theme === "system" ? getSystemTheme() : theme;
    setResolved(r);
    applyTheme(r);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const r = getSystemTheme();
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const value = useMemo<ThemeValue>(
    () => ({
      theme,
      resolved,
      setTheme: setThemeState,
      toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
