"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";

export type Theme = "light" | "dark";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = React.createContext<ThemeProviderContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const router = useRouter();

  const applyTheme = React.useCallback((newTheme: Theme) => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    root.classList.toggle("dark", newTheme === "dark");
  }, []);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.cookie = `spot-theme=${newTheme}; path=/; max-age=31536000`;
    applyTheme(newTheme);
    
    React.startTransition(() => {
      router.refresh();
    });
  }, [applyTheme, router]);

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => React.useContext(ThemeProviderContext);
