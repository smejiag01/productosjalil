"use client";

import { cn } from "@/lib/cn";
import { Minus, Plus } from "./icons";

const TAMANOS = {
  md: { boton: "h-11 w-11", numero: "min-w-[2.5rem] text-base" },
  lg: { boton: "h-12 w-12", numero: "min-w-[3rem] text-lg" },
} as const;

/**
 * Selector de cantidad −/+ con objetivos táctiles de 44 px o más. `label` es el
 * nombre del producto, para que los lectores de pantalla digan qué cambia.
 */
export default function QtyStepper({
  value,
  onIncrement,
  onDecrement,
  label,
  size = "md",
  className,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  size?: keyof typeof TAMANOS;
  className?: string;
}) {
  const t = TAMANOS[size];
  return (
    <div
      role="group"
      aria-label={`Cantidad de ${label}`}
      className={cn("inline-flex items-center rounded-control bg-ink-100 p-0.5", className)}
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label={`Quitar una unidad de ${label}`}
        className={cn(
          "flex items-center justify-center rounded-[9px] text-ink-800 transition-colors hover:bg-white active:scale-95",
          t.boton
        )}
      >
        <Minus aria-hidden="true" className="h-5 w-5" />
      </button>
      <span
        aria-live="polite"
        className={cn("text-center font-bold tabular-nums text-ink-900", t.numero)}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Agregar una unidad de ${label}`}
        className={cn(
          "flex items-center justify-center rounded-[9px] bg-brand text-white transition-colors hover:bg-brand-700 active:scale-95",
          t.boton
        )}
      >
        <Plus aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
}
