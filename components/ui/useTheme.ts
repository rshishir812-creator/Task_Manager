"use client";

import { useEffect, useState } from "react";

// Dark-mode state shared by ThemeToggle and the header avatar menu. Reads the
// initial value from the <html> class (set by the no-flash inline script /
// previous toggle), and persists changes to localStorage + the DOM.
export function useTheme() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return { mounted, isDark, toggle };
}
