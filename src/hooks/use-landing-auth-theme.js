"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "soouqlive-landing-color-mode";

export function useLandingAuthTheme() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const root = document.documentElement;
    const prevBrand = root.getAttribute("data-brand");
    const prevMode = root.getAttribute("data-color-mode");
    const prevBodyBg = document.body.style.background;
    const prevBodyColor = document.body.style.color;

    let mode = "dark";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") mode = stored;
    } catch {
      /* ignore */
    }

    root.setAttribute("data-brand", "purple");
    root.setAttribute("data-color-mode", mode);
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    document.body.style.background = "var(--t-hero-bg)";
    document.body.style.color = "var(--t-text)";
    document.body.style.transition = "background-color 0.3s ease, color 0.3s ease";
    setTheme(mode);

    return () => {
      if (prevBrand) root.setAttribute("data-brand", prevBrand);
      else root.removeAttribute("data-brand");
      if (prevMode) root.setAttribute("data-color-mode", prevMode);
      document.body.style.background = prevBodyBg;
      document.body.style.color = prevBodyColor;
      document.body.style.transition = "";
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    const root = document.documentElement;
    root.setAttribute("data-color-mode", newTheme);
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      /* ignore */
    }
  };

  return { theme, toggleTheme };
}
