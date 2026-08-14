"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "soouqlive-landing-color-mode";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Initialize theme from document
    const isDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-color-mode") === "dark";
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-color-mode", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-color-mode", "light");
    }

    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      /* ignore */
    }
  };

  if (!theme) return null; // Avoid hydration mismatch

  return (
    <button
      onClick={toggleTheme}
      className="glass-btn flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {theme === "light" ? (
        <Moon className="size-5 text-indigo-600" />
      ) : (
        <Sun className="size-5 text-amber-500" />
      )}
    </button>
  );
}
