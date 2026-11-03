import { cn } from "@/lib/cn";

/**
 * Cadenas de clases compartidas. Viven en un archivo sin "use client" para que
 * las usen tanto los componentes como cualquier página de servidor.
 */

export type VarianteBoton =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "accent"
  | "success";
export type TamanoBoton = "sm" | "md" | "lg" | "xl";

const BOTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold select-none " +
  "transition-[background-color,transform,box-shadow] duration-150 active:scale-[.98] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const BOTON_VARIANTE: Record<VarianteBoton, string> = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-white text-ink-900 border border-ink-300 hover:bg-ink-50 active:bg-ink-100",
  ghost: "text-ink-700 hover:bg-ink-100 active:bg-ink-200",
  danger: "bg-danger text-white shadow-sm hover:bg-[#961A22] active:bg-[#7E151C]",
  accent: "bg-accent text-ink-900 shadow-sm hover:bg-[#CD951A] active:bg-[#B88515]",
  success: "bg-ok text-white shadow-sm hover:bg-[#245A34] active:bg-[#1C4829]",
};

const BOTON_TAMANO: Record<TamanoBoton, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  xl: "h-14 px-6 text-base",
};

export function buttonClass(opciones?: {
  variant?: VarianteBoton;
  size?: TamanoBoton;
  fullWidth?: boolean;
  className?: string;
}): string {
  const { variant = "primary", size = "md", fullWidth, className } = opciones ?? {};
  return cn(
    BOTON_BASE,
    BOTON_VARIANTE[variant],
    BOTON_TAMANO[size],
    fullWidth && "w-full",
    className
  );
}

export function inputClass(opciones?: { invalid?: boolean; className?: string }): string {
  const { invalid, className } = opciones ?? {};
  return cn(
    "block w-full h-11 rounded-control border bg-white px-3 text-base sm:text-sm text-ink-900",
    "placeholder:text-ink-500 outline-none transition-colors",
    "focus:ring-2 disabled:bg-ink-100 disabled:text-ink-600 disabled:cursor-not-allowed",
    invalid
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-ink-300 focus:border-brand focus:ring-brand/20",
    className
  );
}

export function textareaClass(opciones?: { invalid?: boolean; className?: string }): string {
  // Misma apariencia que el input pero sin altura fija.
  return inputClass(opciones).replace("h-11", "min-h-[96px] py-2.5");
}

export type TonoBadge = "neutral" | "brand" | "ok" | "warn" | "info" | "danger" | "accent";

export const BADGE_SUAVE: Record<TonoBadge, string> = {
  neutral: "bg-ink-100 text-ink-800 border-ink-300",
  brand: "bg-brand-50 text-brand-800 border-brand-100",
  ok: "bg-ok-soft text-ok border-ok/30",
  warn: "bg-warn-soft text-warn-soft-text border-warn/50",
  info: "bg-info-soft text-info border-info/30",
  danger: "bg-danger-soft text-danger border-danger/30",
  accent: "bg-accent/20 text-ink-900 border-accent/50",
};

export const BADGE_SOLIDO: Record<TonoBadge, string> = {
  neutral: "bg-ink-800 text-white border-transparent",
  brand: "bg-brand text-white border-transparent",
  ok: "bg-ok text-white border-transparent",
  warn: "bg-warn text-ink-900 border-transparent",
  info: "bg-info text-white border-transparent",
  danger: "bg-danger text-white border-transparent",
  accent: "bg-accent text-ink-900 border-transparent",
};
