import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0b1324",
          800: "#1a2332",
          700: "#22303f",
          600: "#2a3a52",
        },
        success: { 600: "#16a34a", 500: "#22c55e", 400: "#4caf50" },
        error: {
          600: "#ef4444",
          500: "#f44336",
          400: "#f87171",
          300: "#fca5a5",
        },
        warning: { 600: "#d97706", 500: "#f59e0b", 400: "#fbbf24", 300: "#ffc107" },
        blue: { 600: "#2563eb", 500: "#3b82f6", 400: "#60a5fa" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
