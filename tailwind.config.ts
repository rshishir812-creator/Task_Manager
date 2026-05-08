import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        "accent-teal": "var(--accent-teal)",
        "accent-amber": "var(--accent-amber)",
        border: "var(--border)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { transform: "scale(1) rotate(-2deg)" },
          "25%": { transform: "scale(1.1) rotate(2deg)" },
          "75%": { transform: "scale(0.95) rotate(-1deg)" },
        },
      },
      animation: {
        flicker: "flicker 1.5s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
        display: ["var(--font-baloo)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
