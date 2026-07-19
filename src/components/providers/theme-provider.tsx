"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = "light";

  useEffect(() => {
    // Force light mode on document root and clear previous settings
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("theme");
  }, []);

  const toggleTheme = () => {
    // No-op to disable changing themes
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return a safe fallback during SSR/rendering trace if context isn't fully initialized
    return { theme: "light" as Theme, toggleTheme: () => {} };
  }
  return context;
}
