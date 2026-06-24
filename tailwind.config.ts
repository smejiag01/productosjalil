import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: {
          DEFAULT: "#1E1E2D",
          hover: "#2A2A3C",
          active: "#2E2E40",
        },
        brand: {
          DEFAULT: "#8B1A1A",
          light: "#A52828",
          dark: "#6B1414",
        },
      },
    },
  },
  plugins: [],
};
export default config;
