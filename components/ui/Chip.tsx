import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Chip/pestaña tipo píldora para filtros y categorías. `selected` lo marca
 * visualmente y para lectores de pantalla (aria-pressed). `count` muestra un
 * contador opcional.
 */
export default function Chip({
  selected,
  count,
  className,
  children,
  type = "button",
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors",
        selected
          ? "border-brand bg-brand text-white"
          : "border-ink-300 bg-white text-ink-800 hover:bg-ink-50",
        className
      )}
      {...resto}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums",
            selected ? "bg-white/25 text-white" : "bg-ink-100 text-ink-700"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
