import { useEffect, useState } from "react";

const STORAGE_KEY = "theme-preference";

function getSystemPrefersDark() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyTheme(theme) {
  const body = document.body;

  // Resolve actual theme: "light" | "dark"
  const resolved =
    theme === "system" ? (getSystemPrefersDark() ? "dark" : "light") : theme;

  // Remove old classes and add the new one
  body.classList.remove("theme-light", "theme-dark");
  body.classList.add(resolved === "dark" ? "theme-dark" : "theme-light");

  // Let the browser know which color scheme we're using
  body.style.colorScheme = resolved;
}

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    // load from localStorage if present
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
    return "system"; // default
  });

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // If using "system", react to OS light/dark changes
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return { theme, setTheme };
}
