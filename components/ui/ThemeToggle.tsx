"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ui/useTheme";

export default function ThemeToggle() {
  const { mounted, isDark, toggle } = useTheme();

  if (!mounted) {
    // Prevent hydration mismatch — render empty placeholder same size
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-elevated border border-[var(--border)] text-fg-muted transition-colors hover:text-fg focus:outline-none focus:ring-2 focus:ring-accent-teal"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
