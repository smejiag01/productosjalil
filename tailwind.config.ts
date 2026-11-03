import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import {
  acento,
  estadosPedido,
  grisCompatible,
  marca,
  semantica,
  superficies,
  tinta,
} from "./lib/design/tokens";

const EASING = "cubic-bezier(.2,.8,.2,1)";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // lib/pedidos.ts define clases de las insignias de estado
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Marca: pimentón. light/dark son alias de las pantallas sin migrar:
        // todos los hover (antes "light" y "dark") ahora oscurecen.
        brand: {
          DEFAULT: marca[600],
          light: marca[700],
          dark: marca[800],
          50: marca[50],
          100: marca[100],
          600: marca[600],
          700: marca[700],
          800: marca[800],
        },
        ink: { ...tinta },
        // Alias de compatibilidad: la escala "gray" (azulada) pasa a neutros
        // cálidos. Se elimina en la fase de limpieza.
        gray: { ...grisCompatible },
        paper: superficies.papel,
        espresso: {
          DEFAULT: superficies.espresso,
          hover: superficies.espressoHover,
          active: superficies.espressoActivo,
        },
        // Alias del sidebar anterior: ahora es el espresso.
        sidebar: {
          DEFAULT: superficies.espresso,
          hover: superficies.espressoHover,
          active: superficies.espressoActivo,
        },
        accent: acento,
        ok: { DEFAULT: semantica.ok, soft: semantica.okSuave },
        warn: {
          DEFAULT: semantica.advertencia,
          soft: semantica.advertenciaSuave,
          "soft-text": semantica.advertenciaTextoSuave,
        },
        info: { DEFAULT: semantica.info, soft: semantica.infoSuave },
        danger: { DEFAULT: semantica.peligro, soft: semantica.peligroSuave },
        estado: {
          pendiente: estadosPedido.pendiente.fondo,
          "en-proceso": estadosPedido.en_proceso.fondo,
          confirmado: estadosPedido.confirmado.fondo,
          "en-reparto": estadosPedido.en_reparto.fondo,
          entregado: estadosPedido.entregado.fondo,
          devuelto: estadosPedido.devuelto.fondo,
          cancelado: estadosPedido.cancelado.fondo,
        },
      },
      fontFamily: {
        sans: [
          "var(--font-text)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["var(--font-display)", "Georgia", "Cambria", "serif"],
      },
      borderRadius: {
        control: "10px",
        card: "16px",
        sheet: "24px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(35,24,21,.06)",
        card: "0 1px 3px 0 rgba(35,24,21,.08), 0 1px 2px 0 rgba(35,24,21,.04)",
        raised: "0 8px 20px -6px rgba(35,24,21,.16)",
        sheet: "0 -8px 32px 0 rgba(35,24,21,.18)",
      },
      keyframes: {
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "check-draw": {
          from: { strokeDashoffset: "30" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "sheet-up": `sheet-up 300ms ${EASING} both`,
        "slide-in-left": `slide-in-left 300ms ${EASING} both`,
        "fade-in": `fade-in 200ms ${EASING} both`,
        pop: `pop 300ms ${EASING}`,
        shimmer: "shimmer 1.6s linear infinite",
        "check-draw": `check-draw 500ms ${EASING} 150ms both`,
      },
    },
  },
  plugins: [
    // Áreas seguras de iPhone/Android (barra inferior, notch).
    plugin(({ addUtilities }) => {
      addUtilities({
        ".pb-safe": { paddingBottom: "env(safe-area-inset-bottom)" },
        ".pt-safe": { paddingTop: "env(safe-area-inset-top)" },
        ".bottom-safe": { bottom: "env(safe-area-inset-bottom)" },
      });
    }),
  ],
};
export default config;
