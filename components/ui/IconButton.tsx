import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variante = "ghost" | "secondary" | "primary" | "inverse";

const VARIANTES: Record<Variante, string> = {
  ghost: "text-ink-700 hover:bg-ink-100 active:bg-ink-200",
  secondary: "bg-white border border-ink-300 text-ink-800 hover:bg-ink-50",
  primary: "bg-brand text-white hover:bg-brand-700 active:bg-brand-800",
  // Para fondos oscuros (espresso)
  inverse: "text-ink-100 hover:bg-espresso-hover active:bg-espresso-active",
};

const TAMANOS = { md: "h-11 w-11", sm: "h-9 w-9", lg: "h-12 w-12" };

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Obligatorio: un botón de solo ícono sin nombre no es accesible. */
  "aria-label": string;
  variant?: Variante;
  size?: keyof typeof TAMANOS;
  children: ReactNode;
}

export default function IconButton({
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  children,
  ...resto
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center rounded-control transition-colors",
        "active:scale-[.97] disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTES[variant],
        TAMANOS[size],
        className
      )}
      {...resto}
    >
      {children}
    </button>
  );
}
