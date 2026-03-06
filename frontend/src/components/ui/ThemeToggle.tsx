"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function cycle() {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        "p-2 rounded-lg transition-colors",
        "text-gray-400 hover:text-gray-700 hover:bg-gray-100",
        "dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700"
      )}
      title={`Theme: ${theme}`}
      aria-label={`Switch theme (current: ${theme})`}
    >
      {theme === "light" && <Sun size={18} />}
      {theme === "dark" && <Moon size={18} />}
      {theme === "system" && <Monitor size={18} />}
    </button>
  );
}
